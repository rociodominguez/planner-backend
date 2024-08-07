const { verifyJwt } = require("../../jwt");
const User = require("../api/models/users");

const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { id } = verifyJwt(token);
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = null;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { id } = verifyJwt(token);
    const user = await User.findById(id);

    if (!user || user.rol !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    user.password = null;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = { isAuth, isAdmin };
