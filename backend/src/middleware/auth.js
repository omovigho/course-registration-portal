const HttpError = require("../utils/httpError");
const { decodeToken } = require("../utils/jwt");
const UserService = require("../services/userService");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return next(new HttpError(401, "Not authenticated"));
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return next(new HttpError(401, "Not authenticated"));
  }

  try {
    const payload = decodeToken(token);
    if (payload.type !== "access") {
      throw new HttpError(401, "Invalid token type");
    }
    const userService = new UserService();
    const user = userService.getById(Number(payload.sub));
    if (!user.is_active) {
      throw new HttpError(403, "User inactive");
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    return next(new HttpError(401, "Invalid token"));
  }
}

function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return next(new HttpError(401, "Not authenticated"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }
    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
