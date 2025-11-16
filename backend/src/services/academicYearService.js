const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { nowUtc } = require("../utils/datetime");

class AcademicYearService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  listAcademicYears() {
    return this.db.prepare("SELECT * FROM academicyear ORDER BY created_at DESC").all();
  }

  createAcademicYear(user, payload = {}) {
    if (!user || user.role !== "admin") {
      throw new HttpError(403, "Only administrators can manage academic years");
    }

    const nameRaw = payload.name ?? payload.label;
    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    if (!name) {
      throw new HttpError(400, "Academic year name is required");
    }

    const isCurrentRaw = payload.is_current ?? payload.isCurrent;
    const isCurrent = Boolean(isCurrentRaw);

    const duplicate = this.db.prepare("SELECT 1 FROM academicyear WHERE name = ? LIMIT 1").get(name);
    if (duplicate) {
      throw new HttpError(400, "An academic year with this name already exists");
    }

    const now = nowUtc();
    const insert = this.db.prepare(
      `INSERT INTO academicyear (name, is_current, created_at)
       VALUES (?, ?, ?)`
    );
    const result = insert.run(name, isCurrent ? 1 : 0, now);

    if (isCurrent) {
      this.db.prepare("UPDATE academicyear SET is_current = 0 WHERE id != ?").run(result.lastInsertRowid);
    }

    return this.db.prepare("SELECT * FROM academicyear WHERE id = ?").get(result.lastInsertRowid);
  }
}

module.exports = AcademicYearService;
