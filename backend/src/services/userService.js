const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");
const { mapUser, mapStudentProfile, mapFaculty, mapDepartment } = require("./mappers");

const ALLOWED_ROLES = new Set(["user", "student", "lecturer", "admin"]);
const ALLOWED_LEVELS = new Set([100, 200, 300, 400, 500, 600]);

class UserService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  getById(userId) {
    const row = this.db.prepare("SELECT * FROM user WHERE id = ?").get(userId);
    if (!row) {
      throw new HttpError(404, "User not found");
    }
    return mapUser(row);
  }

  getUserWithProfile(userId) {
    const userRow = this.db.prepare("SELECT * FROM user WHERE id = ?").get(userId);
    if (!userRow) {
      throw new HttpError(404, "User not found");
    }
    const profileRow = this.db.prepare("SELECT * FROM studentprofile WHERE user_id = ?").get(userId);
    const user = mapUser(userRow);
    user.student_profile = mapStudentProfile(profileRow);
    return user;
  }

  updateRole(userId, role) {
    if (!ALLOWED_ROLES.has(role)) {
      throw new HttpError(400, "Invalid role supplied");
    }
    const update = this.db.prepare("UPDATE user SET role = ? WHERE id = ?");
    const result = update.run(role, userId);
    if (result.changes === 0) {
      throw new HttpError(404, "User not found");
    }
    return this.getById(userId);
  }

  createStudentProfile(user, payload) {
    const matricNo = payload.matric_no?.trim();
    if (!matricNo) {
      throw new HttpError(400, "matric_no is required");
    }
    const yearOfEntry = Number(payload.year_of_entry);
    if (!Number.isInteger(yearOfEntry)) {
      throw new HttpError(400, "year_of_entry must be an integer");
    }
    const facultyId = Number(payload.faculty_id);
    if (!Number.isInteger(facultyId) || facultyId <= 0) {
      throw new HttpError(400, "faculty_id must be a positive integer");
    }
    const departmentId = Number(payload.department_id);
    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      throw new HttpError(400, "department_id must be a positive integer");
    }
    const level = Number(payload.level);
    if (!Number.isInteger(level) || !ALLOWED_LEVELS.has(level)) {
      throw new HttpError(400, "level must be one of 100, 200, 300, 400, 500, 600");
    }

    const existingProfile = this.db.prepare("SELECT 1 FROM studentprofile WHERE user_id = ?").get(user.id);
    if (existingProfile) {
      throw new HttpError(400, "Profile already exists");
    }

    const matricExists = this.db
      .prepare("SELECT 1 FROM studentprofile WHERE LOWER(matric_no) = LOWER(?) LIMIT 1")
      .get(matricNo);
    if (matricExists) {
      throw new HttpError(400, "Matriculation number already in use");
    }

    const facultyRow = this.db.prepare("SELECT * FROM faculty WHERE id = ?").get(facultyId);
    if (!facultyRow) {
      throw new HttpError(404, "Faculty not found");
    }
    const departmentRow = this.db.prepare("SELECT * FROM department WHERE id = ?").get(departmentId);
    if (!departmentRow) {
      throw new HttpError(404, "Department not found");
    }
    if (departmentRow.faculty_id !== facultyRow.id) {
      throw new HttpError(400, "Department does not belong to the supplied faculty");
    }

    const matricUpper = matricNo.toUpperCase();
    const createdAt = nowUtc();

    const transaction = this.db.transaction(() => {
      const insertProfile = this.db.prepare(
        `INSERT INTO studentprofile (user_id, matric_no, year_of_entry, faculty_id, department_id, level, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      const profileResult = insertProfile.run(
        user.id,
        matricUpper,
        yearOfEntry,
        facultyId,
        departmentId,
        level,
        createdAt
      );
      this.db.prepare("UPDATE user SET role = 'student' WHERE id = ?").run(user.id);
      const profileRow = this.db.prepare("SELECT * FROM studentprofile WHERE id = ?").get(profileResult.lastInsertRowid);
      return profileRow;
    });

    const profileRow = transaction();
    return mapStudentProfile(profileRow);
  }

  listStudents(filters) {
    const queryParts = [];
    const params = [];

    if (filters?.name) {
      queryParts.push("LOWER(u.full_name) LIKE ?");
      params.push(`%${filters.name.toLowerCase()}%`);
    }
    if (filters?.matric_no) {
      queryParts.push("LOWER(sp.matric_no) LIKE ?");
      params.push(`%${filters.matric_no.toLowerCase()}%`);
    }
    if (filters?.faculty_id) {
      queryParts.push("sp.faculty_id = ?");
      params.push(filters.faculty_id);
    }
    if (filters?.department_id) {
      queryParts.push("sp.department_id = ?");
      params.push(filters.department_id);
    }

    let sql = `
      SELECT
        sp.id AS sp_id,
        sp.user_id AS sp_user_id,
        sp.matric_no AS sp_matric_no,
        sp.year_of_entry AS sp_year_of_entry,
        sp.faculty_id AS sp_faculty_id,
        sp.department_id AS sp_department_id,
        sp.level AS sp_level,
        sp.created_at AS sp_created_at,
        u.id AS u_id,
        u.email AS u_email,
        u.full_name AS u_full_name,
        u.role AS u_role,
        u.is_active AS u_is_active,
        u.created_at AS u_created_at,
        f.id AS f_id,
        f.name AS f_name,
        f.code AS f_code,
        f.created_at AS f_created_at,
        d.id AS d_id,
        d.name AS d_name,
        d.code AS d_code,
        d.created_at AS d_created_at
      FROM studentprofile sp
      JOIN user u ON u.id = sp.user_id
      JOIN faculty f ON f.id = sp.faculty_id
      JOIN department d ON d.id = sp.department_id
    `;

    if (queryParts.length > 0) {
      sql += ` WHERE ${queryParts.join(" AND ")}`;
    }
    sql += " ORDER BY u.full_name COLLATE NOCASE";

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row) => ({
      student_profile: mapStudentProfile({
        id: row.sp_id,
        user_id: row.sp_user_id,
        matric_no: row.sp_matric_no,
        year_of_entry: row.sp_year_of_entry,
        faculty_id: row.sp_faculty_id,
        department_id: row.sp_department_id,
        level: row.sp_level,
        created_at: row.sp_created_at,
      }),
      user: mapUser({
        id: row.u_id,
        email: row.u_email,
        full_name: row.u_full_name,
        role: row.u_role,
        is_active: row.u_is_active,
        created_at: row.u_created_at,
      }),
      faculty: mapFaculty({
        id: row.f_id,
        name: row.f_name,
        code: row.f_code,
        created_at: row.f_created_at,
      }),
      department: mapDepartment({
        id: row.d_id,
        name: row.d_name,
        code: row.d_code,
        faculty_id: row.sp_faculty_id,
        created_at: row.d_created_at,
      }),
    }));
  }

  exportStudentsCsvRows() {
    const records = this.listStudents();
    const result = [];

    const latestRegistrationStmt = this.db.prepare(
      `SELECT * FROM courseregistration WHERE student_id = ? ORDER BY created_at DESC LIMIT 1`
    );
    const academicYearStmt = this.db.prepare("SELECT name FROM academicyear WHERE id = ?");
    const courseCountStmt = this.db.prepare(
      `SELECT COUNT(*) AS total FROM courseregistrationitem
       WHERE registration_id = ? AND status = 'active' AND removed_at IS NULL`
    );

    for (const record of records) {
      const registration = latestRegistrationStmt.get(record.user.id);
      let academicYearName = "-";
      let totalCourses = 0;
      if (registration) {
        const year = academicYearStmt.get(registration.academic_year_id);
        if (year) {
          academicYearName = year.name;
        }
        const countRow = courseCountStmt.get(registration.id);
        totalCourses = countRow?.total || 0;
      }
      result.push({
        matric_no: record.student_profile.matric_no,
        full_name: record.user.full_name,
        faculty: record.faculty.name,
        department: record.department.name,
        academic_year: academicYearName,
        total_courses: totalCourses,
      });
    }

    return result;
  }
}

module.exports = UserService;
