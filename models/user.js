const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'driver', 'admin'],
      default: 'customer',
    },
    profilePictureUrl: { type: String },
    isAvailable: { type: Boolean, default: false }, // For drivers
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);