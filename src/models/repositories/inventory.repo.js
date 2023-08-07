const { inventory } = require("../inventory.model");
const { Types } = require("mongoose");

const insertInventory = async ({
  productId,
  shopId,
  stock,
  location = "unKnow",
}) => {
  return await inventory.create({
    invent_product: productId,
    invent_shopId: shopId,
    invent_stock: stock,
    invent_location: location,
  });
};
module.exports = {
  insertInventory,
};
