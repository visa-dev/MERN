const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cartController");

router.use(optionalAuth);

router.get("/", getCart);
router.post("/add", addItem);
router.post("/update", updateItem);
router.post("/remove", removeItem);

module.exports = router;
