
// Mock of the logic added to lib/openai.ts
const peekExplanationTitle = (html: string) => {
  if (!html) return "";
  // Try to find text within the first header or bold tag
  const headerMatch = /<(h[1-6]|b|strong)>(.*?)<\/\1>/i.exec(html);
  if (headerMatch && headerMatch[2]) {
    return headerMatch[2].replace(/<[^>]*>?/gm, '').trim();
  }
  // Fallback: Just take the first 80 characters of cleaned text
  return html.replace(/<[^>]*>?/gm, '').trim().substring(0, 80) + "...";
};

const testCases = [
  {
    name: "Header h1",
    html: "<h1>Management of Asthma</h1><p>Asthma is a chronic inflammatory disease...</p>",
    expected: "Management of Asthma"
  },
  {
    name: "Bold tag",
    html: "<p><b>Diagnosis: Meningitis</b>. A 5-year-old child presents with fever...</p>",
    expected: "Diagnosis: Meningitis"
  },
  {
    name: "Strong tag",
    html: "<div><strong>Treatment of URTI</strong></div><p>Rest and hydration are key.</p>",
    expected: "Treatment of URTI"
  },
  {
    name: "No tags (fallback)",
    html: "This is a plain text explanation about Cardiology and heart murmurs in children.",
    expected: "This is a plain text explanation about Cardiology and heart murmurs in childre..."
  },
  {
    name: "Empty",
    html: "",
    expected: ""
  }
];

console.log("--- Testing peekExplanationTitle ---");
testCases.forEach(tc => {
  const result = peekExplanationTitle(tc.html);
  const pass = tc.html === "" ? result === "" : (result.includes(tc.expected) || tc.expected.includes(result));
  console.log(`[${pass ? "PASS" : "FAIL"}] ${tc.name}`);
  console.log(`   Input:    ${tc.html.substring(0, 50)}...`);
  console.log(`   Result:   ${result}`);
});
