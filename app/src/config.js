const Razorpay = require("razorpay");

exports.PORT = process.env.PORT;
exports.MONGODB_URI = process.env.MONGODB_URI;
exports.NODE_ENV = process.env.NODE_ENV;

exports.JWT_SECRET = process.env.JWT_SECRET;
exports.ORIGIN = process.env.ORIGIN;

exports.FAST2SMS = process.env.FAST2SMS;
exports.ADMIN_PHONE = process.env.ADMIN_PHONE;

exports.razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
