const { body, validationResult } = require("express-validator");

const validateRegistration = [
  body("username")
    .notEmpty()
    .isLength({ min: 6 })
    .withMessage("Username is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("Studentname").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateCourse = [
  body("CourseName")
    .notEmpty()
    .isLength({ min: 2 })
    .withMessage("Course Name is required"),
];

module.exports = { validateRegistration, validateLogin, validateCourse };
