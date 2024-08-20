const eventRoutes = require('./events');
const usersRoutes = require('./users');

const mainRouter = require('express').Router();

mainRouter.use('/users', usersRoutes);
mainRouter.use('/events', eventRoutes);

module.exports = mainRouter;