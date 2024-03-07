const express = require("express");
const router = express.Router();
const { Students } = require("../models");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
const { validateToken } = require("../middleware/Authmiddleware");
const { validateRegistration, validateLogin } = require("../routes/Validation");

router.post("/", validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: "Missing registration data" });
  }
  const user = await Students.findOne({ where: { StudentName: username } });

  if (!user) {
    //bcrypt.hash(password, 10).then(async (hash) => {
    try {
      const currentDate = new Date().toLocaleDateString();
      // Convert it to a string in ISO format and extract only the date part
      const registrationDate = currentDate;

      await Students.create({
        StudentName: username,
        email: email,
        RegistrationDate: registrationDate,
        //Password: hash,
      });
      res.json("Success");
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    //});
  } else {
    res.json({ error: "User already exists" });
  }
});

router.post("/login", validateLogin, async (req, res) => {
  const { Studentname, password } = req.body;
  if (!Studentname || !password) {
    return res.status(400).json({ error: "Missing Login data" });
  }
  try {
    const user = await Students.findOne({
      where: { StudentName: Studentname },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    bcrypt.compare(password, user.Password).then((match) => {
      if (!match) {
        res.json({ error: "UserName or Password did not Match" });
      } else {
        const accessToken = sign(
          { StudentName: user.StudentName, id: user.studentID },
          "secure"
        );
        res.status(200).json(accessToken);
      }
    });
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/upload", async (req, res) => {
  const { fileName, fileType } = req.body;
});

router.get("/", validateToken, (req, res) => {
  res.json(res.user);
});

module.exports = router;
