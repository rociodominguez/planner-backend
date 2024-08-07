const { isAuth, isAdmin } = require("../../middlewares/auth");
const upload = require("../../utils/deleteFile");
const { getEvents, createEvent, deleteEvent, getEventById, updateEvent, addAttendant, removeAttendant, getAttendeesByEvent, getConfirmedEventsByUser } = require("../controllers/events");

const eventRoutes = require("express").Router();

eventRoutes.get("/", getEvents);
eventRoutes.get("/:id", getEventById);
eventRoutes.get('/confirmed/:userId', [isAuth], getConfirmedEventsByUser);
eventRoutes.post("/:eventId/attendants", [isAuth], addAttendant);
eventRoutes.get("/:eventId/attendees", getAttendeesByEvent);
eventRoutes.post("/", [isAdmin], upload.single("imageUrl"), createEvent);
eventRoutes.delete("/:id", [isAdmin], deleteEvent);
eventRoutes.delete("/:eventId/attendants", [isAuth], removeAttendant);
eventRoutes.put("/:id", [isAdmin], upload.single("imageUrl"), updateEvent);

module.exports = eventRoutes;
