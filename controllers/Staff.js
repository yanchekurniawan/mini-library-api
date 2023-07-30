import { Book } from "../models/BookModel.js";
import { Loaning } from "../models/LoanBook.js";
import { borrowBook, getRemainingDays } from "./User.js";
import { ObjectId } from "bson";
import JSJoda from "js-joda";

export const getAllBorrowedBooks = async (req, res) => {
  try {
    const borrowedBook = await Loaning.aggregate([
      {
        $lookup: {
          localField: "userId",
          from: "users",
          foreignField: "_id",
          as: "User",
        },
      },
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
          "Book.img.bookImg": 0,
          "Book.img.size": 0,
          "Book.img.filename": 0,
          "Book.img.contentType": 0,
          "Book.stock": 0,
        },
      },
    ]);
    if (!borrowedBook[0]) {
      res.status(404).json({
        code: 404,
        status: "Not found",
        errors: {
          msg: "No books borrowed yet",
        },
        data: null,
      });
    }
    const dayRemains = getRemainingDays(borrowedBook);
    dayRemains.map((val, index) => {
      if (val < 0) {
        borrowedBook[index].remainingDays = "Exceeded the return deadline";
        borrowedBook[index].penalty =
          borrowedBook[index].Book.cost * Math.abs(val);
        /* borrowedBook.map((val, index) => {
          val.remainingDays = "Exceeded the return deadline";
          val.penalty = val.Book.cost * Math.abs(dayRemains);
        }); */
      } else {
        borrowedBook[index].remainingDays = Math.abs(val);
        /* borrowedBook.map((val, index) => {
          val.remainingDays = dayRemains[index];
        }); */
      }
    });
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        borrowedBook,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

export const returnBooks = async (req, res) => {
  try {
    const { id, penalty } = req.body;
    /* check loaning */
    const loaning = await Loaning.find({ _id: new ObjectId(id) });
    if (!loaning[0]) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "Book lending data not found",
        },
        data: null,
      });
    }
    const bookId = loaning[0].bookId;
    const returnedAt = new Date();
    const qty = loaning[0].qty;
    /* get book stock */
    const book = await Book.find(
      { _id: new ObjectId(bookId) },
      { _id: 0, stock: 1 }
    );
    const { stock } = book[0];
    /* Update loaning status */
    await Loaning.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isReturned: true,
          returnedAt: new Date(`${returnedAt.toISOString().split("T")[0]}Z`),
          penalty,
        },
      }
    );
    /* Update book stock */
    await Book.updateOne(
      { _id: new ObjectId(bookId) },
      {
        $set: {
          stock: stock + qty,
        },
      }
    );
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        msg: "The book has been return successfully",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

export const getAllReturnedBooks = async (req, res) => {
  try {
    const returnedBook = await Loaning.aggregate([
      {
        $lookup: {
          localField: "userId",
          from: "users",
          foreignField: "_id",
          as: "User",
        },
      },
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
          "Book.img.bookImg": 0,
          "Book.img.size": 0,
          "Book.img.filename": 0,
          "Book.img.contentType": 0,
          "Book.stock": 0,
        },
      },
    ]);
    if (!returnedBook[0]) {
      res.status(404).json({
        code: 404,
        status: "Not found",
        errors: {
          msg: "No books returned yet",
        },
        data: null,
      });
    }
    const LocalDate = JSJoda.LocalDate;
    returnedBook.map((val) => {
      /* get book returned date */
      const startDate = new LocalDate.parse(
        val.returnedAt.toISOString().split("T")[0]
      );
      /* get the deadline */
      const deadline = new Date();
      deadline.setDate(val.loanAt.getDate() + val.loanDeadline);
      const endDate = new LocalDate.parse(deadline.toISOString().split("T")[0]);
      /* get the lateness */
      const lateness = JSJoda.ChronoUnit.DAYS.between(startDate, endDate);
      val.lateness = Math.abs(lateness);
    });
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        returnedBook,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* chart dashboard */
export const staffDashboard = async (req, res) => {
  try {
    const date = new Date();
    const nowYears = date.getFullYear();
    const { years = nowYears } = req.body;
    console.log(years);
    const mth = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const borrowedBookPerMonth = await Loaning.aggregate([
      {
        /* get borrowed book on a years */
        $match: {
          loanAt: {
            $gte: new Date(Date.UTC(years, 0, 1)),
            $lt: new Date(Date.UTC(years, 11, 31)),
          },
        },
      },
      {
        /* calculate amount of borrowed book per month in year */
        $group: {
          _id: {
            $arrayElemAt: [
              mth,
              {
                $month: "$loanAt",
              },
            ],
          },
          total: {
            $sum: 1,
          },
        },
      },
    ]);
    /* console.log(borrowedBookPerMonth); */
    const incomePerMonth = await Loaning.aggregate([
      {
        /* get borrowed book on a years */
        $match: {
          loanAt: {
            $gte: new Date(Date.UTC(years, 0, 1)),
            $lt: new Date(Date.UTC(years, 11, 31)),
          },
        },
      },
      {
        /* calculate amount of borrowed book per month in year */
        $group: {
          _id: {
            $arrayElemAt: [
              mth,
              {
                $month: "$loanAt",
              },
            ],
          },
          total: {
            $sum: {
              $toDouble: "$totalPayment",
            },
          },
        },
      },
    ]);
    /* console.log(incomePerMonth);
    console.log(incomePerMonth[0].total); */
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        borrowedBookPerMonth,
        incomePerMonth,
      },
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
