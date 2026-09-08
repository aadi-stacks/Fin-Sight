"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFactBasedExplanation = void 0;
const generateFactBasedExplanation = async (verifiedFacts, userQuestion) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const defaultQuestion = userQuestion?.trim() || 'Summarize my financial month based on verified data.';
    if (!apiKey) {
        console.warn('GEMINI_API_KEY is not configured on Express backend server. Returning verified deterministic fallback.');
        return {
            explanation: `Based on your verified records, your total income was ₹${verifiedFacts.monthlyIncome.toLocaleString('en-IN')} against expenses of ₹${verifiedFacts.monthlyExpenses.toLocaleString('en-IN')}, yielding a savings rate of ${verifiedFacts.savingsRatePercentage}%. Your largest outflow category was ${verifiedFacts.largestCategory} at ₹${verifiedFacts.largestCategoryAmount.toLocaleString('en-IN')}. Spending shifted by ${verifiedFacts.momSpendingChangePercentage}% compared with last month.`,
            isFallback: true,
        };
    }
    const systemInstruction = `You are FinSight's AI Financial Explanation Assistant. Your sole job is to summarize verified financial facts provided by FinSight's deterministic engine.

CRITICAL RULES:
1. Base your explanation ONLY on the verified financial facts provided in the JSON payload below.
2. DO NOT calculate numbers, perform math, or invent transactions, balances, percentages, or dates not present in the facts payload.
3. Use objective, neutral financial terminology. Avoid preachy language or calling spending "bad".
4. Keep response concise (3-4 sentences max).`;
    const promptPayload = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `${systemInstruction}\n\nUSER QUESTION: "${defaultQuestion}"\n\nVERIFIED FINANCIAL FACTS PAYLOAD:\n${JSON.stringify(verifiedFacts, null, 2)}`,
                    },
                ],
            },
        ],
    };
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptPayload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errText = await response.text();
            console.error(`Gemini API HTTP Error (${response.status}):`, errText);
            throw new Error(`Gemini API returned status ${response.status}`);
        }
        const data = await response.json();
        const explanationText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!explanationText) {
            throw new Error('Malformed response received from Gemini API');
        }
        return { explanation: explanationText.trim(), isFallback: false };
    }
    catch (err) {
        console.error('Failed to query Gemini API on backend:', err.message);
        return {
            explanation: `Based on your verified application facts, your total inflow was ₹${verifiedFacts.monthlyIncome.toLocaleString('en-IN')} with outflows of ₹${verifiedFacts.monthlyExpenses.toLocaleString('en-IN')} (${verifiedFacts.savingsRatePercentage}% savings rate). Primary expense category: ${verifiedFacts.largestCategory} (₹${verifiedFacts.largestCategoryAmount.toLocaleString('en-IN')}).`,
            isFallback: true,
        };
    }
};
exports.generateFactBasedExplanation = generateFactBasedExplanation;
