const crypto = require('crypto');

const generateOneTimeZoomLink = (userId, zoomLink) => {
  const token = crypto.randomBytes(20).toString('hex'); // Generate unique token
  return `https://backend-production-cbe2.up.railway.app/api/zoom-access?token=${token}&userId=${userId}&zoomLink=${encodeURIComponent(zoomLink)}`;
};

module.exports = generateOneTimeZoomLink;
