import { Book } from "../models/BookModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ObjectId } from "bson";

/* img upload location */
export const diskStorage = multer.diskStorage({
  /* file location config */
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  /* filename config */
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

/* addBook */
export const addBook = async (req, res) => {
  try {
    const {
      title,
      years,
      author,
      publisher,
      category,
      page,
      stock,
      cost,
    } = req.body;
    const { path, size, filename, mimetype } = req.file;
    console.log(req.file);
    /* if no book-img uploaded */
    if (!path) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "No File is selected",
        },
        data: null,
      });
    }
    /* read file */
    const bookImg = fs.readFileSync(path);
    /* encode image to string */
    const encBookImg = bookImg.toString("base64");
    await Book.insertMany({
      title,
      years,
      author,
      publisher,
      category,
      page,
      img: {
        size,
        filename,
        contentType: mimetype,
        path,
        bookImg: new Buffer(encBookImg, "base64"),
      },
      stock,
      cost,
    });
    res.status(201).json({
      code: 201,
      status: "Created",
      errors: null,
      data: {
        msg: "Book data saved successfully",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* getAllBooks */
export const getAllBook = async (req, res) => {
  try {
    const books = await Book.find(
      {},
      {
        img: {
          contentType: 0,
        },
      }
    );
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: books,
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* editBookById */
export const editBook = async (req, res) => {
  try {
    const { id } = req.body;
    const book = await Book.find({ _id: new ObjectId(id) });
    if (!book[0]) {
      return res.status(400).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "Can't find book data",
        },
        data: null,
      });
    }
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        book,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* updateBookById */
export const updateBookById = async (req, res) => {
  try {
    const {
      id,
      title,
      years,
      author,
      publisher,
      category,
      page,
      stock,
    } = req.body;
    const { size, filename, mimetype, path } = req.file;
    /* check file path */
    if (!path) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "No File is selected",
        },
        data: null,
      });
    }
    const img = fs.readFileSync(path);
    const encImg = img.toString("base64");
    /* update book */
    const bookUpdate = {
      title,
      years,
      author,
      publisher,
      category,
      page,
      img: {
        size,
        filename,
        contentType: mimetype,
        path,
        bookImg: new Buffer(encImg, "base64"),
      },
      stock,
    };

    await Book.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: bookUpdate,
      }
    );
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        msg: "Book data updated successfully",
        bookUpdate,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* get book detail by id */
export const getBookDetailById = async (req, res) => {
  try {
    const { id } = req.query;
    console.log({ id });
    const book = await Book.find({ _id: new ObjectId(id) });
    if (!book[0]) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        errors: {
          msg: "Can't find book data",
        },
        data: null,
      });
    }
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        book,
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};

/* Delete book by id */
export const deleteBookById = async (req, res) => {
  try {
    const { id } = req.body;
    console.log({ id });
    const existsBook = await Book.find({ _id: new ObjectId(id) });
    if (!existsBook[0]) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        errors: {
          msg: "Can't find book data",
        },
        data: null,
      });
    }
    await Book.deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({
      code: 200,
      status: "OK",
      errors: null,
      data: {
        msg: "Book data deleted successfully",
      },
    });
  } catch (error) {
    res.sendStatus(400);
    console.log(error);
  }
};
