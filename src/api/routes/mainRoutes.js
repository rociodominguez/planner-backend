const eventRoutes = require('../routes/events');
const usersRoutes = require('../routes/users');

const mainRouter = require('express').Router();

mainRouter.use('/users', usersRoutes);
mainRouter.use('/events', eventRoutes);

module.exports = mainRouter;