const express = require("express");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const UserService = require("../services/userService");

const router = express.Router();

router.post(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const userService = new UserService();
    const profile = userService.createStudentProfile(req.user, req.body || {});
    res.status(201).json(profile);
  })
);

module.exports = router;
