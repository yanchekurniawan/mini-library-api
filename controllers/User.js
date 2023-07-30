import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import { ObjectId } from "bson";
import { validationResult } from "express-validator";
import { Book } from "../models/BookModel.js";
import { Loaning } from "../models/LoanBook.js";
import JSJoda, { LocalDate } from "js-joda";

/* Register */
export const userRegister = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  /* get error from registerValidation */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      status: "Bad Request",
      errors: {
        msg: errors.array(),
      },
      data: null,
    });
  }

  /* Hashing password */
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(password, saltRounds);
  try {
    /* insert user */
    await User.insertMany({
      name,
      email,
      password: hashPassword,
      role,
    });
    res.status(200).json({
      msg: "Account created successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

/* User Login */
export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  /* get errors from loginValidation */
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      msg: errors.array(),
    });
  }
  /* get id, name and role */
  const user = await User.find({ email });
  const userId = user[0]._id;
  const userName = user[0].name;
  const userRole = user[0].role;
  /* generate access token */
  const accessToken = jwt.sign(
    { userId, userName, email, userRole },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15s",
    }
  );
  /* generate refresh token */
  const refreshToken = jwt.sign(
    { userId, userName, email, userRole },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
  /* set refresh token to db and cookie */
  await User.updateOne(
    {
      _id: new ObjectId(userId),
    },
    {
      $set: {
        refreshToken,
      },
    }
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  /* send access token to client */
  res.status(200).json({
    code: 200,
    status: "OK",
    errors: null,
    data: {
      accessToken,
    },
  });
};

/* User Logout */
export const userLogout = async (req, res) => {
  /* get refreshToken from cookie */
  const refreshToken = req.cookies.refreshToken;
  /* check token on db */
  const checkToken = await User.find({ refreshToken });
  if (!checkToken[0]) {
    return res.sendStatus(204);
  }
  /* update refreshToken value on db to null */
  const userId = checkToken._id;
  await User.updateOne(
    {
      _id: new ObjectId(userId),
    },
    {
      $set: {
        refreshToken,
      },
    }
  );
  /* Delete token from cookie */
  res.clearCookie("refreshToken");
  res.sendStatus(200);
};

/* Change Password */
export const changePassword = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { newPassword } = req.body;

  console.log(`NEW PASSWORD = ${newPassword} `);
  /* get error from changePasswordValidation */
  const errors = validationResult(req);
  console.log("ERRORNYA: ", errors);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      status: "Bad Request",
      errors: {
        msg: errors.array(),
      },
      data: null,
    });
  }

  /* if no error */
  try {
    const user = await User.find({ refreshToken });
    if (!user[0]) {
      return res.status(204).json({
        code: 204,
        status: "Unauthorized",
        errors: {
          msg: "Token not found",
        },
        data: null,
      });
    }
    const userId = user[0]._id;

    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashPassword,
        },
      }
    );

    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        msg: "Password successfully changed",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* Edit Profile */
export const editProfileData = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { newName, newEmail } = req.body;

  /* get error from editProfileValidation */
  const errors = validationResult(req);
  console.log("ERRORNYA: ", errors);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      status: "Bad Request",
      errors: {
        msg: errors.array(),
      },
      data: null,
    });
  }

  try {
    const user = await User.find({ refreshToken });
    if (!user[0]) {
      return res.status(204).json({
        code: "204",
        status: "Unauthorized",
        errors: {
          msg: "Token not found",
        },
        data: null,
      });
    }

    const userId = user[0]._id;
    await User.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          name: newName,
          email: newEmail,
        },
      }
    );

    res.status(200).json({
      code: "200",
      status: "OK",
      errors: null,
      data: {
        msg: "Profiles Data Successfully Updated",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* Get User ID Function */
const getUserId = async (req, res) => {
  /* decode token and get userId */
  const refreshToken = req.cookies.refreshToken;
  /* check token */
  const user = await User.find({ refreshToken });
  if (!user[0]) {
    res.status(403).json({
      code: 403,
      status: "Forbidden",
      errors: null,
      data: null,
    });
  }
  console.log(user);
  return user[0]._id;
};

/* borrowing a book */
export const borrowBook = async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    const { loanDeadline, bookId, qty } = req.body;
    const loanAt = new Date();
    console.log();
    /* get cost */
    const book = await Book.find({ _id: new ObjectId(bookId) });
    if (!book[0]) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "Can't find book data",
        },
        data: null,
      });
    } else if (book[0].stock === 0) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "Book stock is running out",
        },
        data: null,
      });
    } else if (book[0].stock < qty) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "The amount you enter exceeds the book stock",
        },
        data: null,
      });
    }

    /* Loan Check */
    const borrowedSameBook = await Loaning.find({
      userId,
      bookId,
      isReturned: false,
    });
    console.log(`LENGTH ${borrowedSameBook.length}`);
    if (borrowedSameBook.length > 0) {
      console.log("MASUK KO");
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "You have the same book that has not been returned",
        },
        data: null,
      });
    }

    const cost = book[0].cost;
    const totalPayment = parseFloat(cost) * parseInt(loanDeadline) * qty;
    /* insert loan book */
    await Loaning.insertMany({
      loanAt: new Date(`${loanAt.toISOString().split("T")[0]}Z`),
      loanDeadline,
      qty,
      totalPayment,
      isReturned: false,
      returnedAt: null,
      penalty: null,
      bookId,
      userId,
    });

    /* Upate stock */
    const stock = book[0].stock - qty;
    await Book.updateOne(
      { _id: new ObjectId(bookId) },
      {
        $set: {
          stock,
        },
      }
    );

    res.status(201).json({
      code: 201,
      status: "Created",
      errors: null,
      data: {
        msg: "Book loan data created successfully",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* export const getRemainingDays1 = (listOfBook) => {
  // get remaining days of each book
  const LocalDate = JSJoda.LocalDate;
  const date = new Date().toISOString().split("T")[0];
  const deadline = new Date();
  // get now date
  const startDate = new LocalDate.parse(date);
  console.log({ date, startDate });
  const dayRemains = listOfBook.map((val) => {
    // get deadline date
    deadline.setDate(val.loanAt.getDate() + val.loanDeadline);
    const endDate = new LocalDate.parse(deadline.toISOString().split("T")[0]);
    return JSJoda.ChronoUnit.DAYS.between(startDate, endDate);
  });
  return dayRemains;
}; */

export const getRemainingDays = (loanAt, loanDeadline) => {
  const LocalDate = JSJoda.LocalDate;
  const date = new Date().toISOString().split("T")[0];
  const deadline = new Date();

  const startDate = new LocalDate.parse(date);
  deadline.setDate(loanAt.getDate() + loanDeadline);
  const endDate = new LocalDate.parse(deadline.toISOString().split("T")[0]);
  return JSJoda.ChronoUnit.DAYS.between(startDate, endDate);
};

export const getMyBooks = async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    /* get a borrowed book */
    const book = await Loaning.find({ userId });
    if (!book[0]) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "No books borrowed yet",
        },
        data: null,
      });
    }
    /* const bookId = book.map((val) => val.bookId);
  const listOfBook = await Book.find(
    { _id: { $in: bookId } },
    { img: { bookImg: 0 } }
  ); */
    const listOfBook = await Loaning.aggregate([
      {
        $lookup: {
          localField: "userId",
          from: "users",
          foreignField: "_id",
          as: "User",
        },
      },
      /* $unwind used for getting data in object or for one record only not in array */
      {
        $unwind: "$User",
      },
      {
        $lookup: {
          localField: "bookId",
          from: "books",
          foreignField: "_id",
          as: "Book",
        },
      },
      {
        $unwind: "$Book",
      },
      {
        $match: {
          $and: [
            {
              "User._id": userId,
              isReturned: false,
            },
          ],
        },
      },
      {
        $project: {
          "User._id": 0,
          "User.password": 0,
          "User.role": 0,
          "User.refreshToken": 0,
          "Book._id": 0,
          "Book.img.size": 0,
          "Book.img.filename": 0,
          "Book.img.contentType": 0,
          "Book.stock": 0,
        },
      },
    ]);

    listOfBook.map((book) => {
      const dayRemains = getRemainingDays(book.loanAt, book.loanDeadline);
      if (dayRemains < 0) {
        // add remaining days value to listOfBook array
        book.remainingDays = "Exceeded the return deadline";
        // set penalty
        book.penalty = book.Book.cost * Math.abs(dayRemains) * 2;
      } else {
        book.remainingDays = dayRemains;
      }
    });

    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        listOfBook,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

export const getMyHistory = async (req, res) => {
  try {
    const userId = await getUserId(req, res);
    /* get returnedBook */
    const book = await Loaning.find({ userId, isReturned: true });
    if (!book[0]) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "No books have been returned yet",
        },
        data: null,
      });
    }

    const listOfBook = await Loaning.aggregate([
      {
        $lookup: {
          localField: "userId",
          from: "users",
          foreignField: "_id",
          as: "User",
        },
      },
      /* $unwind used for getting data in object or for one record only not in array */
      {
        $unwind: "$User",
      },
      {
        $lookup: {
          localField: "bookId",
          from: "books",
          foreignField: "_id",
          as: "Book",
        },
      },
      {
        $unwind: "$Book",
      },
      {
        $match: {
          $and: [
            {
              "User._id": userId,
              isReturned: true,
            },
          ],
        },
      },
      {
        $project: {
          "User._id": 0,
          "User.password": 0,
          "User.role": 0,
          "User.refreshToken": 0,
          "Book._id": 0,
          "Book.img.size": 0,
          "Book.img.filename": 0,
          "Book.img.contentType": 0,
          "Book.stock": 0,
        },
      },
    ]);

    listOfBook.map((book) => {
      const dayRemains = getRemainingDays(book.loanAt, book.loanDeadline);
      if (dayRemains < 0) {
        // add remaining days value to listOfBook array
        book.remainingDays = "Exceeded the return deadline";
        // set penalty
        book.penalty = book.Book.cost * Math.abs(dayRemains) * 2;
      } else {
        book.remainingDays = dayRemains;
      }
    });

    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        listOfBook,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};
