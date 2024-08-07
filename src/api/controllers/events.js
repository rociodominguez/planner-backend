const { deleteFile } = require('../../utils/deleteFile');
const Event = require('../models/events');
const mongoose = require('mongoose');
const User = require('../models/users');

const getEvents = async (req, res, next) => {
  try {
    const allEvents = await Event.find()
      .populate('author', 'userName')
      .populate('attendants', 'userName');
    return res.status(200).json(allEvents);
  } catch (err) {
    return res
      .status(400)
      .json({ error: `Error getEvents: ${err.message}` });
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const event = await Event.findById(id)
      .populate('author', 'userName')
      .populate('attendants', 'userName');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (err) {
    return res
      .status(400)
      .json({ error: `Error getEventById: ${err.message}` });
  }
};

const createEvent = async (req, res, next) => {
  try {
    console.log(req.body);

    if (!req.body.title || !req.body.description || !req.body.date) {
      return res.status(400).json({ error: 'Required fields' });
    }

    const newEvent = new Event({
      title: req.body.title,
      date: req.body.date,
      description: req.body.description,
      author: req.body.author,
    });

    if (req.file) {
      newEvent.imageUrl = req.file.path;
    }

    const eventSaved = await newEvent.save();
    return res.status(201).json(eventSaved);
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ error: `Error createEvent: ${err.message}` });
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    if (req.file) {
      const eventToUpdate = await Event.findById(id);
      if (!eventToUpdate) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (eventToUpdate.imageUrl) {
        await deleteFile(eventToUpdate.imageUrl);
      }
      updatedData.imageUrl = req.file.path;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json(updatedEvent);
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ error: `Error updateEvent: ${err.message}` });
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventToRemove = await Event.findByIdAndDelete(id);

    if (!eventToRemove) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventToRemove.imageUrl) {
      await deleteFile(eventToRemove.imageUrl);
    }

    return res.status(200).json({
      message: 'Event removed',
      event: eventToRemove,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ error: `Error deleteEvent: ${err.message}` });
  }
};

const addAttendant = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ error: 'User not valid' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.attendants.includes(userId)) {
      return res
        .status(400)
        .json({ error: 'User already exists' });
    }

    event.attendants.push(userId);
    await event.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.attendingEvents.includes(eventId)) {
      user.attendingEvents.push(eventId);
      await user.save();
    }

    return res
      .status(200)
      .json({ message: 'Added user' });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error addAttendant: ${error.message}` });
  }
};

const removeAttendant = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ error: 'User not valid' });
    }

    const event = await Event.findById(eventId).populate(
      'attendants',
      'userName'
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userIndex = event.attendants.findIndex(
      (attendant) => attendant._id.toString() === userId
    );
    if (userIndex === -1) {
      return res
        .status(400)
        .json({ error: 'User is not an attendant' });
    }

    event.attendants.splice(userIndex, 1);
    await event.save();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eventIndex = user.attendingEvents.findIndex(
      (event) => event._id.toString() === eventId
    );
    if (eventIndex !== -1) {
      user.attendingEvents.splice(eventIndex, 1);
      await user.save();
    }

    return res
      .status(200)
      .json({ message: 'Cancelled attendance', event });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error removeAttendant: ${error.message}` });
  }
};

const getAttendeesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'ID not valid' });
    }

    const event = await Event.findById(eventId).populate(
      'attendants',
      'userName'
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json(event.attendants);
  } catch (error) {
    console.error('Error getAttendeesByEvent:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getConfirmedEventsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    const user = await User.findById(userId).populate('attendingEvents');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user.attendingEvents);
  } catch (error) {
    console.error('Error getConfirmedEventsByUser:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};


module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addAttendant,
  removeAttendant,
  getAttendeesByEvent,
  getConfirmedEventsByUser
};