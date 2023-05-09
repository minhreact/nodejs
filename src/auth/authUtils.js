"use strict";

const JWT = require("jsonwebtoken");
const { asyncHandler } = require("../helpers/asyncHandler");
const { AuthFailureError, NotFoundError } = require("../core/error.response");
const { findByUserId } = require("../services/keyToken.service");

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
  REFRESHTOKEN: "x-rtoken-id",
};

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // tao accessToken va refreshToken thong qua privateKeyf
    const accessToken = await JWT.sign(payload, publicKey, {
      // algorithm: "RS256",
      expiresIn: "2 days",
    });
    const refreshToken = await JWT.sign(payload, privateKey, {
      // algorithm: "RS256",
      expiresIn: "7 days",
    });

    //

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.log(`error verify ::`, err);
      } else {
        console.log(`decode verify ::`, decode);
      }
    });
    return { accessToken, refreshToken };
  } catch (error) {
    return error;
  }
};

// const authentication = asyncHandler(async (req, res, next) => {
//   // 1 - check userId missing?
//   // 2 - get accessToken
//   // 3 - verify accessToken
//   // 4 - check user in bds?
//   // 5 - check keyStore with this userId?
//   // 6 - ok all => return next()

//   // 1
//   const userId = req.headers[HEADER.CLIENT_ID];
//   if (!userId) throw new AuthFailureError("Invalid request");

//   // 2
//   const keyStore = await findByUserId(userId);
//   if (!keyStore) throw new NotFoundError("Not Found keyStore");

//   // 3

//   const accessToken = req.headers[HEADER.AUTHORIZATION];
//   if (!accessToken) throw new AuthFailureError("Invalid request");

//   try {
//     const decode = await JWT.verify(accessToken, keyStore.publicKey);
//     if (userId !== decode.userId) throw new AuthFailureError("Invalid userId");
//     req.keyStore = keyStore;
//     return next();
//   } catch (error) {
//     throw error;
//   }
// });

const authenticationV2 = asyncHandler(async (req, res, next) => {
  // 1 - check userId missing?
  // 2 - get accessToken
  // 3 - verify accessToken
  // 4 - check user in bds?
  // 5 - check keyStore with this userId?
  // 6 - ok all => return next()

  // 1
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError("Invalid request");

  // 2
  console.log("userId", userId);
  const keyStore = await findByUserId(userId);
  console.log("keyStore", keyStore);
  if (!keyStore) throw new NotFoundError("Not Found keyStore");

  // 3

  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = await JWT.verify(refreshToken, keyStore.privateKey);
      if (userId !== decodeUser.userId)
        throw new AuthFailureError("Invalid userId");
      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;
      return next();
    } catch (error) {
      throw error;
    }
  }

  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Invalid request");

  try {
    const decode = await JWT.verify(accessToken, keyStore.publicKey);
    if (userId !== decode.userId) throw new AuthFailureError("Invalid userId");
    req.keyStore = keyStore;
    return next();
  } catch (error) {
    throw error;
  }
});

const verifyJWT = async (token, keySecret) => {
  return await JWT.verify(token, keySecret);
};

module.exports = {
  createTokenPair,
  // authentication,
  verifyJWT,
  authenticationV2,
};
