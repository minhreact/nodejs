"use strict";

const CheckoutService = require("../services/checkout.service");
const { SuccessResponse } = require("../core/success.response");

class CheckoutController {
  // new
  checkoutReview = async (req, res, next) => {
    new SuccessResponse({
      message: "create new cart successfully!",
      metadata: await CheckoutService.checkoutReview(req.body),
    }).send(res);
  };
}

module.exports = new CheckoutController();
