const { isAuth, isAdmin } = require("../../middlewares/auth");
const upload = require("../../utils/cloudinary");
const { getUsers, register, login, deleteUser, getUserById, updateUser, getUserProfile, getUserProfileInfo } = require("../controllers/users");

const usersRoutes = require('express').Router();

usersRoutes.get('/profile', [isAuth], getUserProfile);
usersRoutes.get('/', [isAdmin], getUsers);
usersRoutes.get('/:id', [isAuth], getUserById);
usersRoutes.get('/profile', [isAuth], getUserProfileInfo);
usersRoutes.post('/register', register);
usersRoutes.put('/:id', [isAuth], updateUser);
usersRoutes.post('/login', login);
usersRoutes.delete('/:userId', [isAdmin], deleteUser);

module.exports = usersRoutes;
