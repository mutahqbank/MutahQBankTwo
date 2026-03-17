const subjects = [
  { id: 1, name: "⬇️⬇️ Obstetrics ⬇️⬇️" },
  { id: 2, name: "Hyperemesis gravidarum" },
  { id: 3, name: "--- Section 2 ---" },
  { id: 4, name: "Unclassified Pool" },
  { id: 5, name: "Brain Anatomy" }
];

const filteredSubjects = subjects
  .filter((s) => {
    const name = s.subject || s.name || "";
    // Ignore if contains emoji arrows or multiple dashes
    if (/[⬇️⬆️➡️⬅️]/.test(name)) return false;
    if (name.includes("---")) return false;
    if (name.toLowerCase().includes("unclassified pool")) return false;
    return true;
  });

console.log("Filtered Subjects:", JSON.stringify(filteredSubjects, null, 2));
