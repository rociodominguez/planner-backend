const { verifyJwt } = require("../utils/jwt");
const User = require("../api/models/users");
const jwt = require('jsonwebtoken');

const isAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = {  
      _id: user._id,
      rol: user.rol,
    };
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
};


const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Token no proporcionado' });
  }

  try {
    const decodedToken = verifyJwt(token);

    const user = await User.findById(decodedToken.id);

    if (user && user.rol === 'admin') {
      req.user = user;
      next();
    } else {
      return res.status(403).json({ error: 'Esta acción sólo la pueden realizar los administradores' });
    }
  } catch (error) {
    console.error('Error en el middleware de autorización de administrador:', error);
    return res.status(403).json({ error: 'No estás autorizado' });
  }
};


module.exports = { isAuth, isAdmin };
