const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = "AIzaSyCHSOW6fW27pOk8ldKFqbLwQVFWiTV5D0k";
  console.log("Testing hardcoded API Key...");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // Try a few models
  const models = ["gemini-1.5-flash", "gemini-pro"];

  for (const m of models) {
    console.log(`Testing model: ${m}`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Respond with 'SUCCESS'");
      console.log(`${m} Response:`, result.response.text());
    } catch (error) {
      console.error(`${m} Error:`, error.message);
    }
  }
}

testGemini();
