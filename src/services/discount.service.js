"use strict";
const { BadRequestError } = require("../core/error.response");
const discount = require("../models/discount.model");
const {
  findAllDiscountCodesUnSelect,
  checkDiscountExist,
} = require("../models/repositories/discount.repo");
const { findAllProduct } = require("../models/repositories/product.repo");
const { convertToObjectIdMongodb } = require("../utils");

/*
    discount service
    1. generation discount code [shop | Admin]
    2. get discount amount [user]
    3. get all discount code [user | shop]
    4. verify discount code [user]
    5. delete discount code [shop | Admin]
    6. cancel discount code [user]
*/

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
      users_used,
    } = payload;

    // kiem tra
    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError("discount code has expired!");
    }

    if (new Date(start_date) > new Date(end_date)) {
      throw new BadRequestError("start date must be before end date!");
    }

    // create index for discount code
    const foundDiscount = await checkDiscountExist({
      model: discount,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("discount exists!");
    }

    const newDiscount = await discount.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_value: value,
      discount_code: code,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_shopId: shopId,
      discount_max_uses_per_user: max_uses_per_user,
      discount_applies_to: applies_to,
      discount_is_active: is_active,
      discount_product_ids: applies_to === "all" ? [] : product_ids,
    });
    return newDiscount;
  }
  static async updateDiscountCode(payload) {
    // update discount code
  }

  // get all discount codes available with product

  static async getAllDiscountCodesWithProduct({ code, shopId, limit, page }) {
    // create index for discount code
    const foundDiscount = await checkDiscountExist({
      model: discount,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new BadRequestError("discount not found!");
    }
    const { discount_product_ids, discount_applies_to } = foundDiscount;
    let products = [];
    if (discount_applies_to === "all") {
      // get all product
      products = await findAllProduct({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }

    if (discount_applies_to === "specific") {
      // get product by discount_product_ids
      products = await findAllProduct({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }
    return products;
  }

  // get all discount code of shop
  static async getAllDiscountCodesOfShop({ shopId, limit, page }) {
    const discounts = await findAllDiscountCodesUnSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      unSelect: ["__v", "discount_shopId"],
      model: discount,
    });

    return discounts;
  }

  /*
        apply discount code
        products = [
            {
                productId,
                shopId,
                quantity
                name,
                price,
            }
        ]  
  */

  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExist({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) {
      throw new BadRequestError("discount doesn't exist!");
    }
    const {
      discount_is_active,
      discount_max_uses,
      discount_min_order_value,
      discount_max_uses_per_user,
      discount_type,
      discount_value,
    } = foundDiscount;
    if (!discount_is_active) throw new BadRequestError("discount is expired!");
    if (discount_max_uses === 0) {
      throw new BadRequestError("discount has been used!");
    }
    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError("discount has expired!");
    }

    // check xem cos gia thi toi thieu khong
    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      // get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.price * product.quantity;
      }, 0);

      if (totalOrder < discount_min_order_value) {
        throw new BadRequestError(
          "discount min order value is " + discount_min_order_value
        );
      }
    }

    if (discount_max_uses_per_user > 0) {
      const userUserDiscount = discount_users_used.find(
        (user) => user === userId
      );
      if (userUserDiscount) {
        throw new BadRequestError("discount has been used!");
      }
    }

    // check discount nay la fixed_amount hay percentage
    const amount =
      discount_type === "fixed_amount"
        ? discount_value
        : (totalOrder * discount_value) / 100;

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    };
  }

  static async deleteDiscountCode({ codeId, shopId }) {
    const deleted = await discount.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }

  // cancel discount code

  static async cancelDiscountCode({ codeId, userId, shopId }) {
    const foundDiscount = await checkDiscountExist({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount) throw new BadRequestError("discount doesn't exist!");

    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });
    return result;
  }
}

module.exports = DiscountService;
