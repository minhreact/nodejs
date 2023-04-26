"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const KeyTokenService = require("./keyToken.service");
const crypto = require("node:crypto");
const { createTokenPair } = require("../auth/authUtils");
const { getIntoData } = require("../utils");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  static signUp = async ({ name, email, password }) => {
    try {
      // step 1: check email exist
      // lean() giam tai size object
      const holdelShop = await shopModel.findOne({ email }).lean();
      if (holdelShop) {
        return {
          code: "xxx",
          message: "Shop already exist",
        };
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newShop = await shopModel.create({
        name,
        email,
        password: passwordHash,
        roles: [RoleShop.SHOP],
      });
      if (newShop) {
        // created privateKey, publicKey
        // privateKey: day cho nguoi dung, dung de sai token
        // publicKey: day cho server, dung de kiem tra token

        // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        //   modulusLength: 4096,
        //   publicKeyEncoding: {
        //     type: "pkcs1",
        //     format: "pem",
        //   },
        //   privateKeyEncoding: {
        //     type: "pkcs1",
        //     format: "pem",
        //   },
        // });

        //getRandomValues(new Uint8Array(64))
        const privateKey = crypto.randomBytes(64).toString("hex");
        const publicKey = crypto.randomBytes(64).toString("hex");

        console.log({ privateKey, publicKey }); // save collection keyStore

        const keyStore = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
          privateKey,
        });

        if (!keyStore) {
          return {
            code: "xxx",
            message: "keyStore error",
          };
        }

        // const publicKeyObject = crypto.createPublicKey(publicKeyString);
        // console.log(`publicKeyObject::`, publicKeyObject);

        // tao token pair
        const tokens = await createTokenPair(
          { userId: newShop._id, email },
          publicKey,
          privateKey
        );
        console.log(`created token success::`, tokens);

        return {
          code: 201,
          metadata: {
            shop: getIntoData({
              fields: ["_id", "name", "email"],
              object: newShop,
            }),
            tokens,
          },
        };
      }
      return {
        code: 200,
        metadata: null,
      };
    } catch (error) {
      return {
        code: "xxx",
        message: error.message,
        status: "error",
      };
    }
  };
}

module.exports = AccessService;
