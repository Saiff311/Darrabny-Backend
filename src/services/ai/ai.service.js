import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeApplicationWithAI = async (studentData, internshipData) => {
  try {
    // 1. تعريف البرومبت المطور
    const prompt = `
      Analyze the match between this candidate and the internship.

      Candidate Data:
      - Skills: ${studentData.skills.join(", ")}
      - Bio: ${studentData.bio}
      - Projects: ${JSON.stringify(studentData.projects)}

      Internship Requirements:
      - Required Skills: ${internshipData.technicalSkills.join(", ")}
      - Description: ${internshipData.internshipDescription}

      Return ONLY a JSON object with this exact structure:
      {
        "score": number,
        "label": "excellent" | "very good" | "good" | "acceptable" | "bad",
        "keyStrengths": ["bullet point 1", "bullet point 2"],
        "areasForReview": ["bullet point 1"],
        "summary": "one short sentence"
      }
    `;

    // 2. إرسال الطلب للموديل الجديد
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.text;

    // 3. تنظيف وتحويل النص لـ JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    return result;
  } catch (error) {
    console.error("Detailed AI Service Error:", error);
    // حالة الفشل: بنرجع هيكل بيانات فاضي عشان الـ Backend ميعطلش
    return {
      score: 0,
      label: "pending",
      keyStrengths: [],
      areasForReview: [],
      summary: "Analysis failed.",
    };
  }
};

export const handleChatbotMessage = async (userMessage, chatHistory = []) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction:
          "You are a helpful career advisor and assistant for an internship platform. Keep answers professional, concise, and helpful.",
        history: Array.isArray(chatHistory) ? chatHistory : [],
      },
    });

    const response = await chat.sendMessage({
      message: userMessage,
    });

    return response.text;
  } catch (error) {
    console.error("Detailed AI Chatbot Error:", error);
    throw error;
  }
};
