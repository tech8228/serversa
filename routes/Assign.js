const express = require("express");
const router = express.Router();
const { Students, Courses, AttendanceRecords } = require("../models");
const { validateToken } = require("../middleware/Authmiddleware");
const { Op } = require("sequelize");

// router.get("/", (req, res) => {
//   res.send("Hello from the server!");
// });

router.get("/student", async (req, res) => {
  try {
    const listOfStudents = await Students.findAll({
      where: {
        Password: {
          [Op.eq]: null,
        },
      },
    });

    if (listOfStudents.length === 0) {
      return res.status(404).json({ error: "No Student found" });
    }

    res.status(200).json(listOfStudents);
  } catch (error) {
    console.error("Error fetching Student list:", error);

    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const listOfCourses = await Courses.findAll();

    if (listOfCourses.length === 0) {
      return res.status(404).json({ error: "No Courses found" });
    }

    res.status(200).json(listOfCourses);
  } catch (error) {
    console.error("Error fetching Courses list:", error);

    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/attendance", validateToken, async (req, res) => {
  const { studentID, courseID } = req.body;
  if (!studentID || !courseID) {
    return res.status(400).json({ error: "Missing Record Data" });
  }
  const checkAttendance = await AttendanceRecords.findAll({
    where: { [Op.and]: { StudentID: studentID, CourseID: courseID } },
  });

  if (checkAttendance.length === 0) {
    try {
      await AttendanceRecords.create({
        StudentID: studentID,
        CourseID: courseID,
        AttendanceDate: new Date().toLocaleDateString(),
      });
      res.json("Success");
    } catch (error) {
      console.error("Error creating Course:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.json({ error: "Record already exists" });
  }
});

router.get("/search", async (req, res) => {
  console.log("reached search");
  try {
    const { name } = req.query;

    // Build the search criteria based on query parameters
    const whereClause = {};
    if (name) {
      whereClause.StudentName = { [Op.like]: `%${title}%` };
    }

    const searchResults = await Students.findAll({
      where: whereClause,
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error("Error searching jobs:", error);

    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
