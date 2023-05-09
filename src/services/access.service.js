"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const KeyTokenService = require("./keyToken.service");
const crypto = require("node:crypto");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getIntoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  // 1 - check this token used?

  static handlerRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    const { userId, email } = user;

    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened! please login again");
    }

    if (keyStore.refreshToken !== refreshToken)
      throw new AuthFailureError("Shop not registered!!");

    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered!!");
    }

    // create new token
    const tokens = await createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey
    );

    console.log("tokens", tokens);

    // update token
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // da duoc su dung de lay token moi
      },
    });
    return {
      user,
      tokens,
    };

    // // kiem tra xem token nay da duoc su dung chua?
    // const foundToken = await KeyTokenService.findByRefreshTokenUsed(
    //   refreshToken
    // );

    // // neu co
    // if (foundToken) {
    //   // throw new BadRequestError("Refresh token not found!");
    //   // decode xem la ai
    //   const { userId } = await verifyJWT(refreshToken, foundToken.privateKey);
    //   // xoa
    //   await KeyTokenService.deleteKeyById(userId);
    //   throw new ForbiddenError("Something wrong happened! please login again");
    // }
    // // khong co
    // const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);

    // if (!holderToken) {
    //   throw new AuthFailureError("Shop not registered!!");
    // }

    // // verify token
    // // const { userId, email } = await verifyJWT(
    // //   refreshToken,
    // //   holderToken.privateKey
    // // );

    // // check userId
  };

  static handlerRefreshToken = async (refreshToken) => {
    // kiem tra xem token nay da duoc su dung chua?
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );

    // neu co
    if (foundToken) {
      // throw new BadRequestError("Refresh token not found!");
      // decode xem la ai
      const { userId } = await verifyJWT(refreshToken, foundToken.privateKey);
      // xoa
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened! please login again");
    }
    // khong co
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);

    if (!holderToken) {
      throw new AuthFailureError("Shop not registered!!");
    }

    // verify token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    // check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered!!");
    }

    // create new token
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    console.log("tokens", tokens);

    // update token
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // da duoc su dung de lay token moi
      },
    });
    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };

  // 1 - check email in dbs
  // 2 - match password
  // 3 - create AT vs RT and save to dbs
  // 4 - generate tokens
  // 5 - get data return login
  static login = async ({ email, password, refreshToken = null }) => {
    // 1.
    const foundShop = await findByEmail({ email });

    if (!foundShop) {
      throw new BadRequestError("Shop not registered!");
    }

    // 2.
    const match = await bcrypt.compare(password, foundShop.password);

    if (!match) {
      throw new AuthFailureError(" Authentication error");
    }

    // 3.
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    // 4.

    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });
    return {
      shop: getIntoData({
        fields: ["_id", "name", "email"],
        object: foundShop,
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // try {
    // step 1: check email exist
    // lean() giam tai size object
    const holdelShop = await shopModel.findOne({ email }).lean();

    if (holdelShop) {
      throw new BadRequestError("Error: shop already registered!");
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
        // throw new BadRequestError("Error: shop already registered!");
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
    // } catch (error) {
    //   return {
    //     code: "xxx",
    //     message: error.message,
    //     status: "error",
    //   };
    // }
  };
}

module.exports = AccessService;
