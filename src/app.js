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
// tieu chuan apache
// app.use(morgan("combined"));
// library
// morgan("common");
// morgan("short");
// morgan("tiny");
// init database

// init routes
app.get("/", (req, res, next) => {
  const strComperss = "Hello World";

  return res
    .status(200)
    .json({ message: "Hello World", metadata: strComperss.repeat(1000) });
});
// handling errors

exports.app = app;
