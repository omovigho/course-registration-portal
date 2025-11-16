const { runMigrations } = require("../db/migrations");
const { getDatabase, closeDatabase } = require("../db/database");
const { hashPassword } = require("../utils/password");
const { nowUtc } = require("../utils/datetime");

async function upsertUser(db, email, fullName, password, role) {
  const existing = db.prepare("SELECT * FROM user WHERE LOWER(email) = LOWER(?)").get(email);
  const hashedPassword = await hashPassword(password);
  const timestamp = nowUtc();

  if (existing) {
    db.prepare("UPDATE user SET full_name = ?, role = ?, hashed_password = ? WHERE id = ?")
      .run(fullName, role, hashedPassword, existing.id);
    return db.prepare("SELECT * FROM user WHERE id = ?").get(existing.id);
  }
  const insert = db.prepare(
    `INSERT INTO user (email, full_name, hashed_password, role, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`
  );
  const result = insert.run(email.toLowerCase(), fullName, hashedPassword, role, timestamp);
  return db.prepare("SELECT * FROM user WHERE id = ?").get(result.lastInsertRowid);
}

async function main() {
  try {
    runMigrations();
    const db = getDatabase();

    let faculty = db.prepare("SELECT * FROM faculty WHERE code = ?").get("SCI");
    if (!faculty) {
      const result = db
        .prepare("INSERT INTO faculty (name, code, created_at) VALUES (?, ?, ?)")
        .run("Faculty of Science", "SCI", nowUtc());
      faculty = db.prepare("SELECT * FROM faculty WHERE id = ?").get(result.lastInsertRowid);
    }

    let department = db.prepare("SELECT * FROM department WHERE code = ?").get("CSC");
    if (!department) {
      const result = db
        .prepare(
          "INSERT INTO department (name, code, faculty_id, created_at) VALUES (?, ?, ?, ?)"
        )
        .run("Computer Science", "CSC", faculty.id, nowUtc());
      department = db.prepare("SELECT * FROM department WHERE id = ?").get(result.lastInsertRowid);
    }

    let academicYear = db.prepare("SELECT * FROM academicyear WHERE name = ?").get("2024/2025");
    if (!academicYear) {
      const result = db
        .prepare(
          "INSERT INTO academicyear (name, is_current, created_at) VALUES (?, 1, ?)"
        )
        .run("2024/2025", nowUtc());
      academicYear = db.prepare("SELECT * FROM academicyear WHERE id = ?").get(result.lastInsertRowid);
    }

    const admin = await upsertUser(db, "admin@uniben.edu", "Portal Administrator", "AdminPass123!", "admin");
    const lecturer = await upsertUser(db, "lecturer@uniben.edu", "Demo Lecturer", "LectPass123!", "lecturer");

    // eslint-disable-next-line no-console
    console.log("Seed completed successfully.");
    // eslint-disable-next-line no-console
    console.log("Admin -> email: admin@uniben.edu / password: AdminPass123!");
    // eslint-disable-next-line no-console
    console.log("Lecturer -> email: lecturer@uniben.edu / password: LectPass123!");
    // eslint-disable-next-line no-console
    console.log(`Sample faculty: ${faculty.name} (${faculty.code})`);
    // eslint-disable-next-line no-console
    console.log(`Sample department: ${department.name} (${department.code})`);
    // eslint-disable-next-line no-console
    console.log(`Current academic year: ${academicYear.name}`);
    // eslint-disable-next-line no-console
    console.log(`Admin user id: ${admin.id}, Lecturer user id: ${lecturer.id}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  } finally {
    closeDatabase();
  }
}

main();
