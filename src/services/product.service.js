"use strict";

const {
  product,
  clothing,
  electronic,
  furniture,
} = require("../models/product.model");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { create } = require("lodash");
// define factory class to create product

class ProductFactory {
  static async createProduct(type, payload) {
    switch (type) {
      case "Clothing":
        return new Clothing(payload).createProduct();
      case "Electronics":
        return new Electronics(payload);
      case "Furniture":
        return new Furniture(payload);
      default:
        throw new BadRequestError(`Invalid product type ${type}`);
    }
  }
}

// define base product class

class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_quantity,
    product_type,
    product_shop,
    product_attributes,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_description = product_description;
    this.product_price = product_price;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_shop = product_shop;
    this.product_attributes = product_attributes;
  }
  // create new product
  async createProduct() {
    return await product.create(this);
  }
}

// define sub-class for different product types clothing

class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create(this.product_attributes);
    if (!newClothing) {
      throw new BadRequestError("Can not create new clothing");
    }
    const newProduct = await super.createProduct();
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

// define sub-class for different product types Electronics

class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create(this.product_attributes);
    if (!newElectronic) {
      throw new BadRequestError("Can not create new clothing");
    }
    const newProduct = await super.createProduct();
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

// define sub-class for different product types furniture

class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create(this.product_attributes);
    if (!newFurniture) {
      throw new BadRequestError("Can not create new furniture");
    }
    const newProduct = await super.createProduct();
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

module.exports = ProductFactory;
