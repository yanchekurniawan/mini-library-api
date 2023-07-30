import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const refreshToken = async (req, res) => {
  try {
    /* get token from cookie */
    const refreshToken = req.cookies.refreshToken;
    /* check refresh token on db */
    const user = await User.find({ refreshToken });
    if (user.length === 0) {
      return res.sendStatus(403);
    }
    /* get user id, name, email, role */
    const userId = user[0]._id;
    const name = user[0].name;
    const email = user[0].email;
    const role = user[0].role;
    /* verify token */
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res.sendStatus(403);
        }
        /* generate new access token */
        const accessToken = jwt.sign(
          { userId, name, email, role },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "180s",
          }
        );
        /* send new access token */
        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
