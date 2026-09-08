"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiService_1 = require("../services/aiService");
const router = (0, express_1.Router)();
router.post('/explain', async (req, res) => {
    try {
        const { facts, question } = req.body;
        if (!facts || typeof facts !== 'object') {
            return res.status(400).json({
                error: 'Missing required verified financial facts payload in request body.',
            });
        }
        const result = await (0, aiService_1.generateFactBasedExplanation)(facts, question);
        return res.json({
            explanation: result.explanation,
            isFallback: result.isFallback,
            verifiedFacts: facts,
        });
    }
    catch (err) {
        console.error('Error in /api/insights/explain router:', err);
        return res.status(500).json({
            error: 'Failed to generate AI explanation.',
            details: err.message,
        });
    }
});
exports.default = router;
