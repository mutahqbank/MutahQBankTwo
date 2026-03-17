const fs = require('fs');
const path = require('path');

async function listAll() {
  const apiKey = "AIzaSyCHSOW6fW27pOk8ldKFqbLwQVFWiTV5D0k";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log("Listing models via REST...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    const outputPath = path.join(process.cwd(), 'tmp_full_models.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Wrote full model list to tmp_full_models.json");
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

listAll();
