import { validationResult } from "express-validator";
import User from "../models/UserModel.js";
import { ObjectId } from "bson";
import bcrypt from "bcrypt";

/* getAllUser Account */
export const getAllUser = async (req, res) => {
  try {
    /* get all user fromb db */
    const users = await User.find(
      {},
      {
        name: 1,
        email: 1,
        role: 1,
      }
    );
    res.status(200).json(users);
  } catch (error) {
    res.sendStatus(400);
  }
};

/* createStaffAccounts */
export const addStaffAccount = async (req, res) => {
  const { name, email, password, role = "Staff" } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      msg: errors.array(),
    });
  }
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(password, saltRounds);
  try {
    await User.insertMany({
      name,
      email,
      password: hashPassword,
      role,
    });
    res.status(201).json({
      msg: "Staff account created successfully",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

/* editUsersRole */
export const changeUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    await User.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          role,
        },
      }
    );
    res.status(200).json({
      msg: "Role changed successfully",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

/* delete user account */
export const deleteUserAccounts = async (req, res) => {
  try {
    const { userId } = req.body;
    await User.deleteOne({ _id: new ObjectId(userId) });
    res.status(200).json({
      msg: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const adminDasboard = async (req, res) => {
  try {
    const userCount = await User.aggregate([
      {
        $group: {
          _id: "$role",
          books: {
            $sum: 1,
          },
        },
      },
    ]);
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        userCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
