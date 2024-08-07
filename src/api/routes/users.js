const { isAuth, isAdmin } = require("../../middlewares/auth");
const upload = require("../../utils/deletefile");
const { getUsers, register, login, deleteUser, getUserById, updateUser, getUserProfile } = require("../controllers/users");

const usersRoutes = require("express").Router();

usersRoutes.get("/", [isAdmin], getUsers);
usersRoutes.get("/:id", [isAuth], getUserById);
usersRoutes.get("/me", [isAuth], getUserProfile);
usersRoutes.post("/register", upload.single("profileImageUrl"), register);
usersRoutes.put("/:id", upload.single("profileImageUrl"), [isAuth], updateUser);
usersRoutes.post("/login", login);
usersRoutes.delete("/:userId", [isAdmin], deleteUser);

module.exports = usersRoutes;

