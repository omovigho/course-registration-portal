const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");
const { mapSchoolFeePolicy, mapSchoolFeePayment } = require("./mappers");

const PAYMENT_STATUSES = new Set(["pending", "approved", "declined"]);

class SchoolFeeService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  listPolicies() {
    const rows = this.db
      .prepare(
        `SELECT p.*, ay.name AS academic_year_name
         FROM schoolfeepolicy p
         JOIN academicyear ay ON ay.id = p.academic_year_id
         ORDER BY ay.name DESC`
      )
      .all();
    return rows.map(mapSchoolFeePolicy);
  }

  upsertPolicy(admin, payload) {
    const academicYearIdRaw = payload.academic_year_id ?? payload.academicYearId;
    const amountRaw = payload.amount;

    const academicYearId = Number(academicYearIdRaw);
    if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
      throw new HttpError(400, "academic_year_id must be a positive integer");
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(400, "amount must be a positive number");
    }

    const academicYear = this.db.prepare("SELECT * FROM academicyear WHERE id = ?").get(academicYearId);
    if (!academicYear) {
      throw new HttpError(404, "Academic year not found");
    }

    const now = nowUtc();
    const existing = this.db.prepare("SELECT * FROM schoolfeepolicy WHERE academic_year_id = ?").get(academicYearId);

    if (existing) {
      this.db
        .prepare(
          `UPDATE schoolfeepolicy
           SET amount = ?, updated_by = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(amount, admin?.id ?? null, now, existing.id);
      return this.getPolicyById(existing.id);
    }

    const insert = this.db.prepare(
      `INSERT INTO schoolfeepolicy (
        academic_year_id, amount, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = insert.run(
      academicYearId,
      amount,
      admin?.id ?? null,
      admin?.id ?? null,
      now,
      now
    );

    return this.getPolicyById(result.lastInsertRowid);
  }

  listPayments(currentUser, filters = {}) {
    const conditions = [];
    const params = [];

    if (currentUser.role === "student") {
      conditions.push("p.student_id = ?");
      params.push(currentUser.id);
    } else if (currentUser.role === "admin") {
      if (filters.status) {
        const status = String(filters.status).toLowerCase();
        if (!PAYMENT_STATUSES.has(status)) {
          throw new HttpError(400, "Invalid status filter supplied");
        }
        conditions.push("p.status = ?");
        params.push(status);
      }

      if (filters.academic_year_id ?? filters.academicYearId) {
        const academicYearId = Number(filters.academic_year_id ?? filters.academicYearId);
        if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
          throw new HttpError(400, "academic_year_id filter must be a positive integer");
        }
        conditions.push("p.academic_year_id = ?");
        params.push(academicYearId);
      }

      if (filters.student_id ?? filters.studentId) {
        const studentId = Number(filters.student_id ?? filters.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) {
          throw new HttpError(400, "student_id filter must be a positive integer");
        }
        conditions.push("p.student_id = ?");
        params.push(studentId);
      }
    } else {
      throw new HttpError(403, "Insufficient permissions to view payments");
    }

    let sql = `
      SELECT
        p.*,
        ay.name AS academic_year_name,
        student.full_name AS student_full_name,
        student.email AS student_email,
        approver.full_name AS approver_full_name,
        approver.email AS approver_email,
        decliner.full_name AS decliner_full_name,
        decliner.email AS decliner_email
      FROM schoolfeepayment p
      JOIN academicyear ay ON ay.id = p.academic_year_id
      JOIN user student ON student.id = p.student_id
      LEFT JOIN user approver ON approver.id = p.approved_by
      LEFT JOIN user decliner ON decliner.id = p.declined_by
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    sql += " ORDER BY p.created_at DESC";

    const rows = this.db.prepare(sql).all(...params);
    return rows.map(mapSchoolFeePayment);
  }

  createPayment(student, payload) {
    if (student.role !== "student") {
      throw new HttpError(403, "Only students can create school fee payments");
    }

    const profile = this.db.prepare("SELECT * FROM studentprofile WHERE user_id = ?").get(student.id);
    if (!profile) {
      throw new HttpError(400, "Complete your student profile before paying fees");
    }

    const academicYearIdRaw = payload.academic_year_id ?? payload.academicYearId;
    const academicYearId = Number(academicYearIdRaw);
    if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
      throw new HttpError(400, "academic_year_id must be a positive integer");
    }

    const policy = this.db.prepare("SELECT * FROM schoolfeepolicy WHERE academic_year_id = ?").get(academicYearId);
    if (!policy) {
      throw new HttpError(404, "School fee amount has not been set for this academic year");
    }

    const referenceRaw = payload.payment_reference ?? payload.reference;
    const reference = typeof referenceRaw === "string" && referenceRaw.trim().length > 0
      ? referenceRaw.trim()
      : `SFP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const notes = typeof payload.notes === "string" && payload.notes.trim().length > 0
      ? payload.notes.trim()
      : null;

    const existing = this.db
      .prepare("SELECT * FROM schoolfeepayment WHERE student_id = ? AND academic_year_id = ?")
      .get(student.id, academicYearId);
    const now = nowUtc();

    if (existing) {
      if (existing.status !== "declined") {
        throw new HttpError(400, "A payment already exists for this academic year");
      }

      this.db
        .prepare(
          `UPDATE schoolfeepayment
           SET amount = ?, status = 'pending', payment_reference = ?, notes = ?,
               approved_by = NULL, approved_at = NULL,
               declined_by = NULL, declined_at = NULL, declined_reason = NULL,
               updated_at = ?
           WHERE id = ?`
        )
        .run(policy.amount, reference, notes, now, existing.id);

      return this.getPaymentById(existing.id);
    }

    const insert = this.db.prepare(
      `INSERT INTO schoolfeepayment (
        student_id, academic_year_id, amount, status, payment_reference, notes,
        approved_by, approved_at, declined_by, declined_at, declined_reason,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?)`
    );

    const result = insert.run(student.id, academicYearId, policy.amount, reference, notes, now, now);
    return this.getPaymentById(result.lastInsertRowid);
  }

  approvePayment(paymentId, admin) {
    if (admin.role !== "admin") {
      throw new HttpError(403, "Only administrators can approve payments");
    }

    const payment = this.db.prepare("SELECT * FROM schoolfeepayment WHERE id = ?").get(paymentId);
    if (!payment) {
      throw new HttpError(404, "Payment not found");
    }
    if (payment.status === "approved") {
      throw new HttpError(400, "Payment is already approved");
    }
    if (payment.status === "declined") {
      throw new HttpError(400, "Declined payments cannot be approved. Ask the student to resubmit.");
    }

    const now = nowUtc();
    this.db
      .prepare(
        `UPDATE schoolfeepayment
         SET status = 'approved', approved_by = ?, approved_at = ?,
             declined_by = NULL, declined_at = NULL, declined_reason = NULL,
             updated_at = ?
         WHERE id = ?`
      )
      .run(admin.id, now, now, paymentId);

    return this.getPaymentById(paymentId);
  }

  declinePayment(paymentId, admin, payload = {}) {
    if (admin.role !== "admin") {
      throw new HttpError(403, "Only administrators can decline payments");
    }

    const payment = this.db.prepare("SELECT * FROM schoolfeepayment WHERE id = ?").get(paymentId);
    if (!payment) {
      throw new HttpError(404, "Payment not found");
    }
    if (payment.status === "declined") {
      throw new HttpError(400, "Payment is already declined");
    }
    if (payment.status === "approved") {
      throw new HttpError(400, "Approved payments cannot be declined");
    }

    const reasonRaw = payload.reason ?? payload.decline_reason;
    const reason = typeof reasonRaw === "string" && reasonRaw.trim().length > 0 ? reasonRaw.trim() : null;
    if (!reason) {
      throw new HttpError(400, "Provide a reason when declining a payment");
    }

    const now = nowUtc();
    this.db
      .prepare(
        `UPDATE schoolfeepayment
         SET status = 'declined', declined_by = ?, declined_at = ?, declined_reason = ?,
             approved_by = NULL, approved_at = NULL, updated_at = ?
         WHERE id = ?`
      )
      .run(admin.id, now, reason, now, paymentId);

    return this.getPaymentById(paymentId);
  }

  getPolicyById(policyId) {
    const row = this.db
      .prepare(
        `SELECT p.*, ay.name AS academic_year_name
         FROM schoolfeepolicy p
         JOIN academicyear ay ON ay.id = p.academic_year_id
         WHERE p.id = ?`
      )
      .get(policyId);
    if (!row) {
      throw new HttpError(404, "Policy not found");
    }
    return mapSchoolFeePolicy(row);
  }

  getPaymentById(paymentId) {
    const row = this.db
      .prepare(
        `SELECT
           p.*,
           ay.name AS academic_year_name,
           student.full_name AS student_full_name,
           student.email AS student_email,
           approver.full_name AS approver_full_name,
           approver.email AS approver_email,
           decliner.full_name AS decliner_full_name,
           decliner.email AS decliner_email
         FROM schoolfeepayment p
         JOIN academicyear ay ON ay.id = p.academic_year_id
         JOIN user student ON student.id = p.student_id
         LEFT JOIN user approver ON approver.id = p.approved_by
         LEFT JOIN user decliner ON decliner.id = p.declined_by
         WHERE p.id = ?`
      )
      .get(paymentId);
    if (!row) {
      throw new HttpError(404, "Payment not found");
    }
    return mapSchoolFeePayment(row);
  }
}

module.exports = SchoolFeeService;
