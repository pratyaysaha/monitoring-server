const genai = require("@google/genai");

const { geminiApiKey } = require("../configs");

const client = new genai.GoogleGenAI({
    apiKey: geminiApiKey
});

exports.getGeminiResponse = async (prompt) => {
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const formattedResult = {
            success: true,
            content: response.candidates[0].content.parts[0].text,
            metadata: {
                model: response.modelVersion,
                finishReason: response.candidates[0].finishReason,
                usage: {
                    promptTokens: response.usageMetadata.promptTokenCount,
                    completionTokens: response.usageMetadata.candidatesTokenCount,
                    totalTokens: response.usageMetadata.totalTokenCount
                }
            }
        };

        console.log("Mapped Response:", JSON.stringify(formattedResult, null, 2));
        return formattedResult;
    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        return {
            success: false,
            error: error.message
        };
    }
};