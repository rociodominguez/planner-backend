const { deleteFile } = require('../../utils/file');
const Event = require('../models/events');
const mongoose = require('mongoose');
const User = require('../models/users');
const jwt = require('jsonwebtoken');

const getEvents = async (req, res, next) => {
  try {
    const allEvents = await Event.find()
      .populate('createdBy', 'userName')
      .populate('attendants', 'userName')
      .exec();

    const eventsWithAttendantsCount = allEvents.map(event => ({
      ...event._doc,
      attendantsCount: event.attendants.length
    }));

    return res.status(200).json(eventsWithAttendantsCount);
  } catch (err) {
    return res.status(400).json({ error: `Error al obtener eventos: ${err.message}` });
  }
};

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de evento no válido' });
    }

    const event = await Event.findById(id)
      .populate('createdBy', 'userName')
      .populate('attendants', 'userName');

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    return res.status(200).json(event);
  } catch (err) {
    return res
      .status(400)
      .json({ error: `Error al obtener evento: ${err.message}` });
  }
};

const createEvent = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') { 
      return res.status(403).json({ error: 'Acceso denegado. Solo los administradores pueden crear eventos.' });
    }

    const { title, description, date } = req.body;
    const imageUrl = req.file ? req.file.path : null; 

    const newEvent = new Event({
      title,
      description,
      date,
      imageUrl,
      createdBy: req.user._id, 
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const updateEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Obtiene la URL de la imagen cargada

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.imageUrl = imageUrl || event.imageUrl; // Actualiza la imagen si se proporciona

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventToRemove = await Event.findByIdAndDelete(id);

    if (!eventToRemove) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (eventToRemove.imageUrl) {
      await deleteFile(eventToRemove.imageUrl);
    }

    return res.status(200).json({
      message: 'Evento eliminado correctamente',
      event: eventToRemove,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ error: `Error al eliminar evento: ${err.message}` });
  }
};

const addAttendant = async (req, res) => {
  try {
    const userId = req.userData.userId; // ID del usuario extraído del token
    const eventId = req.params.eventId;

    // Encuentra el evento por ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Encuentra al usuario por ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Añade el usuario a la lista de asistentes del evento si no está ya
    if (!event.attendants.includes(userId)) {
      event.attendants.push(userId);
      await event.save();
    }

    // Añade el evento a la lista de eventos confirmados del usuario si no está ya
    if (!user.attendingEvents.includes(eventId)) {
      user.attendingEvents.push(eventId);
      await user.save();
    }

    res.status(200).json({ message: 'Asistencia confirmada' });
  } catch (error) {
    console.error('Error al añadir asistente:', error);
    res.status(500).json({ error: 'Error al añadir asistente' });
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
        .json({ error: 'ID de evento o usuario no válido' });
    }

    const event = await Event.findById(eventId).populate(
      'attendants',
      'userName'
    );

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Verificar si el usuario está en la lista de asistentes
    const userIndex = event.attendants.findIndex(
      (attendant) => attendant._id.toString() === userId
    );
    if (userIndex === -1) {
      return res
        .status(400)
        .json({ error: 'El usuario no está en la lista de asistentes' });
    }

    // Remover al usuario de la lista de asistentes y guardar el evento
    event.attendants.splice(userIndex, 1);
    await event.save();

    // Buscar el usuario por ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el evento está en la lista de eventos a los que el usuario asiste
    const eventIndex = user.attendingEvents.findIndex(
      (event) => event._id.toString() === eventId
    );
    if (eventIndex !== -1) {
      // Remover el evento de la lista de eventos del usuario
      user.attendingEvents.splice(eventIndex, 1);
      await user.save();
    }

    // Devolver respuesta exitosa
    return res
      .status(200)
      .json({ message: 'Asistencia cancelada exitosamente', event });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error al cancelar asistencia: ${error.message}` });
  }
};

const getAttendeesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'ID de evento no válido' });
    }

    const event = await Event.findById(eventId).populate(
      'attendants',
      'userName'
    );

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    return res.status(200).json(event.attendants);
  } catch (error) {
    console.error('Error al obtener asistentes para el evento:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
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
};
