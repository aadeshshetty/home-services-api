const express = require("express");
const router = express.Router();

const checkAuth = require("../middlewares/checkAuth");
// const checkAdmin = require("../middlewares/checkAdmin");
const {
  fetchCurrentUser,
  loginUser,
  registerUser,
  verifyEmailOtp,
  setPassword,
  login,
  fetchUserId,
  getCategories,
  getServices,
  getCategoryServices,
  addToCart,
  getCartItems,
  removeFromCart,
  createOrder,
  paymentVerify,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", login);

router.post("/login_with_phone", () => loginUser);

router.post("/verify", verifyEmailOtp);
router.post("/set-password", setPassword);
router.post("/get-user", fetchUserId);
router.get("/get-categories", getCategories);
router.get("/get-services", getServices);
router.post("/get-services", getCategoryServices);
router.post("/add-to-cart", addToCart);
router.post("/get-cart", getCartItems);
router.post("/remove-from-cart", removeFromCart);
router.post("/generate-order", createOrder);
router.post("/verify-payment", paymentVerify);

router.get(
  "/me",
  () => checkAuth,
  () => fetchCurrentUser
);

// router.get("/admin", checkAuth, checkAdmin, handleAdmin);

module.exports = router;
