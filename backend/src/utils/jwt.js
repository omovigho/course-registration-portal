const jwt = require("jsonwebtoken");
const settings = require("../config/settings");
const HttpError = require("./httpError");

function createToken(subject, minutes, type) {
  return jwt.sign(
    {
      sub: String(subject),
      type,
    },
    settings.jwtSecret,
    {
      expiresIn: `${minutes}m`,
    }
  );
}

function createAccessToken(subject) {
  return createToken(subject, settings.accessTokenExpireMinutes, "access");
}

function createRefreshToken(subject) {
  return createToken(subject, settings.refreshTokenExpireMinutes, "refresh");
}

function decodeToken(token) {
  try {
    return jwt.verify(token, settings.jwtSecret);
  } catch (error) {
    throw new HttpError(401, "Invalid token");
  }
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  decodeToken,
};
