const User = require("../models/user.model");

const {
  EMAIL_ALREADY_EXISTS_ERR,
  USER_NOT_FOUND_ERR,
  INCORRECT_OTP_ERR,
} = require("../errors");

// const { checkPassword, hashPassword } = require("../utils/password.util");
const { createJwtToken, verifyJwtToken } = require("../utils/token.util");
const bcrypt = require("bcrypt");
const { generateOTP, fast2sms, mailSender } = require("../utils/otp.util");

// --------------------- create new user ---------------------------------

exports.registerUser = async (req, res, next) => {
  try {
    let { email, name } = req.body;

    // check duplicate phone Number
    const emailExist = await User.findOne({ email });

    if (emailExist) {
      if (!emailExist.password) {
        await User.deleteOne(emailExist);
      } else {
        next({ status: 400, message: EMAIL_ALREADY_EXISTS_ERR });
        return;
      }
    }
    // generate otp
    const otp = generateOTP(6);
    // save otp to user collection
    // user.phoneOtp = otp;
    // await user.save();
    // send otp to phone number
    await mailSender(email, "Home services OTP", `Your OTP is ${otp}`).then(
      async (data) => {
        if (data.response.includes("OK")) {
          const createUser = new User({
            email,
            name,
            role: email === process.env.ADMIN_PHONE ? "ADMIN" : "USER",
            emailOtp: otp,
          });
          const user = await createUser.save();
          res.status(200).json({
            type: "success",
            message: "Account created OTP sent to Email ID",
            data: {
              userId: user._id,
            },
          });
        }
      }
    );
  } catch (error) {
    next(error);
    next({ status: 400, message: EMAIL_ALREADY_EXISTS_ERR });
  }
};

// ------------ login with phone otp ----------------------------------

exports.loginWithPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      next({ status: 400, message: "PHONE_NOT_FOUND_ERR" });
      return;
    }

    res.status(201).json({
      type: "success",
      message: "OTP sended to your registered phone number",
      data: {
        userId: user._id,
      },
    });

    // generate otp
    const otp = generateOTP(6);
    // save otp to user collection
    user.phoneOtp = otp;
    user.isAccountVerified = true;
    await user.save();
    // send otp to phone number
    await fast2sms(
      {
        message: `Your OTP is ${otp}`,
        contactNumber: user.phone,
      },
      next
    );
  } catch (error) {
    next(error);
  }
};

// ---------------------- verify phone otp -------------------------

exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      next({ status: 400, message: USER_NOT_FOUND_ERR });
      return;
    }

    if (user.emailOtp !== otp) {
      next({ status: 400, message: INCORRECT_OTP_ERR });
      return;
    }

    user.emailOtp = "";
    await user.save();

    res.status(201).json({
      type: "success",
      message: "OTP verified successfully",
      data: {
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.setPassword = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      next({ status: 400, message: USER_NOT_FOUND_ERR });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.save();
    const token = createJwtToken({ userId: user._id });
    res.status(201).json({
      type: "success",
      message: "Password set successfully",
      data: {
        token: token,
      },
    });
  } catch (error) {
    next({ status: 400, message: "ERROR_SET_PASSWORD" });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (user) {
      const token = createJwtToken({ userId: user._id });
      // check the user password with the hashed password stored in the database
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        res.status(200).json({
          type: "success",
          message: "login successful",
          data: {
            userId: user._id,
            token: token,
          },
        });
      } else {
        next({ status: 400, message: "Invalid Password" });
      }
    } else {
      next({ status: 400, message: USER_NOT_FOUND_ERR });
    }
  } catch (error) {
    next(error);
  }
};

// --------------- fetch current user -------------------------

exports.fetchUserId = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = verifyJwtToken(token, next);
    if (!userId) {
      next({ status: 403, message: "Please Login Again" });
      return;
    }
    res.status(201).json({
      type: "success",
      message: "User Fetched",
      data: {
        userId: userId,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.fetchCurrentUser = async (req, res, next) => {
  try {
    const currentUser = res.locals.user;

    return res.status(200).json({
      type: "success",
      message: "fetch current user",
      data: {
        user: currentUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --------------- admin access only -------------------------

exports.handleAdmin = async (req, res, next) => {
  try {
    const currentUser = res.locals.user;

    return res.status(200).json({
      type: "success",
      message: "Okay you are admin!!",
      data: {
        user: currentUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
