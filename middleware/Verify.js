import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  /* get headers */
  const authHeader = req.headers["x-access-token"];
  /* get token */
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);
  /* token validation */
  if (token === null) {
    return res.sendStatus(401);
  }
  /* verify token */
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  });
};

export const isAdmin = async (req, res, next) => {
  const role = req.role;
  if (role !== "Admin") {
    return res.status(403).json({
      msg: "Admin required",
    });
  }
  next();
};

export const isStaff = async (req, res, next) => {
  const role = req.role;
  if (role !== "Staff") {
    return res.status(403).json({
      msg: "Staff Required",
    });
  }
  next();
};
