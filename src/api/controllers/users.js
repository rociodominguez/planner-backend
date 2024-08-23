const mongoose = require('mongoose');
const { generateSign, generateToken } = require('../../utils/jwt');
const User = require('../models/users');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('attendingEvents', 'title');
    return res.status(200).json(users);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'No se pudieron obtener los usuarios' });
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const user = await User.findById(id).populate('attendingEvents');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res
      .status(400)
      .json({ error: `Error al obtener el usuario: ${error.message}` });
  }
};

const register = async (req, res, next) => {
  try {
    const { userName, password, email } = req.body;

    if (!userName || !password || !email) {
      throw new Error('Todos los campos son obligatorios');
    }

    const existingUser = await User.findOne({ userName });

    if (existingUser) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    const newUser = new User({
      userName,
      password,
      email,
      rol: 'user',
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { userName, password } = req.body;

  try {
      const user = await User.findOne({ userName });
      if (!user) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = generateToken(user);
      res.status(200).json({
          token,
          role: user.rol,
          userId: user._id
      });
  } catch (error) {
      res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({
      error:
        'Error interno del servidor al procesar la solicitud de eliminación de usuario',
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { userName } = req.body;

    if (!userName) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }

    // Verifica si el nuevo nombre de usuario ya está en uso por otro usuario
    const existingUser = await User.findOne({ userName });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Actualiza el nombre de usuario
    const updatedUser = await User.findByIdAndUpdate(userId, { userName }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Nombre de usuario actualizado correctamente', user: updatedUser });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el usuario' });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; 
    const user = await User.findById(userId).populate('attendingEvents'); 
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user.attendingEvents); 
  } catch (error) {
    console.error('Error al obtener eventos confirmados:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
}

const getUserProfileInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('userName email');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Construir el objeto de respuesta con la información básica del perfil
    const userProfile = {
      username: user.userName || '',
      email: user.email || '',
    };
    
    // Enviar la respuesta con la información del perfil del usuario
    res.json(userProfile);
  } catch (error) {
    console.error('Error al obtener la información del perfil del usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};



module.exports = {
  getUserProfile,
  getUsers,
  getUserById,
  register,
  login,
  deleteUser,
  updateUser,
  getUserProfileInfo
};