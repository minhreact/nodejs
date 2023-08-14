"use strict";

const DiscountService = require("../services/discount.service");
const CartService = require("../services/cart.service");
const { SuccessResponse } = require("../core/success.response");

class CartController {
  // new
  addToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "create new cart successfully!",
      metadata: await CartService.addProductToCart(req.body),
    }).send(res);
  };

  // update
  updateToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "update cart successfully!",
      metadata: await CartService.addToCartV2(req.body),
    }).send(res);
  };

  // delete
  deleteToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "delete cart successfully!",
      metadata: await CartService.deleteUserCart(req.body),
    }).send(res);
  };

  // list cart
  listToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "delete cart successfully!",
      metadata: await CartService.getListCart(req.query),
    }).send(res);
  };
}

module.exports = new CartController();
