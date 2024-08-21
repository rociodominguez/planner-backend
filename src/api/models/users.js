const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImageUrl: { type: String, required: false },
    attendingEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }],

    rol: {
      type: String,
      required: true,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },

  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (err) {
      return next(err);
    }
  }
  next();
});


const User = mongoose.model('users', userSchema, 'users');
module.exports = User;