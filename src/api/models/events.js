const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: false,
    },
    attendants: [{ type: mongoose.Types.ObjectId, ref: 'users' }],
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

const Event = mongoose.model('events', eventSchema, 'events');

module.exports = Event;