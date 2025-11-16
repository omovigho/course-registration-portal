const express = require("express");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const UserService = require("../services/userService");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const userService = new UserService();
    const user = userService.getUserWithProfile(req.user.id);
    res.json(user);
  })
);

module.exports = router;
