import User from "../models/UserModel.js";
import { body, check } from "express-validator";
import bcrypt from "bcrypt";

/* User Rgister Validation */
export const registerValidation = () => {
  return [
    check("email", "Invalid email format").isEmail(),
    body("email").custom(async (value) => {
      /* check duplicate email */
      console.log({ value });
      const emailAlreadyInUse = await User.find({ email: value });
      console.log(emailAlreadyInUse.length);
      if (emailAlreadyInUse.length !== 0) {
        throw new Error("Email already in use");
      }
    }),
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password must consist of at least 8 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password does not match password");
      }
      return true;
    }),
  ];
};

/* User Login Validation */
export const loginValidation = () => {
  return [
    body("email").custom(async (value) => {
      /* get user by email */
      const user = await User.find({ email: value });
      if (user.length === 0) {
        throw new Error("Email not found");
      }
      return true;
    }),
    body("password").custom(async (value, { req }) => {
      /* get user by email */
      const user = await User.find({ email: req.body.email });
      if (user.length === 0) {
        return true;
      }
      /* compare */
      const matchPassword = await bcrypt.compare(value, user[0].password);
      if (!matchPassword) {
        throw new Error("Incorrect email/password");
      }
      return true;
    }),
  ];
};

/* Change Password Validation */
export const changePasswordValidation = () => {
  return [
    body("oldPassword").custom(async (value, { req }) => {
      /* get user by email */
      const user = await User.find({ email: req.body.email });
      if (user.length === 0) {
        return true;
      }
      /* compare password */
      const matchPassword = await bcrypt.compare(value, user[0].password);
      if (!matchPassword) {
        throw new Error("Incorrect Password");
      }
      return true;
    }),
    check("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must consist of at least 8 characters"),
    body("confNewPassword").custom((value, { req }) => {
      console.log(`VALUE = ${value}, New PASS = ${req.body.newPassword}`);
      if (value !== req.body.newPassword) {
        throw new Error("Confirm password does not match password");
      }
      return true;
    }),
  ];
};

/* Edit Profile Data Validation */
export const editProfileValidation = () => {
  return [
    check("newEmail", "Invalid email format").isEmail(),
    body("newEmail").custom(async (value, { req }) => {
      /* find user */
      const user = await User.find({ refreshToken: req.cookies.refreshToken });
      const userEmail = user[0].email;
      /* check duplicate email */
      console.log({ value });
      const emailAlreadyInUse = await User.find({ email: value });
      console.log(emailAlreadyInUse.length);
      if (value !== userEmail && emailAlreadyInUse.length !== 0) {
        throw new Error("Email already in use");
      }
    }),
  ];
};
