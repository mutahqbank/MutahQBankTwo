import 'dotenv/config';
import { suggestCategoryWithOpenAI } from '../lib/openai';

async function test() {
  console.log("🚀 Starting 2-Step AI Classification Test...");
  
  const mockLectures = [
    { id: 101, name: "Pediatric Asthma", description: "Wheezing, reactive airway disease, inhaled corticosteroids, albuterol." },
    { id: 102, name: "Neonatal Sepsis", description: "Fever in newborn, GBS, ampicillin, gentamicin, lethargy." },
    { id: 103, name: "Nephrotic Syndrome", description: "Proteinuria, edema, hypoalbuminemia, minimal change disease." },
    { id: 104, name: "General Pediatrics", description: "Initial assessment, growth charts, routine checkups." },
    { id: 105, name: "Pediatric Meningitis", description: "Fever, neck stiffness, CSF analysis, lumbar puncture, bacterial vs viral." }
  ];

  const mockQuestion = "A 2-year-old child presents with a 3-day history of wheezing and cough. He has a history of atopy. On examination, there is bilateral expiratory wheeze. What is the most appropriate initial treatment?";
  const mockExplanation = "<h1>Bilateral Wheeze</h1><p>The clinical presentation of wheezing in a child with atopy is highly suggestive of <b>Pediatric Asthma</b>. Emergency management includes albuterol nebulization.</p>";
  const mockOptions = ["Antibiotics", "Inhaled Albuterol", "Steroids", "Oxygen"];

  try {
    const result = await suggestCategoryWithOpenAI(
      mockQuestion,
      mockExplanation,
      mockOptions,
      mockLectures,
      "Pediatrics"
    );

    console.log("\n--- TEST RESULT ---");
    console.log(JSON.stringify(result, null, 2));

    if (result && result.lectureId === 101) {
      console.log("\n✅ SUCCESS: Correctly mapped to Pediatric Asthma (ID 101)");
    } else {
      console.log("\n❌ FAILED: Unexpected mapping logic.");
    }
  } catch (error) {
    console.error("\n❌ ERROR during test execution:", error);
  }
}

test();
