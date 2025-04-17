const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    // Add index for better performance
    index: true
  },
  text: { type: String, default: "" },
  person: { type: Number, default: 1 },
  start: { type: String, required: true },
  end: { type: String, required: true },
  resource: { type: String, required: true },
  barColor: { type: String, default: "#00aaff" },
  calendarID: { type: String, default: "Q2WVyy" }
}, {
  // Add timestamps for debugging
  timestamps: true
});

// Add compound index for performance
eventSchema.index({ person: 1, start: 1, end: 1 });
// eventSchema.index({ hostCode: 1, person: 1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
