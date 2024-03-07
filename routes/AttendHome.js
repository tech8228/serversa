const express = require("express");
const router = express.Router();
const { Students, Courses, AttendanceRecords } = require("../models");
const { validateToken } = require("../middleware/Authmiddleware");
const { Op } = require("sequelize");

// router.get("/", (req, res) => {
//   res.send("Hello from the server!");
// });

router.get("/", async (req, res) => {
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

router.get("/delete/:id", async (req, res) => {
  try {
    const JobID = req.params.id;
    const job = await Students.findByPk(JobID);
    if (!job) {
      return res.status(404).json({ error: "Hello not found" });
    }
    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job:", error);

    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", validateToken, async (req, res) => {
  try {
    const job = req.body;
    const jobId = req.userToken.id;
    job.JobId = jobId;
    await Students.create(job);
    res.status(200).json(job);
  } catch {
    console.error("Error creating job:", error);

    // Check for specific Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      // If validation error, return 400 Bad Request with error details
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }

    // Return 500 for any other unexpected error
    res.status(500).json({ error: "Internal server error" });
  } //res.json(true)
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

router.put("/update/:recordnum", async (req, res) => {
  try {
    const { recordnum } = req.params;
    const { Status, Date } = req.body;

    // Find the attendance record for the specified studentId
    const attendanceRecord = await AttendanceRecords.findOne({
      where: { RecordID: recordnum },
    });

    if (attendanceRecord) {
      // Update the status and date if provided
      if (Status) attendanceRecord.Status = Status;
      if (Date) attendanceRecord.AttendanceDate = Date;

      // Save the updated attendance record
      await attendanceRecord.save();

      res
        .status(200)
        .json({ message: "Attendance record updated successfully" });
    } else {
      res.status(404).json({ error: "Attendance record not found" });
    }
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/update/:recordnum", async (req, res) => {
  try {
    const { recordnum } = req.params;
    const { Status, Date } = req.body;

    // Find the attendance record for the specified studentId
    const attendanceRecord = await AttendanceRecords.findOne({
      where: { RecordID: recordnum },
    });

    if (attendanceRecord) {
      // Update the status and date if provided
      if (Status) attendanceRecord.Status = Status;
      if (Date) attendanceRecord.AttendanceDate = Date;

      // Save the updated attendance record
      await attendanceRecord.save();

      res
        .status(200)
        .json({ message: "Attendance record updated successfully" });
    } else {
      res.status(404).json({ error: "Attendance record not found" });
    }
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance", async (req, res) => {
  try {
    const { courseId, date } = req.query;
    const todayDate = new Date().toLocaleDateString();

    const whereClause = { CourseID: courseId };
    if (date) {
      whereClause.AttendanceDate = {
        [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`],
      };
    }
    AttendanceRecords.belongsTo(Students, { foreignKey: "StudentID" });

    // Fetch attendance records
    let attendanceRecords;
    if (date) {
      attendanceRecords = await AttendanceRecords.findAll({
        where: whereClause,
        attributes: ["RecordID", "StudentID", "AttendanceDate", "Status"],
        include: [
          {
            model: Students,
            attributes: ["StudentName"], // Include StudentName from the associated Students table
          },
        ],
      });
    } else {
      attendancecheckRecords = await AttendanceRecords.findAll({
        where: whereClause,
        attributes: ["StudentID"],
        group: ["StudentID"],
      });

      const studentIds = attendancecheckRecords.map(
        (record) => record.StudentID
      );
      const existingRecords = await AttendanceRecords.findAll({
        where: {
          StudentID: {
            [Op.in]: studentIds,
          },
          CourseID: courseId,
          AttendanceDate: todayDate,
        },
      });

      const existingcheckStudentIds = existingRecords.map(
        (record) => record.StudentID
      );

      for (const studentId of studentIds) {
        if (!existingcheckStudentIds.includes(studentId)) {
          await AttendanceRecords.create({
            StudentID: studentId,
            CourseID: courseId,
            AttendanceDate: todayDate,
          });
        }
      }

      attendanceRecords = await AttendanceRecords.findAll({
        where: whereClause,
        attributes: ["StudentID"],
        group: ["StudentID"],
        include: [
          {
            model: Students,
            attributes: ["StudentName"],
          },
        ],
      });
      attendanceRecords = await AttendanceRecords.findAll({
        where: { AttendanceDate: todayDate, CourseID: courseId },
        attributes: ["RecordID", "StudentID", "AttendanceDate", "Status"],
        include: [
          {
            model: Students,
            attributes: ["StudentName"], // Include StudentName from the associated Students table
          },
        ],
      });
    }

    // Extract relevant data and send response
    const formattedAttendanceRecords = attendanceRecords.map((record) => ({
      RecordID: record.RecordID,
      StudentID: record.StudentID,
      AttendanceDate: record.AttendanceDate,
      Status: record.Status,
      StudentName: record.Student ? record.Student.StudentName : null, // Access StudentName from the associated Students table
    }));

    res.status(200).json(formattedAttendanceRecords);

    // Find all records in AttendanceRecords table matching the criteria
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
