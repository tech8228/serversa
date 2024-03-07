module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define("AttendanceRecords", {
    RecordID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    StudentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    CourseID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    AttendanceDate: {
      type: DataTypes.DATE,
    },
    Status: {
      type: DataTypes.ENUM("Present", "Absent", "Late", "Leave Permitted"),
    },
  });

  return Attendance;
};
