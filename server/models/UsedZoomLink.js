const mongoose = require('mongoose');

const UsedZoomLinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  zoomLink: { type: String, required: true },
  usedAt: { type: Date, default: Date.now }
});

const UsedZoomLink = mongoose.model('UsedZoomLink', UsedZoomLinkSchema);

module.exports = UsedZoomLink;
