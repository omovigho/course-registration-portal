const express = require("express");
const AuthService = require("../services/authService");
const UserService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const authService = new AuthService();
    const user = await authService.signupUser(req.body || {});
    const userService = new UserService();
    const fullUser = userService.getUserWithProfile(user.id);
    res.status(201).json(fullUser);
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const authService = new AuthService();
    const user = await authService.authenticateUser(req.body || {});
    const tokens = authService.generateTokenPair(user);
    res.json(tokens);
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refresh_token: refreshToken } = req.body || {};
    const authService = new AuthService();
    const user = authService.decodeRefreshToken(refreshToken);
    const tokens = authService.generateTokenPair(user);
    res.json(tokens);
  })
);

module.exports = router;
