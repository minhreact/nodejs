"use strict";

const express = require("express");

const cartController = require("../../controllers/cart.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authenticationV2 } = require("../../auth/authUtils");
const router = express.Router();

// authentication
router.use(authenticationV2);
//

router.post("", asyncHandler(cartController.addToCart));
router.delete("", asyncHandler(cartController.deleteToCart));
router.post("/update", asyncHandler(cartController.updateToCart));
router.get("", asyncHandler(cartController.listToCart));

module.exports = router;
