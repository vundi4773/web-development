const DRAFT_KEY = "day4-draft";
const THEME_KEY = "day4-theme";
const LIMIT = 200;
const WARNING_AT = 180;

const textarea = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeBtn = document.querySelector("#theme-toggle");

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Storage blocked or full: the page still works without saving.
  }
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Nothing to do.
  }
}

function updateCounts() {
  const text = textarea.value;
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  charCount.textContent = chars + " / " + LIMIT + " characters";
  wordCount.textContent = words + " words";

  charCount.classList.toggle("over", chars > LIMIT);
  charCount.classList.toggle("warning", chars > WARNING_AT && chars <= LIMIT);
}

function clearAll() {
  textarea.value = "";
  remove(DRAFT_KEY);
  updateCounts();
  textarea.focus();
}

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeBtn.textContent = isDark ? "Light mode" : "Dark mode";
}

textarea.addEventListener("input", function () {
  updateCounts();
  store(DRAFT_KEY, textarea.value);
});

textarea.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearAll();
  }
});

clearBtn.addEventListener("click", clearAll);

themeBtn.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  store(THEME_KEY, isDark ? "dark" : "light");
});

// On page load: restore the draft and theme, then update the counters.
const savedDraft = read(DRAFT_KEY);
if (savedDraft !== null) {
  textarea.value = savedDraft;
}
applyTheme(read(THEME_KEY) === "dark");
updateCounts();
