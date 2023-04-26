"use strict";

// level 0

// const config = {
//   app: {
//     post: 3055,
//   },
//   db: {
//     host: "127.0.0.1",
//     port: 27017,
//     name: "shopDEV",
//   },
// };

// level 1

const dev = {
  app: {
    post: process.env.DEV_APP_PORT,
  },
  db: {
    host: process.env.DEV_APP_HOST,
    port: process.env.DEV_PORT_DB,
    name: process.env.DEV_APP_NAME,
  },
};
const prod = {
  app: {
    post: process.env.PROD_APP_PORT,
  },
  db: {
    host: process.env.PROD_APP_HOST,
    port: process.env.PROD_PORT_DB,
    name: process.env.PROD_APP_NAME,
  },
};

const config = { dev, prod };
const env = process.env.NODE_ENV || "dev";

module.exports = config[env];
