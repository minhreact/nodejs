"use strict";
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { cart } = require("../models/cart.model");
const { getProductById } = require("../models/repositories/product.repo");
const { options } = require("../routes/cart");

/*
    key features: Cart service
    1. add product to cart [user]
    2. reduce product quantity [user]
    3. Increase product quantity [user]
    4. get list to cart [user]
    5. delete cart [user]
    6. delete cart item [user]
*/

class CartService {
  /// start repo cart ///
  static async createUserCart({ userId, product }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateOrInsert = {
        $addToSet: {
          cart_products: product,
        },
      },
      options = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateOrInsert, options);
  }

  static async updateUserCartQuantity({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_userId: userId,
        "cart_products.productId": productId,
        cart_state: "active",
      },
      updateSet = {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      },
      options = { upsert: TextDecoderStream, new: true };

    return await cart.findOneAndUpdate(query, updateSet, options);
  }

  /// end repo cart ///
  static async addProductToCart({ userId, product = {} }) {
    // check cart ton tai hay khong ?
    const userCart = await cart.findOne({ cart_userId: userId });
    if (!userCart) {
      return await CartService.createUserCart({ userId, product });
    }

    // neu co gio hang roi nhung chua co san pham nao
    if (userCart.cart_products.length === 0) {
      userCart.cart_products = [product];
      return await userCart.save();
    }

    // gio hang ton tai va da co san pham nay thi update quantity
    return await CartService.updateUserCartQuantity({ userId, product });
  }

  // update quantity

  /* 
    shop_order_ids: [
        {
            shopId,
            item_products: [
                {
                    quantity,
                    productId,
                    price,
                    old_quantity,
                    shopId,
                }
            ],
            version

        }
    ]
  
  */

  static async addToCartV2({ userId, shop_order_ids }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0];

    // check cart ton tai hay khong ?
    const foundProduct = await getProductById(productId);
    if (!foundProduct) {
      throw new NotFoundError("Product not found");
    }
    // compare
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
      throw new NotFoundError("product do not belong to the shop");
    }
    if (quantity === 0) {
      /// delete product
    }
    return await CartService.updateUserCartQuantity({
      userId,
      product: {
        productId,
        quantity: quantity - old_quantity,
      },
    });
  }

  // delete cart
  static async deleteUserCart({ userId, productId }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateSet = {
        $pull: {
          cart_products: {
            productId,
          },
        },
      };

    const deleteCart = await cart.updateOne(query, updateSet);
    return deleteCart;
  }

  // get list cart
  static async getListCart({ userId }) {
    return await cart.findOne({ cart_userId: +userId }).lean();
  }
}

module.exports = CartService;
