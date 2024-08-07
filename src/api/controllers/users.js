const mongoose = require('mongoose');
const { generateSign } = require('../../../jwt');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const { deleteFile } = require('../../utils/deletefile');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('attendingEvents', 'title');
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const user = await User.findById(id).populate('attendingEvents');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    const newUser = new User({
      userName,
      password,
      email,
      rol: 'user',
    });

    const userSaved = await newUser.save();
    const token = generateSign(userSaved._id);

    return res.status(200).json({ user: userSaved, token });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (bcrypt.compareSync(password, user.password)) {
      const token = generateSign(user._id);
      return res.status(200).json({ user, token });
    } else {
      return res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = { ...req.body };

    if (req.file) {
      const oldImageUrl = currentUser.profileImageUrl;
      updateData.profileImageUrl = req.file.path;

      if (oldImageUrl) {
        try {
          await deleteFile(oldImageUrl);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
    }

    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await bcrypt.compare(req.body.currentPassword, currentUser.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      if (req.body.newPassword.trim() !== '') {
        updateData.password = bcrypt.hashSync(req.body.newPassword, 10);
      } else {
        return res.status(400).json({ error: 'New password cannot be empty' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  getUsers,
  getUserById,
  register,
  login,
  deleteUser,
  updateUser,
  getUserProfile
};