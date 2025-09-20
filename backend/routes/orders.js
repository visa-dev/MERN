const express = require("express");
const router = express.Router();
const { optionalAuth, requireAuth } = require("../middleware/auth");
const { checkout, listOrders } = require("../controllers/orderController");

router.use(optionalAuth);

router.post("/checkout", checkout);
router.get("/", requireAuth, listOrders);

module.exports = router;
