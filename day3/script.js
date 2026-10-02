// Day 3 - Notes manager

let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const VALID_CATEGORIES = ["personal", "work", "study"];

// 1. Notes whose text contains `word`, ignoring case.
function searchNotes(word) {
  const target = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(target));
}

// 2. Note object with the most characters, or null if there are none.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// 3. Count of notes per category.
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category] === undefined) {
      counts[note.category] = 0;
    }
    counts[note.category] += 1;
  }
  return counts;
}

// 4. A sentence such as "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";

  const parts = VALID_CATEGORIES
    .filter((category) => counts[category] > 0)
    .map((category) => `${counts[category]} ${category}`);

  if (parts.length === 0) {
    return `${total} ${word}.`;
  }
  return `${total} ${word}: ${parts.join(", ")}.`;
}

// 5. True if a note with the same text exists (ignoring case and extra spaces).
function normalise(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function isDuplicate(text) {
  const target = normalise(text);
  return notes.some((note) => normalise(note.text) === target);
}

// 6. Add a note if valid. Returns true when added, false otherwise.
function addNote(text, category) {
  if (typeof text !== "string") {
    console.log("Not added: text must be a string.");
    return false;
  }
  const cleaned = text.trim();
  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log(`Not added: text must be 1-200 characters (got ${cleaned.length}).`);
    return false;
  }
  if (isDuplicate(cleaned)) {
    console.log(`Not added: "${cleaned}" already exists.`);
    return false;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    console.log(`Not added: "${category}" is not a valid category (use ${VALID_CATEGORIES.join(", ")}).`);
    return false;
  }

  const nextId = notes.reduce((max, note) => Math.max(max, note.id), 0) + 1;
  notes.push({ id: nextId, text: cleaned, category });
  return true;
}

// --- searchNotes ---
console.log(searchNotes("THE").map((n) => n.text));
// ["Finish the Day 3 assignment", "Email the project report to Grace"]
console.log(searchNotes("zebra"));
// []

// --- longestNote ---
console.log(longestNote());
// { id: 3, text: 'Email the project report to Grace', category: 'work' }
const backup = notes;
notes = [];
console.log(longestNote());
// null
notes = backup;

// --- countByCategory ---
console.log(countByCategory());
// { personal: 2, study: 2, work: 1 }
notes = [];
console.log(countByCategory());
// {}
notes = backup;

// --- getSummary ---
console.log(getSummary());
// 5 notes: 2 personal, 1 work, 2 study.
notes = [{ id: 1, text: "Only one", category: "work" }];
console.log(getSummary());
// 1 note: 1 work.
notes = [];
console.log(getSummary());
// 0 notes.
notes = backup;

// --- isDuplicate ---
console.log(isDuplicate("  call   MUM  "));
// true
console.log(isDuplicate("Call dad"));
// false

// --- addNote ---
console.log(addNote("Pay electricity bill", "personal"));
// true
console.log(notes.length);
// 6
console.log(addNote("  buy MILK and   bread ", "personal"));
// Not added: "buy MILK and   bread" already exists.
// false
console.log(addNote("   ", "work"));
// Not added: text must be 1-200 characters (got 0).
// false
console.log(addNote("x".repeat(201), "work"));
// Not added: text must be 1-200 characters (got 201).
// false
console.log(addNote("Go to the gym", "hobby"));
// Not added: "hobby" is not a valid category (use personal, work, study).
// false
console.log(getSummary());
// 6 notes: 3 personal, 1 work, 2 study.
