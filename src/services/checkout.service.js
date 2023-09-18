"use strict";
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { findCartById } = require("../models/repositories/cart.repo");
const { checkProductByServer } = require("../models/repositories/product.repo");
const { getDiscountAmount } = require("./discount.service");

class CheckoutService {
  /*
        {
            cartId,
            userId,
            shop_order_ids: [{
                shopId,
                shop_discounts: [
                    {
                        shopId,
                        discountId,
                        codeId
                    }
                ],
                item_products: [
                    {
                        price,
                        quantity,
                        productId
                    }
                ]
            }]
        }
    
    */

  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    // check cartId  ton tai hay khong
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new BadRequestError("Cart not found");

    const checkout_order = {
        totalPrice: 0, // tong tien hang
        feeShip: 0, // phi ship
        totalDiscount: 0, // tong tien giam gia
        totalCheckout: 0, // tong tien thanh toan
      },
      shop_order_ids_new = [];

    // tinh tong tien bill

    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = [],
      } = shop_order_ids[i];

      // check product available
      const checkProductServer = await checkProductByServer(item_products);
      if (!checkProductServer) throw new BadRequestError("order wrong!!!");
      // tong tien don hang
      const checkoutPrice = checkProductServer.reduce((acc, cur) => {
        return acc + cur.price * cur.quantity;
      }, 0);

      // tong tien truoc khi xu ly
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, // tien truoc khi giam gia
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer,
      };
      // neu shop_discounts ton tai > 0 thi check xem co hop le hay khong
      if (shop_discounts.length > 0) {
        // gia su chi co mot discount
        // get amount discount
        const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer,
        });

        // tong cong discount giam gia
        checkout_order.totalDiscount += discount;

        // neu tien giam gia lon hon 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }

      // tong thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }

    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
    };
  }

  // order
  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {},
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutService.checkoutReview({
        cartId,
        userId,
        shop_order_ids,
      });

    // check lai xem co vuot ton kho hay khong
    // get new array products
    const products = shop_order_ids_new.flatMap((item) => item.item_products);
    console.log(`[1]:`.products);
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i];
      const product = await checkProductByServer([{ productId, quantity }]);
      if (!product) throw new BadRequestError("order wrong!!!");
    }
  }
}

module.exports = CheckoutService;
