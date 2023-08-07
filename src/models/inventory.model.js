"use strict";

// key !dmbg indtall by mongo

const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Inventory";
const COLLECTION_NAME = "Inventories";
// Declare the Schema of the Mongo model
var inventorySchema = new Schema(
  {
    invent_product: { type: Schema.Types.ObjectId, ref: "Product" },
    invent_location: { type: String, default: "unKnow" },
    invent_stock: { type: Number, required: true },
    invent_shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    invent_reservations: { type: Array, default: [] },
    /*
    cartId:,
    stock:1,
    createdOn:
    */
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = {
  inventory: model(DOCUMENT_NAME, inventorySchema),
};
