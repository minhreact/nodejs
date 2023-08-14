"use strict";

const {
  product,
  clothing,
  electronic,
  furniture,
} = require("../models/product.model");
const { BadRequestError } = require("../core/error.response");
const {
  findAllDraftsForShop,
  publishProductByShop,
  unPublishProductByShop,
  findAllPublishForShop,
  searchProductByUser,
  findProduct,
  findAllProduct,
  updateProductById,
} = require("../models/repositories/product.repo");
const { removeUndefinedObject, updateNestObjectParser } = require("../utils");
const { insertInventory } = require("../models/repositories/inventory.repo");
// define factory class to create product

class ProductFactory {
  //
  static productRegistry = {};

  //

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef;
  }
  // create product
  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError(`Invalid product type ${type}`);
    }
    return new productClass(payload).createProduct();
  }
  // update product
  static async updateProduct(type, productId, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError(`Invalid product type ${type}`);
    }
    return new productClass(payload).updateProduct(productId);
  }

  // put //

  static async publishProductByShop({ product_id, product_shop }) {
    return await publishProductByShop({ product_shop, product_id });
  }

  static async unPublishProductByShop({ product_id, product_shop }) {
    return await unPublishProductByShop({ product_shop, product_id });
  }

  // query product
  static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isDraft: true };
    return await findAllDraftsForShop({ query, limit, skip });
  }

  static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isPublished: true };
    return await findAllPublishForShop({ query, limit, skip });
  }

  // get product search
  static async searchProduct({ keySearch }) {
    return await searchProductByUser({ keySearch });
  }

  // get all product
  static async findAllProduct({
    limit = 50,
    sort = "ctime",
    page = 1,
    filter = { isPublished: true },
  }) {
    return await findAllProduct({
      limit,
      sort,
      page,
      filter,
      select: [
        "product_name",
        "product_price",
        "product_thumb",
        "product_shop",
      ],
    });
  }

  //
  static async findProduct({ product_id }) {
    return await findProduct({
      product_id,
      unSelect: ["__v", "product_variations"],
    });
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
    const newProduct = await product.create({ ...this, _id: product_id });
    if (newProduct) {
      // add product_stock in inventory collection
      await insertInventory({
        productId: newProduct._id,
        shopId: this.product_shop,
        stock: this.product_quantity,
      });
    }
    return newProduct;
  }

  // update product

  async updateProduct(productId, payload) {
    return await updateProductById({ productId, payload, model: product });
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

  async updateProduct(productId) {
    // 1.remove attribute has null and undefined
    const objectParam = this;
    // 2. check xem update o cho nao?
    if (objectParam.product_attributes) {
      // update child
      await updateProductById({
        productId,
        payload: objectParam,
        model: clothing,
      });
    }

    const updateProduct = await super.updateProduct(productId, objectParam);
    return updateProduct;
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

  async updateProduct(productId) {
    // 1.remove attribute has null and undefined
    // const updateNest = updateNestObjectParser(this);
    const objectParam = removeUndefinedObject(this);
    // 2. check xem update o cho nao?
    if (objectParam.product_attributes) {
      // update child
      await updateProductById({
        productId,
        payload: updateNestObjectParser(objectParam.product_attributes),
        model: electronic,
      });
    }

    const updateProduct = await super.updateProduct(
      productId,
      updateNestObjectParser(objectParam)
    );
    return updateProduct;
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
