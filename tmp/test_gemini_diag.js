const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Checking API Key:", apiKey ? "Present (Starts with " + apiKey.substring(0, 5) + "...)" : "Missing");
  
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Hello, respond with 'AI OK'");
    console.log("Gemini Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error.message);
  }
}

testGemini();
