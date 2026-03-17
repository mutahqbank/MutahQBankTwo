async function testV1() {
  const apiKey = "AIzaSyCHSOW6fW27pOk8ldKFqbLwQVFWiTV5D0k";
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  console.log("Testing v1 endpoint with fetch...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

testV1();
