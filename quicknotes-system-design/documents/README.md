# QuickNotes

QuickNotes is a notes application that is moving from a browser-only app to an online service for 1 million users. This repository contains two things:

1. **An API client** (HTML, CSS and vanilla JavaScript) that proves the front end can talk to a REST API. It uses the [JSONPlaceholder](https://jsonplaceholder.typicode.com) practice API to load (GET), create (POST) and delete (DELETE) notes, with loading, success, error and empty states and input validation.
2. **Three design documents** that the backend team can build from: the REST API, the database model and the system architecture.

## How to run the API client

No installation or build step is needed.

1. Clone the repository: `git clone <your-repo-url>` and open the folder.
2. Open `index.html` in a browser (double-click it), **or** serve it locally:
   ```bash
   python -m http.server 8000
   ```
   then visit <http://localhost:8000>.
3. Click **Load notes** to fetch 10 notes, fill in the form to create a note, and use **Delete** on any note.

You need an internet connection because the client calls `https://jsonplaceholder.typicode.com/posts`.

> JSONPlaceholder does not really store data. Created and deleted notes only change the page, and **Load notes** shows the original 10 again. See the comment above `handleDelete` in `api.js`.

## Project files

```
index.html          page structure
style.css           styling, including success and error messages
api.js              fetch client: GET, POST, DELETE, validation, UI states
docs/
  api-design.md     REST API for the real QuickNotes backend
  data-model.md     tables, relationships, SQL, index, SQL vs NoSQL
  architecture.md   requirements, estimates, diagram, flows, trade-offs
```

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- **fetch does not throw on HTTP errors.** A 404 or 500 still resolves normally, so I have to check `response.ok` myself and throw. Wrapping that in one reusable `request()` function kept the GET, POST and DELETE code short.
- **Every request needs all four states** (loading, success, error, empty), and `try / catch / finally` makes this reliable: `finally` always re-enables the buttons, even when a request fails.
- **Never trust or inject user text as HTML.** Using `textContent` instead of `innerHTML` prevents XSS, and validation (required title, 100-character limit) must happen before sending anything.
- **Fake APIs behave differently from real ones.** JSONPlaceholder returns id 101 for every new note and never saves it, so I had to track notes by a client-side key and document how delete works.
- **Design starts with numbers.** Estimating reads and writes per second and storage per year showed the system is read-heavy, which justified a cache and a read replica, and showed a single SQL primary is enough for now.
