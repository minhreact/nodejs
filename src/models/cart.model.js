"use strict";

const { model, Schema } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Cart";
const COLLECTION_NAME = "carts";

var cartSchema = new Schema(
  {
    cart_state: {
      type: String,
      required: true,
      enum: ["active", "inactive", "failed", "pending"],
      default: "active",
    },
    cart_products: { type: Array, require: true, default: [] },

    /* 
    [
        {
            productId,
            shopId,
            quantity,
            name,
            price,
        }
    ]
    
    */
    cart_count_product: { type: Number, default: 0 },
    cart_userId: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "cart_created_on",
      updatedAt: "cart_updated_on",
    },
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = {
  cart: model(DOCUMENT_NAME, cartSchema),
};
