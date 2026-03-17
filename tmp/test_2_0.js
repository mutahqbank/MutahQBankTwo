const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testFixed() {
  const apiKey = "AIzaSyCHSOW6fW27pOk8ldKFqbLwQVFWiTV5D0k";
  console.log("Testing gemini-2.0-flash with SDK...");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("AI test");
    console.log("SUCCESS:", result.response.text().substring(0, 30));
  } catch (e) {
    console.error("FAILED:", e.message);
  }
}

testFixed();
