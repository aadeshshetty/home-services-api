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
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", login);

router.post("/login_with_phone", () => loginUser);

router.post("/verify", verifyEmailOtp);
router.post("/set-password", setPassword);

router.get(
  "/me",
  () => checkAuth,
  () => fetchCurrentUser
);

// router.get("/admin", checkAuth, checkAdmin, handleAdmin);

module.exports = router;
