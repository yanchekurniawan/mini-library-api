import express from "express";
import {
  borrowBook,
  changePassword,
  editProfileData,
  getMyBooks,
  getMyHistory,
  userLogin,
  userLogout,
  userRegister,
} from "../controllers/User.js";
import {
  changePasswordValidation,
  editProfileValidation,
  loginValidation,
  registerValidation,
} from "../controllers/Validation.js";
import { isAdmin, isStaff, verifyToken } from "../middleware/Verify.js";
import {
  addStaffAccount,
  adminDasboard,
  changeUserRole,
  deleteUserAccounts,
  getAllUser,
} from "../controllers/Admin.js";
import { refreshToken } from "../controllers/RefreshToken.js";
import multer from "multer";
import {
  addBook,
  deleteBookById,
  diskStorage,
  editBook,
  getAllBook,
  updateBookById,
  getBookDetailById,
} from "../controllers/Book.js";
import {
  getAllBorrowedBooks,
  getAllReturnedBooks,
  returnBooks,
  staffDashboard,
} from "../controllers/Staff.js";

const router = express.Router();
/* multer */
const upload = multer({ storage: diskStorage });

router.post("/register", registerValidation(), userRegister);
router.post("/login", loginValidation(), userLogin);
router.get("/token", refreshToken);
router.delete("/logout", userLogout);
/* Admin */
router.get("/admin/users", verifyToken, isAdmin, getAllUser);
router.post(
  "/admin/users",
  verifyToken,
  isAdmin,
  registerValidation(),
  addStaffAccount
);
router.put("/admin/users", verifyToken, isAdmin, changeUserRole);
router.delete("/admin/users", verifyToken, isAdmin, deleteUserAccounts);
router.put("/admin/change-password", verifyToken, isAdmin, changePassword);
router.get("/admin/dashboard", verifyToken, isAdmin, adminDasboard);
/* Staff */
router.post(
  "/staff/books",
  verifyToken,
  isStaff,
  upload.single("bookImg"),
  addBook
);
router.get("/staff/books", verifyToken, isStaff, getAllBook);
router.post("/staff/books/edit", verifyToken, isStaff, editBook);
router.put(
  "/staff/books",
  verifyToken,
  isStaff,
  upload.single("bookImg"),
  updateBookById
);
router.delete("/staff/books", verifyToken, isStaff, deleteBookById);
router.get("/staff/borrowed", verifyToken, isStaff, getAllBorrowedBooks);
router.get("/staff/returned", verifyToken, isStaff, getAllReturnedBooks);
router.post("/staff/returned", verifyToken, isStaff, returnBooks);
router.put("/staff/change-password", verifyToken, isStaff, changePassword);
router.post("/staff/dashboard", verifyToken, isStaff, staffDashboard);
/* User */
router.get("/books", verifyToken, getAllBook);
router.get("/books/detail", verifyToken, getBookDetailById);
router.post("/books/borrow", verifyToken, borrowBook);
router.get("/books/mybooks", verifyToken, getMyBooks);
router.get("/books/history", verifyToken, getMyHistory);
router.put(
  "/change-password",
  verifyToken,
  changePasswordValidation(),
  changePassword
);
router.put(
  "/edit-profiles",
  verifyToken,
  editProfileValidation(),
  editProfileData
);
export default router;
