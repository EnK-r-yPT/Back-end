const express = require("express");
const router = express.Router();

const contactUsController = require("../controllers/contactUs/contactUsController");
router.post("/", contactUsController);

module.exports = router;
