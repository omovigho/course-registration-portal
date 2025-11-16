const { getDatabase } = require("../db/database");
const HttpError = require("../utils/httpError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { nowUtc } = require("../utils/datetime");
const { createAccessToken, createRefreshToken, decodeToken } = require("../utils/jwt");
const { mapUser } = require("./mappers");

class AuthService {
  constructor(db = getDatabase()) {
    this.db = db;
  }

  findUserByEmail(email) {
    if (!email) {
      return null;
    }
    const statement = this.db.prepare("SELECT * FROM user WHERE LOWER(email) = LOWER(?) LIMIT 1");
    return statement.get(email);
  }

  async signupUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const fullName = payload.full_name?.trim();
    const password = payload.password;

    if (!email || !fullName || !password) {
      throw new HttpError(400, "email, full_name and password are required");
    }
    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters long");
    }
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new HttpError(400, "Email already registered");
    }

    const hashedPassword = await hashPassword(password);
    const createdAt = nowUtc();

    const insert = this.db.prepare(
      `INSERT INTO user (email, full_name, hashed_password, role, is_active, created_at)
       VALUES (?, ?, ?, 'user', 1, ?)`
    );
    const result = insert.run(email, fullName, hashedPassword, createdAt);
    const userRow = this.db.prepare("SELECT * FROM user WHERE id = ?").get(result.lastInsertRowid);
    return mapUser(userRow);
  }

  async authenticateUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;
    if (!email || !password) {
      throw new HttpError(400, "email and password are required");
    }
    const userRow = this.findUserByEmail(email);
    if (!userRow) {
      throw new HttpError(401, "Invalid credentials");
    }
    const passwordValid = await verifyPassword(password, userRow.hashed_password);
    if (!passwordValid) {
      throw new HttpError(401, "Invalid credentials");
    }
    if (!userRow.is_active) {
      throw new HttpError(403, "User is inactive");
    }
    return mapUser(userRow);
  }

  generateTokenPair(user) {
    return {
      access_token: createAccessToken(user.id),
      refresh_token: createRefreshToken(user.id),
      token_type: "bearer",
    };
  }

  decodeRefreshToken(refreshToken) {
    if (!refreshToken) {
      throw new HttpError(400, "refresh_token is required");
    }
    const payload = decodeToken(refreshToken);
    if (payload.type !== "refresh") {
      throw new HttpError(400, "Invalid refresh token");
    }
    const userRow = this.db.prepare("SELECT * FROM user WHERE id = ?").get(Number(payload.sub));
    if (!userRow) {
      throw new HttpError(404, "User not found");
    }
    if (!userRow.is_active) {
      throw new HttpError(403, "User is inactive");
    }
    return mapUser(userRow);
  }
}

module.exports = AuthService;
