const mongoose = require('mongoose');
//const favourite = require('./favourite');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  userType: {
    type: String,
    enum: ['guest', 'host'],
    default: 'guest',
  },
  favourites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
  }]
});

module.exports = mongoose.model('User', userSchema);