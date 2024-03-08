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
  const studentId = req.params.id;
  try {
    const studentCount = await Students.count({
      where: {
        studentID: studentId,
      },
    });

    if (studentCount > 0) {
      await Students.destroy({
        where: {
          studentID: studentId,
        },
      });
    }

    const deletedAttendenceCount = await AttendanceRecords.destroy({
      where: {
        StudentID: studentId,
      },
    });

    if (deletedAttendenceCount === 1) {
      res.status(200).json({
        message: "Student and associated records deleted successfully",
      });
    } else {
      res.status(404).json({ message: "Student record not found" });
    }
  } catch (error) {
    console.error("Error deleting student and associated records:", error);
    res.status(500).json({ message: "Internal server error", error: error });
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
    const { sname } = req.query; // Use 'sname' instead of 'name' to match the query parameter name

    // Step 1: Query Students table to get student information
    const searchResults = await Students.findAll({
      where: {
        Password: { [Op.eq]: null },
        StudentName: sname, // Use 'sname' instead of 'name' to access the query parameter
      },
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }

    const studentID = searchResults[0].studentID; // Assuming studentID is the correct field name

    const attendanceRecords = await AttendanceRecords.findAll({
      where: {
        StudentID: studentID,
      },
      attributes: ["StudentID", "CourseID", "AttendanceDate", "Status"],
      order: [
        ["CourseID", "ASC"],
        ["AttendanceDate", "ASC"],
      ],
    });

    // Step 2: Extract unique course IDs from the attendance records
    const courseIDs = [
      ...new Set(attendanceRecords.map((record) => record.CourseID)),
    ];

    // Step 3: Query Courses table to get course names for each unique course ID
    const courseNames = await Courses.findAll({
      attributes: ["courseID", "CourseName"],
      where: {
        CourseID: {
          [Op.in]: courseIDs,
        },
      },
    });

    // Step 4: Replace CourseID with CourseName in attendance records
    const modifiedAttendanceRecords = attendanceRecords.map((record) => {
      const course = courseNames.find(
        (course) => course.courseID === record.CourseID
      );
      return {
        StudentID: record.StudentID,
        AttendanceDate: record.AttendanceDate,
        Status: record.Status,
        CourseName: course ? course.CourseName : null,
      };
    });

    //res.status(200).json(courseNames);
    res.status(200).json(modifiedAttendanceRecords);
  } catch (error) {
    console.error("Error searching for students:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

router.put("/update/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { Status, Date } = req.body;

    // Find the attendance record for the specified studentId
    const attendanceRecord = await AttendanceRecords.findOne({
      where: { StudentID: studentId },
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
        attributes: ["StudentID", "AttendanceDate", "Status"],
        include: [
          {
            model: Students,
            attributes: ["StudentName"], // Include StudentName from the associated Students table
          },
        ],
      });
    } else {
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
    }

    // Extract relevant data and send response
    const formattedAttendanceRecords = attendanceRecords.map((record) => ({
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

router.put("/student/:id", async (req, res) => {
  const { id } = req.params;
  const { StudentName, email } = req.body;

  try {
    const updatedRowsCount = await Students.update(req.body, {
      where: { studentID: id },
    });

    const updatedStudent = await Students.findOne({
      where: { studentID: id },
      // Add other attributes as needed
    });

    if (updatedRowsCount === 0) {
      throw new Error("Student not found");
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: { id } });
  }
});

router.get("/student/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Students.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Error fetching student details" });
  }
});

router.delete("/student/delete/:id", async (req, res) => {
  const studentId = req.params.id;
  try {
    const studentCount = await Students.count({
      where: {
        studentID: studentId,
      },
    });

    if (studentCount > 0) {
      await Students.destroy({
        where: {
          studentID: studentId,
        },
      });
    }

    const deletedAttendenceCount = await AttendanceRecords.destroy({
      where: {
        StudentID: studentId,
      },
    });

    if (deletedAttendenceCount === 1) {
      res.status(200).json({
        message: "Student and associated records deleted successfully",
      });
    } else {
      res.status(404).json({ message: "Student record not found" });
    }
  } catch (error) {
    console.error("Error deleting student and associated records:", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = router;
