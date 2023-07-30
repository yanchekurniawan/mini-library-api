import mongoose from "mongoose";

export const Loaning = mongoose.model("Loaning", {
  loanAt: {
    type: Date,
    require: true,
  },
  loanDeadline: {
    type: Number,
    require: true,
  },
  qty: {
    type: Number,
    require: true,
  },
  totalPayment: {
    type: mongoose.Decimal128,
    require: true,
  },
  isReturned: {
    type: Boolean,
    require: true,
  },
  returnedAt: {
    type: Date,
    require: true,
  },
  penalty: {
    type: mongoose.Decimal128,
    require: true,
  },
  bookId: {
    type: mongoose.ObjectId,
    require: true,
  },
  userId: {
    type: mongoose.ObjectId,
    require: true,
  },
});
