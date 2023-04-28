"use strict";

const AccessService = require("../services/access.service");
const { CREATED, OK, SuccessResponse } = require("../core/success.response");

class AccessController {
  logout = async (req, res, next) => {
    new SuccessResponse({
      message: "Logout success!",
      metadata: await AccessService.logout(req.keyStore),
    }).send(res);
  };

  login = async (req, res, next) => {
    new SuccessResponse({
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  signUp = async (req, res, next) => {
    // return res.status(200).json
    new CREATED({
      message: "Registered ok",
      metadata: await AccessService.signUp(req.body),
      option: {
        limit: 10,
      },
    }).send(res);
    // return res.status(201).json(await AccessService.signUp(req.body));
  };
}

module.exports = new AccessController();
