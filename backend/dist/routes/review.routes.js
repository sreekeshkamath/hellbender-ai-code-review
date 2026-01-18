"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReviewController_1 = require("../controllers/ReviewController");
const router = (0, express_1.Router)();
router.get('/models', ReviewController_1.ReviewController.getModels);
router.post('/analyze', ReviewController_1.ReviewController.analyze);
exports.default = router;
