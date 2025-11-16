const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const AcademicYearService = require("../services/academicYearService");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler((req, res) => {
    const service = new AcademicYearService();
    const years = service.listAcademicYears();
    res.json({ items: years });
  })
);

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  asyncHandler((req, res) => {
    const service = new AcademicYearService();
    const academicYear = service.createAcademicYear(req.user, req.body || {});
    res.status(201).json(academicYear);
  })
);

module.exports = router;
