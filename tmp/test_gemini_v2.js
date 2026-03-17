const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'tmp_gemini_log.txt');
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logPath, msg + '\n');
}

if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

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
  log("Checking API Key: " + (apiKey ? "Present" : "Missing"));
  
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    log("Attempting to generate content...");
    const result = await model.generateContent("Hello, respond with 'AI OK'");
    log("Gemini Response: " + result.response.text());
  } catch (error) {
    log("Gemini Error: " + error.message);
    if (error.stack) log("Stack: " + error.stack);
  }
}

testGemini();
