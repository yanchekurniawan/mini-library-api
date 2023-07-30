import mongoose from "mongoose";

/* Schema */
const User = mongoose.model("User", {
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    require: true,
  },
  refreshToken: {
    type: String,
    require: true,
  },
});

export default User;
