const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const studentRoutes = require("./studentRoutes");
const facultyRoutes = require("./facultyRoutes");
const departmentRoutes = require("./departmentRoutes");
const courseRoutes = require("./courseRoutes");
const registrationRoutes = require("./registrationRoutes");
const adminRoutes = require("./adminRoutes");
const schoolFeeRoutes = require("./schoolFeeRoutes");
const academicYearRoutes = require("./academicYearRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/faculties", facultyRoutes);
router.use("/departments", departmentRoutes);
router.use("/courses", courseRoutes);
router.use("/registrations", registrationRoutes);
router.use("/admin", adminRoutes);
router.use("/school-fees", schoolFeeRoutes);
router.use("/academic-years", academicYearRoutes);

module.exports = router;
