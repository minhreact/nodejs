"use strick";

const { convertToObjectIdMongodb } = require("../../utils");
const { Cart } = require("../cart.model");

const findCartById = async (cartId) => {
  return await Cart.findOne({
    _id: convertToObjectIdMongodb(cartId),
    cart_state: "active",
  }).lean();
};

module.exports = { findCartById };
