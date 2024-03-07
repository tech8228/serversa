const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
//require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./models");

//Routers
const homeRouter = require("./routes/Home");
app.use("/", homeRouter);
const courseRouter = require("./routes/Course");
app.use("/courses", courseRouter);
const assignRouter = require("./routes/Assign");
app.use("/assign", assignRouter);

const attendRouter = require("./routes/AttendHome");
app.use("/attend", attendRouter);
const studentRouter = require("./routes/Student");
app.use("/auth", studentRouter);

const port = process.env.PORT || 3001;
db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log("Server is running on port 3001");
  });
});
