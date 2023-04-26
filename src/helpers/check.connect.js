"use strict";

const mongoose = require("mongoose");
const os = require("os");
const process = require("process");

const _SECOND = 5000;
// count connect
const countConnect = () => {
  const count = mongoose.connections.length;
  console.log(`countConnect: ${count}`);
};

// check over load
const checkOverLoad = () => {
  setInterval(() => {
    const numConnect = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    const maxConnect = numCores * 4;
    console.log(`active connect: ${numConnect}`);
    console.log(`memoryUsage: ${memoryUsage / 1024 / 1024} MB`);
    if (numConnect > maxConnect) {
      console.log(`over load`);
    }
  }, _SECOND); // monitor every 5s
};

module.exports = { countConnect, checkOverLoad };
