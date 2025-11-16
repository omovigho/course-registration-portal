const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");
const { mapCourse } = require("./mappers");

const ALLOWED_LEVELS = new Set([100, 200, 300, 400, 500, 600]);

class CourseService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  getCourse(courseId) {
    const row = this.db.prepare("SELECT * FROM course WHERE id = ?").get(courseId);
    if (!row) {
      throw new HttpError(404, "Course not found");
    }
    return mapCourse(row);
  }

  ensureFacultyAndDepartment(facultyId, departmentId) {
    const faculty = this.db.prepare("SELECT * FROM faculty WHERE id = ?").get(facultyId);
    if (!faculty) {
      throw new HttpError(404, "Faculty not found");
    }
    const department = this.db.prepare("SELECT * FROM department WHERE id = ?").get(departmentId);
    if (!department) {
      throw new HttpError(404, "Department not found");
    }
    if (department.faculty_id !== faculty.id) {
      throw new HttpError(400, "Department does not belong to faculty");
    }
  }

  createCourse(creator, payload) {
    if (!payload.course_code || !payload.course_name) {
      throw new HttpError(400, "course_code and course_name are required");
    }
    const code = payload.course_code.trim().toUpperCase();
    const level = Number(payload.level);
    if (!Number.isInteger(level) || !ALLOWED_LEVELS.has(level)) {
      throw new HttpError(400, "level must be one of 100, 200, 300, 400, 500, 600");
    }
    const facultyId = Number(payload.faculty_id);
    const departmentId = Number(payload.department_id);
    if (!Number.isInteger(facultyId) || facultyId <= 0 || !Number.isInteger(departmentId) || departmentId <= 0) {
      throw new HttpError(400, "faculty_id and department_id must be positive integers");
    }
    const existing = this.db.prepare("SELECT 1 FROM course WHERE course_code = ?").get(code);
    if (existing) {
      throw new HttpError(400, "Course code already exists");
    }
    this.ensureFacultyAndDepartment(facultyId, departmentId);

    const createdAt = nowUtc();
    const insert = this.db.prepare(
      `INSERT INTO course (
        course_code, course_name, level, faculty_id, department_id, created_by, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = insert.run(
      code,
      payload.course_name,
      level,
      facultyId,
      departmentId,
      creator?.id ?? null,
      payload.is_active === false ? 0 : 1,
      createdAt,
      createdAt
    );
    const row = this.db.prepare("SELECT * FROM course WHERE id = ?").get(result.lastInsertRowid);
    return mapCourse(row);
  }

  updateCourse(courseId, actor, payload) {
    if (!actor || !["admin", "lecturer"].includes(actor.role)) {
      throw new HttpError(403, "Insufficient permissions");
    }
    const currentRow = this.db.prepare("SELECT * FROM course WHERE id = ?").get(courseId);
    if (!currentRow) {
      throw new HttpError(404, "Course not found");
    }
    if (actor.role === "lecturer" && currentRow.created_by !== actor.id) {
      throw new HttpError(403, "Lecturers can only modify their courses");
    }

    const updates = {};
    if (payload.course_name !== undefined) {
      updates.course_name = payload.course_name;
    }
    if (payload.level !== undefined) {
      const nextLevel = Number(payload.level);
      if (!Number.isInteger(nextLevel) || !ALLOWED_LEVELS.has(nextLevel)) {
        throw new HttpError(400, "level must be one of 100, 200, 300, 400, 500, 600");
      }
      updates.level = nextLevel;
    }
    let newFacultyId = currentRow.faculty_id;
    let newDepartmentId = currentRow.department_id;
    if (payload.faculty_id !== undefined) {
      const parsedFacultyId = Number(payload.faculty_id);
      if (!Number.isInteger(parsedFacultyId) || parsedFacultyId <= 0) {
        throw new HttpError(400, "faculty_id must be a positive integer");
      }
      newFacultyId = parsedFacultyId;
      updates.faculty_id = parsedFacultyId;
    }
    if (payload.department_id !== undefined) {
      const parsedDepartmentId = Number(payload.department_id);
      if (!Number.isInteger(parsedDepartmentId) || parsedDepartmentId <= 0) {
        throw new HttpError(400, "department_id must be a positive integer");
      }
      newDepartmentId = parsedDepartmentId;
      updates.department_id = parsedDepartmentId;
    }
    if (payload.is_active !== undefined) {
      updates.is_active = payload.is_active ? 1 : 0;
    }
    if (newFacultyId !== currentRow.faculty_id || newDepartmentId !== currentRow.department_id) {
      this.ensureFacultyAndDepartment(newFacultyId, newDepartmentId);
    }

    if (Object.keys(updates).length === 0) {
      return mapCourse(currentRow);
    }

    updates.updated_at = nowUtc();

    const setClauses = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updates);
    values.push(courseId);

    const statement = this.db.prepare(`UPDATE course SET ${setClauses} WHERE id = ?`);
    statement.run(...values);
    const row = this.db.prepare("SELECT * FROM course WHERE id = ?").get(courseId);
    return mapCourse(row);
  }

  deleteCourse(courseId, actor) {
    if (!actor || (actor.role !== "admin" && !(actor.role === "lecturer"))) {
      throw new HttpError(403, "Cannot delete this course");
    }
    const courseRow = this.db.prepare("SELECT * FROM course WHERE id = ?").get(courseId);
    if (!courseRow) {
      throw new HttpError(404, "Course not found");
    }
    if (actor.role === "lecturer" && courseRow.created_by !== actor.id) {
      throw new HttpError(403, "Cannot delete this course");
    }
    const result = this.db.prepare("DELETE FROM course WHERE id = ?").run(courseId);
    if (result.changes === 0) {
      throw new HttpError(404, "Course not found");
    }
  }

  listCourses(currentUser, filters = {}) {
    const conditions = [];
    const params = [];

    const parsePositiveInt = (value, fieldName) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new HttpError(400, `${fieldName} must be a positive integer`);
      }
      return parsed;
    };

    const studentDepartmentFilter = filters.department_id ?? filters.departmentId;
    const studentLevelFilter = filters.level;
    const studentFacultyFilter = filters.faculty_id ?? filters.facultyId;

    if (currentUser?.role === "student") {
      const profile = this.db.prepare("SELECT * FROM studentprofile WHERE user_id = ?").get(currentUser.id);
      if (!profile) {
        return [];
      }
      if (profile.level === null || profile.level === undefined) {
        return [];
      }

      let requestedLevel = profile.level;
      if (studentLevelFilter !== undefined && studentLevelFilter !== "") {
        const parsedLevel = Number(studentLevelFilter);
        if (!Number.isInteger(parsedLevel) || !ALLOWED_LEVELS.has(parsedLevel)) {
          throw new HttpError(400, "Invalid course level filter supplied");
        }
        requestedLevel = parsedLevel;
      }

      if (!Number.isInteger(requestedLevel) || !ALLOWED_LEVELS.has(requestedLevel)) {
        throw new HttpError(400, "Student profile has an unsupported level value");
      }

      conditions.push("faculty_id = ?");
      params.push(profile.faculty_id);
      conditions.push("level = ?");
      params.push(requestedLevel);
      conditions.push("is_active = 1");

      if (studentDepartmentFilter !== undefined && studentDepartmentFilter !== "") {
        const departmentId = parsePositiveInt(studentDepartmentFilter, "department_id");
        conditions.push("department_id = ?");
        params.push(departmentId);
      }

      if (studentFacultyFilter !== undefined && studentFacultyFilter !== "") {
        const requestedFaculty = parsePositiveInt(studentFacultyFilter, "faculty_id");
        if (requestedFaculty !== profile.faculty_id) {
          throw new HttpError(403, "Students can only view courses from their faculty");
        }
      }
    } else {
      const includeInactive = filters.include_inactive === true ||
        filters.include_inactive === "true" ||
        filters.include_inactive === "1";

      const explicitActiveFilter =
        filters.is_active === true ||
        filters.is_active === "true" ||
        filters.is_active === "1" ? 1 :
        filters.is_active === false ||
        filters.is_active === "false" ||
        filters.is_active === "0" ? 0 : undefined;

      if (explicitActiveFilter !== undefined) {
        conditions.push("is_active = ?");
        params.push(explicitActiveFilter);
      } else if (!includeInactive) {
        conditions.push("is_active = 1");
      }

      if (filters.faculty_id !== undefined && filters.faculty_id !== "") {
        const facultyId = parsePositiveInt(filters.faculty_id, "faculty_id");
        conditions.push("faculty_id = ?");
        params.push(facultyId);
      }

      if (filters.department_id !== undefined && filters.department_id !== "") {
        const departmentId = parsePositiveInt(filters.department_id, "department_id");
        conditions.push("department_id = ?");
        params.push(departmentId);
      }

      if (filters.level !== undefined && filters.level !== "") {
        const levelFilter = Number(filters.level);
        if (!Number.isInteger(levelFilter) || !ALLOWED_LEVELS.has(levelFilter)) {
          throw new HttpError(400, "Invalid course level filter supplied");
        }
        conditions.push("level = ?");
        params.push(levelFilter);
      }
    }

    let sql = "SELECT * FROM course";
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    sql += " ORDER BY course_code COLLATE NOCASE";

    const rows = this.db.prepare(sql).all(...params);
    return rows.map(mapCourse);
  }
}

module.exports = CourseService;
