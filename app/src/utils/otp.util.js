const axios = require("axios");
const { FAST2SMS } = require("../config");
const nodemailer = require("nodemailer");

exports.generateOTP = (otp_length) => {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

exports.mailSender = async (email, title, body) => {
  try {
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "aadeshmarsh2000@gmail.com",
        pass: "uryw npqj fmut sutz",
      },
    });
    // Send emails to users
    let info = await transporter.sendMail({
      from: "aadesmarsh2000@gmail.com",
      to: email,
      subject: title,
      html: body,
    });
    return info;
  } catch (error) {
    console.log(error.message);
    throw new Error(error);
  }
};

exports.fast2sms = async ({ message, contactNumber }, next) => {
  try {
    await axios.get("https://www.fast2sms.com/dev/bulk", {
      params: {
        authorization: FAST2SMS,
        variables_values: message,
        route: "q",
        message: message,
        language: "english",
        sender_id: "FSTSMS",
        numbers: contactNumber,
      },
    });
    // next({ status: 400, message: "OTP sent successfully" });
    console.error("success");
  } catch (error) {
    console.error("Error sending OTP:", error);
    // next({ status: 400, message: "error" });
  }
};
