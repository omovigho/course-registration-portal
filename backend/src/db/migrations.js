const { getDatabase } = require("./database");

function runMigrations() {
  const db = getDatabase();
  db.exec(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS ix_user_email ON user (email);
    CREATE INDEX IF NOT EXISTS ix_user_role ON user (role);

    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS department (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      faculty_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS ix_department_faculty_id ON department (faculty_id);

    CREATE TABLE IF NOT EXISTS studentprofile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      matric_no TEXT NOT NULL UNIQUE,
      year_of_entry INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE RESTRICT,
      FOREIGN KEY(department_id) REFERENCES department(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS ix_studentprofile_user_id ON studentprofile (user_id);
    CREATE INDEX IF NOT EXISTS ix_studentprofile_faculty_id ON studentprofile (faculty_id);
    CREATE INDEX IF NOT EXISTS ix_studentprofile_department_id ON studentprofile (department_id);

    CREATE TABLE IF NOT EXISTS academicyear (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_current INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT NOT NULL UNIQUE,
      course_name TEXT NOT NULL,
      level INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      created_by INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE RESTRICT,
      FOREIGN KEY(department_id) REFERENCES department(id) ON DELETE RESTRICT,
      FOREIGN KEY(created_by) REFERENCES user(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS ix_course_level ON course (level);
    CREATE INDEX IF NOT EXISTS ix_course_faculty_id ON course (faculty_id);
    CREATE INDEX IF NOT EXISTS ix_course_department_id ON course (department_id);

    CREATE TABLE IF NOT EXISTS courseregistration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      submitted INTEGER NOT NULL DEFAULT 0,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY(academic_year_id) REFERENCES academicyear(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS ix_courseregistration_student_id ON courseregistration (student_id);
    CREATE INDEX IF NOT EXISTS ix_courseregistration_academic_year_id ON courseregistration (academic_year_id);

    CREATE TABLE IF NOT EXISTS courseregistrationitem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      course_id INTEGER,
      course_code_snapshot TEXT NOT NULL,
      course_name_snapshot TEXT NOT NULL,
      status TEXT NOT NULL,
      removed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(registration_id) REFERENCES courseregistration(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES course(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS ix_courseregistrationitem_registration_id ON courseregistrationitem (registration_id);
    CREATE INDEX IF NOT EXISTS ix_courseregistrationitem_course_id ON courseregistrationitem (course_id);

    CREATE TABLE IF NOT EXISTS schoolfeepolicy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(academic_year_id) REFERENCES academicyear(id) ON DELETE RESTRICT,
      FOREIGN KEY(created_by) REFERENCES user(id) ON DELETE SET NULL,
      FOREIGN KEY(updated_by) REFERENCES user(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS ix_schoolfeepolicy_academic_year_id ON schoolfeepolicy (academic_year_id);

    CREATE TABLE IF NOT EXISTS schoolfeepayment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      academic_year_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      payment_reference TEXT,
      notes TEXT,
      approved_by INTEGER,
      approved_at TEXT,
      declined_by INTEGER,
      declined_at TEXT,
      declined_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY(academic_year_id) REFERENCES academicyear(id) ON DELETE RESTRICT,
      FOREIGN KEY(approved_by) REFERENCES user(id) ON DELETE SET NULL,
      FOREIGN KEY(declined_by) REFERENCES user(id) ON DELETE SET NULL,
      UNIQUE(student_id, academic_year_id)
    );

    CREATE INDEX IF NOT EXISTS ix_schoolfeepayment_academic_year_id ON schoolfeepayment (academic_year_id);
    CREATE INDEX IF NOT EXISTS ix_schoolfeepayment_status ON schoolfeepayment (status);
    CREATE INDEX IF NOT EXISTS ix_schoolfeepayment_student_id ON schoolfeepayment (student_id);

    CREATE TABLE IF NOT EXISTS auditlog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action_type TEXT NOT NULL,
      action_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE SET NULL
    );

    COMMIT;
  `);

  const studentProfileColumns = db.prepare("PRAGMA table_info(studentprofile)").all();
  const hasLevelColumn = studentProfileColumns.some((column) => column.name === "level");

  if (!hasLevelColumn) {
    db.exec(`
      ALTER TABLE studentprofile ADD COLUMN level INTEGER NOT NULL DEFAULT 100;
      UPDATE studentprofile SET level = 100 WHERE level IS NULL;
    `);
  }

  db.exec("CREATE INDEX IF NOT EXISTS ix_studentprofile_level ON studentprofile (level)");
}

module.exports = {
  runMigrations,
};
