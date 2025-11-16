const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

async function hashPassword(plainText) {
  if (!plainText) {
    throw new Error("Password must be provided for hashing");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

function verifyPassword(plainText, hashedPassword) {
  if (!plainText || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainText, hashedPassword);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
