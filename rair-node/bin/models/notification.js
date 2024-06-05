const { Schema } = require('mongoose');

const Notification = new Schema({
  user: { type: String, required: true, unique: false },
  type: { type: String, required: true, unique: false },
  message: { type: String, required: false, default: true },
  data: [{ type: String, required: false }],
  read: { type: Boolean, required: true, default: false },
}, { versionKey: false });

module.exports = Notification;
