module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define("Students", {
    studentID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    StudentName: {
      type: DataTypes.STRING(200),

      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(200),
      unique: true,
      allowNull: false,
    },
    RegistrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Password: {
      type: DataTypes.STRING(100),
    },
  });

  return Student;
};
