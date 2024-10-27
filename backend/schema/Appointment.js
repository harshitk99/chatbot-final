const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: String,
  contact: String,
  doctor: String,
  date: Date,
  time: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model("Appointment", appointmentSchema);

