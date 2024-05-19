const User = require("../models/user.model");
const Categories = require("../models/categories.model");
const Services = require("../models/services.model");
const Cart = require("../models/carts.model");
const Order = require("../models/orders.model");
const { razorpayInstance } = require("../config");

const uuid = require("uuid");
const crypto = require("crypto");

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

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Categories.find();
    res.status(201).json({
      type: "success",
      message: "categories Fetched",
      data: {
        categories: categories,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getServices = async (req, res, next) => {
  try {
    const categories = await Categories.find();
    let services = [];
    const serv = categories.map(async (data) => {
      const name = data.categoryname.split(" ").join("");
      const model = Services(name);
      const servs = await model.find();
      services.push(...servs);
    });
    await Promise.all(serv);
    res.status(201).json({
      type: "success",
      message: "categories Fetched",
      data: {
        services: services,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryServices = async (req, res, next) => {
  try {
    const { categoryName } = req.body;
    const model = Services(categoryName);
    const services = await model.find();
    res.status(201).json({
      type: "success",
      message: "categories Fetched",
      data: {
        services: services,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { token, servicename, Workers, Price } = req.body;
    const userId = verifyJwtToken(token, next);
    let ifExists = false;
    if (!userId) {
      next({ status: 403, message: "Please Login Again" });
      return;
    }
    const existingServices = await Cart.find({ userId }).exec();
    existingServices.map((data) => {
      if (data.servicename === servicename) {
        next({ status: 400, message: "Already Exists" });
        ifExists = true;
        return;
      }
    });
    if (!ifExists) {
      const cart = new Cart({
        userId,
        servicename,
        Workers,
        Price,
      });
      await cart.save();
      res.status(201).json({
        type: "success",
        message: "cart item added",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getCartItems = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = verifyJwtToken(token, next);
    if (!userId) {
      next({ status: 403, message: "Please Login Again" });
      return;
    }
    const existingServices = await Cart.find({ userId }).exec();
    res.status(201).json({
      type: "success",
      message: "cart items fetched",
      data: {
        cartItems: existingServices,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { token, servicename, Workers, Price } = req.body;
    const userId = verifyJwtToken(token, next);
    let ifExists = false;
    if (!userId) {
      next({ status: 403, message: "Please Login Again" });
      return;
    }
    await Cart.findOneAndDelete({ userId, servicename });
    res.status(201).json({
      type: "success",
      message: "cart items removed",
    });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { amount, token } = req.body;
    const userId = verifyJwtToken(token, next);
    if (!userId) {
      next({ status: 403, message: "Please Login Again" });
      return;
    }
    const receiptId = "Order_RCPT_" + uuid.v4();
    const orderData = {
      UserId: userId,
      PaymentStatus: "pending",
      Amount: amount,
      ReceiptId: receiptId,
    };
    const order = new Order(orderData);
    await order.save();
    const razorpayData = {
      amount: amount,
      currency: "INR",
      receipt: receiptId,
      payment_capture: 1,
    };
    razorpayInstance.orders
      .create(razorpayData)
      .then((razorpayOrder) => {
        const orderId = razorpayOrder.id;
        res.status(500).json({
          type: "success",
          message: "order created",
          data: {
            orderId: orderId,
          },
        });
      })
      .catch((err) => {
        res.status(500).json({
          type: "failure",
          message: "Payment failed",
        });
      });
  } catch (err) {
    next(err);
  }
};

exports.paymentVerify = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const crypto = require("crypto");
  const generated_signature = crypto
    .createHmac("sha256", "YOUR_RAZORPAY_KEY_SECRET")
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature === signature) {
    await Order.updateOne({ orderId }, { PaymentStatus: "paid" });
    res.json({ status: "Payment verified successfully" });
  } else {
    res.status(400).json({ status: "Invalid signature" });
  }
};
