require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;

const ipRateLimiter = require("./src/middlewares/ipRateLimiter");
const connectDB = require("./src/config/DBConn");

const db = connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/signup", ipRateLimiter, require("./src/routes/signup"));
app.use("/signin", ipRateLimiter, require("./src/routes/signin"));
app.use("/otp", ipRateLimiter, require("./src/routes/otp"));
app.use("/contactus", ipRateLimiter, require("./src/routes/contactUs"));
app.use("/authentication", ipRateLimiter, require("./src/routes/authentication"));

db.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);

    //for removing all consoles in production
    if(process.env.NODE_ENV === "production") {
      console.log = () => {};
    }
  });
}).on("error", (err) => {
  console.log(err);
});

//version 1 complete