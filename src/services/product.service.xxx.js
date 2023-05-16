"use strict";

const {
  product,
  clothing,
  electronic,
  furniture,
} = require("../models/product.model");
const { BadRequestError } = require("../core/error.response");
// define factory class to create product

class ProductFactory {
  //
  static productRegistry = {};

  //

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef;
  }
  //
  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError(`Invalid product type ${type}`);
    }
    return new productClass(payload).createProduct();
    // switch (type) {
    //   case "Clothing":
    //     return new Clothing(payload).createProduct();
    //   case "Electronics":
    //     return new Electronics(payload).createProduct();
    //   case "Furniture":
    //     return new Furniture(payload);
    //   default:
    //     throw new BadRequestError(`Invalid product type ${type}`);
    // }
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
  async createProduct(product_id) {
    return await product.create({ ...this, _id: product_id });
  }
}

// define sub-class for different product types clothing

class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newClothing) {
      throw new BadRequestError("Can not create new clothing");
    }
    const newProduct = await super.createProduct(newClothing._id);
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

// define sub-class for different product types Electronics

class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newElectronic) {
      throw new BadRequestError("Can not create new Electronics");
    }

    const newProduct = await super.createProduct(newElectronic._id);
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

// define sub-class for different product types furniture

class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newFurniture) {
      throw new BadRequestError("Can not create new furniture");
    }
    const newProduct = await super.createProduct(newFurniture._id);
    if (!newProduct) {
      throw new BadRequestError("Can not create new product");
    }
    return newProduct;
  }
}

// register product type
ProductFactory.registerProductType("Clothing", Clothing);
ProductFactory.registerProductType("Electronics", Electronics);
ProductFactory.registerProductType("Furniture", Furniture);

module.exports = ProductFactory;
