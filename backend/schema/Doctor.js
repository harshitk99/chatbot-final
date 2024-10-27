const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: String,
  specialty: String,
  availableSlots: [Date], // e.g., ["2024-10-10T09:00:00", "2024-10-10T14:00:00"]
  contact: String,
});

module.exports = mongoose.model('Doctor', doctorSchema);
