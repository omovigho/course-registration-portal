const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");
const { mapRegistration, mapRegistrationItem } = require("./mappers");

class RegistrationService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  ensureApprovedSchoolFees(studentId, academicYearId) {
    const payment = this.db
      .prepare(
        `SELECT status FROM schoolfeepayment WHERE student_id = ? AND academic_year_id = ?`
      )
      .get(studentId, academicYearId);

    if (!payment || payment.status !== "approved") {
      throw new HttpError(400, "Please pay your school fees for this academic year and wait for admin approval before registering courses.");
    }
  }

  getRegistrationWithItems(registrationId) {
    const registrationRow = this.db.prepare("SELECT * FROM courseregistration WHERE id = ?").get(registrationId);
    if (!registrationRow) {
      throw new HttpError(404, "Registration not found");
    }
    const items = this.db
      .prepare("SELECT * FROM courseregistrationitem WHERE registration_id = ? ORDER BY created_at")
      .all(registrationId);
    return mapRegistration(registrationRow, items);
  }

  createRegistration(student, payload) {
    const academicYearIdRaw = payload.academic_year_id;
    const academicYearId = Number(academicYearIdRaw);
    if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
      throw new HttpError(400, "academic_year_id must be a positive integer");
    }
    const academicYear = this.db.prepare("SELECT * FROM academicyear WHERE id = ?").get(academicYearId);
    if (!academicYear) {
      throw new HttpError(404, "Academic year not found");
    }
    const existing = this.db
      .prepare(
        `SELECT 1 FROM courseregistration WHERE student_id = ? AND academic_year_id = ? LIMIT 1`
      )
      .get(student.id, academicYearId);
    if (existing) {
      throw new HttpError(400, "Registration already exists for this academic year");
    }

    this.ensureApprovedSchoolFees(student.id, academicYearId);

    const createdAt = nowUtc();
    const insert = this.db.prepare(
      `INSERT INTO courseregistration (student_id, academic_year_id, submitted, submitted_at, created_at)
       VALUES (?, ?, 0, NULL, ?)`
    );
    const result = insert.run(student.id, academicYearId, createdAt);
    return this.getRegistrationWithItems(result.lastInsertRowid);
  }

  addItem(student, registrationId, payload) {
    const registration = this.db.prepare("SELECT * FROM courseregistration WHERE id = ?").get(registrationId);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }
    if (registration.student_id !== student.id && student.role !== "admin") {
      throw new HttpError(403, "Not allowed to modify this registration");
    }

    this.ensureApprovedSchoolFees(registration.student_id, registration.academic_year_id);

    const courseIdRaw = payload.course_id;
    const courseId = Number(courseIdRaw);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new HttpError(400, "course_id must be a positive integer");
    }
    const course = this.db.prepare("SELECT * FROM course WHERE id = ?").get(courseId);
    if (!course || !course.is_active) {
      throw new HttpError(404, "Course not available");
    }

    const profile = this.db.prepare("SELECT * FROM studentprofile WHERE user_id = ?").get(registration.student_id);
    if (!profile) {
      throw new HttpError(400, "Student profile must be completed before registering courses");
    }
    if (profile.level === null || profile.level === undefined) {
      throw new HttpError(400, "Student level information is missing");
    }
    if (profile.level !== course.level) {
      throw new HttpError(400, "Selected course does not match the student's level");
    }

    const existingItem = this.db
      .prepare(
        `SELECT 1 FROM courseregistrationitem
         WHERE registration_id = ? AND course_id = ? AND status = 'active' LIMIT 1`
      )
      .get(registration.id, course.id);
    if (existingItem) {
      throw new HttpError(400, "Course already added");
    }

    const createdAt = nowUtc();
    const insert = this.db.prepare(
      `INSERT INTO courseregistrationitem (
        registration_id, course_id, course_code_snapshot, course_name_snapshot, status, removed_at, created_at
      ) VALUES (?, ?, ?, ?, 'active', NULL, ?)`
    );
    const result = insert.run(registration.id, course.id, course.course_code, course.course_name, createdAt);
    const itemRow = this.db.prepare("SELECT * FROM courseregistrationitem WHERE id = ?").get(result.lastInsertRowid);
    return mapRegistrationItem(itemRow);
  }

  removeItem(student, itemId) {
    const itemRow = this.db.prepare("SELECT * FROM courseregistrationitem WHERE id = ?").get(itemId);
    if (!itemRow) {
      throw new HttpError(404, "Item not found");
    }
    const registration = this.db.prepare("SELECT * FROM courseregistration WHERE id = ?").get(itemRow.registration_id);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }
    if (registration.student_id !== student.id && student.role !== "admin") {
      throw new HttpError(403, "Not allowed to modify this registration");
    }

    const removedAt = nowUtc();
    this.db
      .prepare(
        `UPDATE courseregistrationitem SET status = 'removed', removed_at = ? WHERE id = ?`
      )
      .run(removedAt, itemId);
    const updatedRow = this.db.prepare("SELECT * FROM courseregistrationitem WHERE id = ?").get(itemId);
    return mapRegistrationItem(updatedRow);
  }

  submitRegistration(student, registrationId, payload) {
    const registration = this.db.prepare("SELECT * FROM courseregistration WHERE id = ?").get(registrationId);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }
    if (registration.student_id !== student.id && student.role !== "admin") {
      throw new HttpError(403, "Not allowed to submit this registration");
    }

    this.ensureApprovedSchoolFees(registration.student_id, registration.academic_year_id);

    const submitted = payload?.submitted === false ? 0 : 1;
    const submittedAt = submitted ? nowUtc() : null;
    this.db
      .prepare("UPDATE courseregistration SET submitted = ?, submitted_at = ? WHERE id = ?")
      .run(submitted, submittedAt, registrationId);
    return this.getRegistrationWithItems(registrationId);
  }

  listRegistrationsForStudent(student) {
    const rows = this.db
      .prepare("SELECT * FROM courseregistration WHERE student_id = ? ORDER BY created_at")
      .all(student.id);
    return rows.map((row) => {
      const items = this.db
        .prepare("SELECT * FROM courseregistrationitem WHERE registration_id = ? ORDER BY created_at")
        .all(row.id);
      return mapRegistration(row, items);
    });
  }

  listSubmittedRegistrations(filters = {}) {
    const clauses = ["cr.submitted = 1", "cr.submitted_at IS NOT NULL"];
    const params = [];

    if (filters.academic_year_id !== undefined && filters.academic_year_id !== null) {
      clauses.push("cr.academic_year_id = ?");
      params.push(filters.academic_year_id);
    }

    const query = `
      SELECT
        cr.id AS registration_id,
        cr.academic_year_id AS academic_year_id,
        cr.submitted_at AS submitted_at,
        u.id AS student_id,
        u.full_name AS student_full_name,
        u.email AS student_email,
        sp.matric_no AS matric_no,
        sp.level AS level,
        ay.name AS academic_year_name,
        COUNT(cri.id) AS course_count
      FROM courseregistration cr
      INNER JOIN user u ON u.id = cr.student_id
      LEFT JOIN studentprofile sp ON sp.user_id = cr.student_id
      LEFT JOIN academicyear ay ON ay.id = cr.academic_year_id
      LEFT JOIN courseregistrationitem cri
        ON cri.registration_id = cr.id AND cri.status = 'active'
      WHERE ${clauses.join(" AND ")}
      GROUP BY cr.id
      ORDER BY cr.submitted_at DESC, u.full_name ASC
    `;

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => ({
      registration_id: row.registration_id,
      academic_year_id: row.academic_year_id,
      academic_year_name: row.academic_year_name,
      submitted_at: row.submitted_at,
      student_id: row.student_id,
      student_full_name: row.student_full_name,
      student_email: row.student_email,
      matric_no: row.matric_no,
      level: row.level,
      course_count: Number(row.course_count) || 0,
    }));
  }
}

module.exports = RegistrationService;
