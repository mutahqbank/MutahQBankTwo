async function listAll() {
  const apiKey = "AIzaSyCHSOW6fW27pOk8ldKFqbLwQVFWiTV5D0k";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log("Listing models via REST...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

listAll();
