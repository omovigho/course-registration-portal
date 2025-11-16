const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");
const { mapFaculty, mapDepartment } = require("./mappers");

class FacultyService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  createFaculty(payload) {
    const name = payload.name?.trim();
    const code = payload.code?.trim().toUpperCase();
    if (!name || !code) {
      throw new HttpError(400, "name and code are required");
    }

    const codeExists = this.db.prepare("SELECT 1 FROM faculty WHERE code = ?").get(code);
    if (codeExists) {
      throw new HttpError(400, "Faculty code already exists");
    }
    const nameExists = this.db.prepare("SELECT 1 FROM faculty WHERE name = ?").get(name);
    if (nameExists) {
      throw new HttpError(400, "Faculty name already exists");
    }

    const createdAt = nowUtc();
    const insert = this.db.prepare("INSERT INTO faculty (name, code, created_at) VALUES (?, ?, ?)");
    const result = insert.run(name, code, createdAt);
    const row = this.db.prepare("SELECT * FROM faculty WHERE id = ?").get(result.lastInsertRowid);
    return mapFaculty(row);
  }

  listFaculties() {
    const rows = this.db.prepare("SELECT * FROM faculty ORDER BY name COLLATE NOCASE").all();
    return rows.map(mapFaculty);
  }

  getFaculty(facultyId) {
    const row = this.db.prepare("SELECT * FROM faculty WHERE id = ?").get(facultyId);
    if (!row) {
      throw new HttpError(404, "Faculty not found");
    }
    return mapFaculty(row);
  }

  updateFaculty(facultyId, payload) {
    const updates = {};
    if (payload.name !== undefined && payload.name !== null) {
      const name = payload.name.trim();
      if (!name) {
        throw new HttpError(400, "name cannot be empty");
      }
      const conflict = this.db
        .prepare("SELECT 1 FROM faculty WHERE name = ? AND id != ?")
        .get(name, facultyId);
      if (conflict) {
        throw new HttpError(400, "Faculty name already exists");
      }
      updates.name = name;
    }
    if (payload.code !== undefined && payload.code !== null) {
      const code = payload.code.trim().toUpperCase();
      if (!code) {
        throw new HttpError(400, "code cannot be empty");
      }
      const conflict = this.db
        .prepare("SELECT 1 FROM faculty WHERE code = ? AND id != ?")
        .get(code, facultyId);
      if (conflict) {
        throw new HttpError(400, "Faculty code already exists");
      }
      updates.code = code;
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return this.getFaculty(facultyId);
    }

    const setClauses = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);
    values.push(facultyId);

    const statement = this.db.prepare(`UPDATE faculty SET ${setClauses} WHERE id = ?`);
    const result = statement.run(...values);
    if (result.changes === 0) {
      throw new HttpError(404, "Faculty not found");
    }
    return this.getFaculty(facultyId);
  }

  deleteFaculty(facultyId) {
    const result = this.db.prepare("DELETE FROM faculty WHERE id = ?").run(facultyId);
    if (result.changes === 0) {
      throw new HttpError(404, "Faculty not found");
    }
  }

  createDepartment(payload) {
    const name = payload.name?.trim();
    const code = payload.code?.trim().toUpperCase();
    if (!name || !code || !payload.faculty_id) {
      throw new HttpError(400, "name, code and faculty_id are required");
    }

    this.getFaculty(payload.faculty_id);

    const codeExists = this.db.prepare("SELECT 1 FROM department WHERE code = ?").get(code);
    if (codeExists) {
      throw new HttpError(400, "Department code already exists");
    }
    const nameExists = this.db.prepare("SELECT 1 FROM department WHERE name = ?").get(name);
    if (nameExists) {
      throw new HttpError(400, "Department name already exists");
    }

    const insert = this.db.prepare(
      "INSERT INTO department (name, code, faculty_id, created_at) VALUES (?, ?, ?, ?)"
    );
    const result = insert.run(name, code, payload.faculty_id, nowUtc());
    const row = this.db.prepare("SELECT * FROM department WHERE id = ?").get(result.lastInsertRowid);
    return mapDepartment(row);
  }

  listDepartments(facultyId) {
    let sql = "SELECT * FROM department";
    const params = [];
    if (facultyId) {
      sql += " WHERE faculty_id = ?";
      params.push(facultyId);
    }
    sql += " ORDER BY name COLLATE NOCASE";
    const rows = this.db.prepare(sql).all(...params);
    return rows.map(mapDepartment);
  }

  getDepartment(departmentId) {
    const row = this.db.prepare("SELECT * FROM department WHERE id = ?").get(departmentId);
    if (!row) {
      throw new HttpError(404, "Department not found");
    }
    return mapDepartment(row);
  }

  updateDepartment(departmentId, payload) {
    const updates = {};
    if (payload.name !== undefined && payload.name !== null) {
      const name = payload.name.trim();
      if (!name) {
        throw new HttpError(400, "name cannot be empty");
      }
      const conflict = this.db
        .prepare("SELECT 1 FROM department WHERE name = ? AND id != ?")
        .get(name, departmentId);
      if (conflict) {
        throw new HttpError(400, "Department name already exists");
      }
      updates.name = name;
    }
    if (payload.code !== undefined && payload.code !== null) {
      const code = payload.code.trim().toUpperCase();
      if (!code) {
        throw new HttpError(400, "code cannot be empty");
      }
      const conflict = this.db
        .prepare("SELECT 1 FROM department WHERE code = ? AND id != ?")
        .get(code, departmentId);
      if (conflict) {
        throw new HttpError(400, "Department code already exists");
      }
      updates.code = code;
    }
    if (payload.faculty_id !== undefined && payload.faculty_id !== null) {
      this.getFaculty(payload.faculty_id);
      updates.faculty_id = payload.faculty_id;
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return this.getDepartment(departmentId);
    }

    const setClauses = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);
    values.push(departmentId);

    const statement = this.db.prepare(`UPDATE department SET ${setClauses} WHERE id = ?`);
    const result = statement.run(...values);
    if (result.changes === 0) {
      throw new HttpError(404, "Department not found");
    }
    return this.getDepartment(departmentId);
  }

  deleteDepartment(departmentId) {
    const result = this.db.prepare("DELETE FROM department WHERE id = ?").run(departmentId);
    if (result.changes === 0) {
      throw new HttpError(404, "Department not found");
    }
  }
}

module.exports = FacultyService;
