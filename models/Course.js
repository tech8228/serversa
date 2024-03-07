module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define("Courses", {
    courseID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    CourseName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  });

  return Course;
};
