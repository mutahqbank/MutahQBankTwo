const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

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

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("Missing API key");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // List models is not directly on genAI in some versions, 
    // but we can try to find the supported models.
    // Actually, in the latest SDKs, there isn't a simple listModels on the genAI object.
    // We might need to use the REST API directly or just guess better.
    // Common names: gemini-1.5-flash, gemini-1.5-pro, gemini-pro
    
    console.log("Testing common model names...");
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];
    
    for (const m of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("test");
        if (result.response) {
          console.log(`Model ${m} is WORKING`);
        }
      } catch (e) {
        console.log(`Model ${m} FAILED: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("List effort failed:", error.message);
  }
}

listModels();
