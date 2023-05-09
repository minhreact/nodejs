require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();
const helmet = require("helmet");
const compression = require("compression");

// morgan la middleware de log cac request
// helmet ngan chan cac loi bao mat, ngan chan ben thu ba truy cap vao cookie
// compression(nen du lieu) giam thieu dung luong du lieu gui di va tiet kiem bang thong mang

// init middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// tieu chuan apache
// app.use(morgan("combined"));
// library
// morgan("common");
// morgan("short");
// morgan("tiny");
// init database

require("./dbs/init.mongodb");

// const { checkOverLoad } = require("./helpers/check.connect");
// checkOverLoad();
// init routes

app.use("", require("./routes"));

// handling errors

app.use((req, res, next) => {
  const error = new Error("not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  console.log("111", error);
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    // stack: error.stack,
    message: error.message || "Internal server error",
  });
});

exports.app = app;
