const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const accessToken = req.header("accessToken");

  if (!accessToken) {
    return res.json({ error: "Admin not logged in!" });
  }
  try {
    const validToken = verify(accessToken, "secure"); //ovB5\&}wXe}7>^5{Jze.pt7#olQu+nVde9h[(hUQd+HFzx$\V'

    if (validToken) {
      req.userToken = validToken;
      return next();
    }
  } catch (err) {
    return res.json({ error: err }); //400
  }
};

module.exports = { validateToken };
