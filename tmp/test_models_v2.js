const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'tmp_gemini_models_log.txt');
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logPath, msg + '\n', 'utf8');
}

if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

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

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  log("API Key found: " + !!apiKey);
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];

  for (const m of models) {
    log(`Testing ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("AI test");
      log(`Result for ${m}: ` + result.response.text().substring(0, 20) + "...");
    } catch (e) {
      log(`Error for ${m}: ` + e.message);
    }
  }
}

testModels();
