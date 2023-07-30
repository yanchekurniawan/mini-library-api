import mongoose from "mongoose";

export const Book = mongoose.model("Book", {
  title: {
    type: String,
    require: true,
  },
  years: {
    type: String,
    require: true,
  },
  author: {
    type: String,
    require: true,
  },
  publisher: {
    type: String,
    require: true,
  },
  page: {
    type: Number,
    require: true,
  },
  category: {
    type: Array,
    require: true,
  },
  img: {
    size: {
      type: Number,
      require: true,
    },
    filename: {
      type: String,
      require: true,
    },
    contentType: {
      type: String,
      require: true,
    },
    path: {
      type: String,
      require: true,
    },
    bookImg: {
      type: Buffer,
      require: true,
    },
  },
  stock: {
    type: Number,
    require: true,
  },
  cost: {
    type: mongoose.Decimal128,
    require: true,
  },
});
