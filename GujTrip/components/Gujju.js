import axios from "axios";

const API_KEY = "API_KEY";
const API_URL = "API_URL";

export const getChatbotReply = async (userMessage) => {
  try {
    // ✅ Handle greetings locally without calling the API
    const greetings = ["hi", "hello", "hey", "kem cho", "good morning", "good evening"];
    if (greetings.includes(userMessage.toLowerCase())) {
      return "Hello! 👋 I'm your Gujarat Travel Guide. Ask me about tourist places!";
    }

    // ✅ Call OpenRouter API only for Gujarat-related questions
    const response = await axios.post(
      API_URL,
      {
        model: "mistralai/mixtral-8x7b-instruct", // Free & fast model
        messages: [
          {
            role: "system",
            content:
              "You are an AI travel assistant for Gujarat. ONLY answer questions about Gujarat tourist places, attractions, culture, food, and routes. If the user asks about anything else, reply: '❌ Sorry, I can only help with Gujarat tourism-related queries.'",
          },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "HTTP-Referer": "https://your-app.com", // Optional, but recommended
          "X-Title": "Gujarat Travel AI Chatbot",
        },
      }
    );

    // ✅ Return AI reply
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching chatbot reply:", error.response?.data || error.message);
    return "⚠️ Sorry, I'm having trouble answering right now.";
  }
};
