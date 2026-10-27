"use strict";

// ---------------------------------------------------------------------------
// QuickNotes API client (talks to the JSONPlaceholder practice API)
// ---------------------------------------------------------------------------

const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE_LENGTH = 100;

// DOM references
const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitBtn = document.getElementById("submit-btn");
const listEl = document.getElementById("notes-list");

// Application state
let notes = [];   // notes currently shown on the page
let busy = false; // true while any request is running
let nextKey = 1;  // unique key per note on this page (the server gives every new note id 101)

// ---------------------------------------------------------------------------
// Networking
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// Reusable request helper: calls fetch, checks response.ok, throws on errors.
// Network failures make fetch itself throw a TypeError, which callers catch.
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new HttpError(`Request failed with status ${response.status}`, response.status);
  }
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

function getNotes() {
  return request(`${API_URL}?_limit=10`);
}

function createNote(note) {
  return request(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(note),
  });
}

function deleteNote(id) {
  return request(`${API_URL}/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// UI helpers (all user/server text goes in through textContent only)
// ---------------------------------------------------------------------------

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type || "";
}

function setBusy(isBusy) {
  busy = isBusy;
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  listEl.querySelectorAll("button").forEach((btn) => { btn.disabled = isBusy; });
}

function friendlyError(error, action) {
  if (error instanceof HttpError) {
    return `Sorry, we could not ${action}. The server answered with status ${error.status}. Please try again.`;
  }
  return `Sorry, we could not ${action}. Please check your internet connection and try again.`;
}

function render() {
  listEl.textContent = "";

  // Empty state
  if (notes.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No notes to show. Click \"Load notes\" or create one above.";
    listEl.appendChild(li);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");

    const title = document.createElement("h3");
    title.className = "note-title";
    title.textContent = note.title;

    const body = document.createElement("p");
    body.className = "note-body";
    body.textContent = note.body || "(no body)";

    const meta = document.createElement("span");
    meta.className = "note-meta";
    meta.textContent = `id ${note.id}`;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "Delete";
    del.disabled = busy;
    del.addEventListener("click", () => handleDelete(note));

    li.append(title, body, meta, del);
    listEl.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// Task 1 - GET
async function handleLoad() {
  if (busy) return;
  setBusy(true);
  setStatus("Loading notes...", "loading");
  try {
    const { data } = await getNotes();
    notes = data.map((n) => ({
      key: nextKey++, id: n.id, title: n.title, body: n.body, local: false,
    }));
    render();
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(friendlyError(error, "load the notes"), "error");
  } finally {
    setBusy(false);
  }
}

// Task 2 - POST
async function handleSubmit(event) {
  event.preventDefault();
  if (busy) return;

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Validation: title required, max 100 characters; body optional.
  if (title === "") {
    setStatus("Please enter a title for your note.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > MAX_TITLE_LENGTH) {
    setStatus(`The title is too long (${title.length}/${MAX_TITLE_LENGTH} characters).`, "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Creating note...", "loading");
  try {
    const { status, data } = await createNote({ title, body, userId: 1 });
    notes.unshift({
      key: nextKey++, id: data.id, title: data.title, body: data.body, local: true,
    });
    render();
    setStatus(`Note created (status ${status}, id ${data.id}).`, "success");
    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(friendlyError(error, "create the note"), "error");
  } finally {
    setBusy(false);
  }
}

// Task 3 - DELETE
//
// JSONPlaceholder is a fake API: it accepts POST/DELETE requests and answers as
// if they worked, but it never stores anything. Two consequences:
//   1. Notes created here ("local" notes) all get id 101 and do not exist on the
//      server, so a DELETE for them may come back as 404.
//   2. Deleting a loaded note returns 200, but reloading brings it back.
// Approach: we still send the real DELETE request for every note, and only
// remove the note from the list when the server confirms (2xx). For a local
// note a 404 is treated as "already gone", because the server never had it.
// The list is tracked by a unique client-side `key`, not by `id`, because
// every created note shares the id 101.
async function handleDelete(note) {
  if (busy) return;
  setBusy(true);
  setStatus("Deleting note...", "loading");
  try {
    let message;
    try {
      const { status } = await deleteNote(note.id);
      message = `Note deleted (status ${status}, id ${note.id}).`;
    } catch (error) {
      if (note.local && error instanceof HttpError && error.status === 404) {
        message = "Note removed from the list (the practice server never stored it).";
      } else {
        throw error;
      }
    }
    notes = notes.filter((n) => n.key !== note.key);
    render();
    setStatus(message, "success");
  } catch (error) {
    console.error(error);
    setStatus(friendlyError(error, "delete the note"), "error");
  } finally {
    setBusy(false);
  }
}

// ---------------------------------------------------------------------------
// Start-up
// ---------------------------------------------------------------------------

loadBtn.addEventListener("click", handleLoad);
form.addEventListener("submit", handleSubmit);
render(); // shows the empty state before anything is loaded
