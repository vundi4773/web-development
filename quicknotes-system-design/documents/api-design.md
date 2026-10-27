# QuickNotes API Design

This document describes the **real** QuickNotes REST API that the backend team should build (not the JSONPlaceholder practice API used by the front-end demo).

## Conventions

- Base URL: `https://api.quicknotes.example/v1`
- Format: JSON (`Content-Type: application/json`), UTF-8
- Authentication: `Authorization: Bearer <JWT>` on every endpoint except register and login
- Resources are nouns in the plural (`/notes`, `/tags`); the HTTP method carries the action
- Timestamps are ISO 8601 in UTC
- A user can only see and change their own notes (otherwise `403`/`404`)

## Endpoints

| # | Method | Path | Description | Success status |
|---|--------|------|-------------|----------------|
| 1 | POST | `/users` | Register a new user | `201 Created` |
| 2 | POST | `/auth/login` | Exchange email + password for a token | `200 OK` |
| 3 | GET | `/notes` | List the current user's notes (paginated; filter with `?tag=`, `?limit=`, `?cursor=`) | `200 OK` |
| 4 | POST | `/notes` | Create a note | `201 Created` |
| 5 | GET | `/notes/{id}` | Get one note | `200 OK` |
| 6 | PUT | `/notes/{id}` | Replace a note (title, body, tags) | `200 OK` |
| 7 | PATCH | `/notes/{id}` | Partially update a note | `200 OK` |
| 8 | DELETE | `/notes/{id}` | Delete a note | `204 No Content` |
| 9 | GET | `/tags` | List the current user's tags | `200 OK` |
| 10 | PUT | `/notes/{id}/tags/{tagId}` | Attach a tag to a note (idempotent) | `204 No Content` |
| 11 | DELETE | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | `204 No Content` |

## Example: create a note

`POST /v1/notes`

Request:

```json
{
  "title": "Buy milk",
  "body": "2 litres, full cream",
  "tags": ["shopping", "home"]
}
```

Response: `201 Created`, with header `Location: /v1/notes/4512`

```json
{
  "id": 4512,
  "userId": 17,
  "title": "Buy milk",
  "body": "2 litres, full cream",
  "tags": ["shopping", "home"],
  "createdAt": "2026-10-27T09:14:03Z",
  "updatedAt": "2026-10-27T09:14:03Z"
}
```

## Example: list notes

`GET /v1/notes?limit=2&tag=shopping`

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 4512,
      "title": "Buy milk",
      "body": "2 litres, full cream",
      "tags": ["shopping", "home"],
      "createdAt": "2026-10-27T09:14:03Z",
      "updatedAt": "2026-10-27T09:14:03Z"
    },
    {
      "id": 4490,
      "title": "Gift ideas",
      "body": "",
      "tags": ["shopping"],
      "createdAt": "2026-10-25T18:02:41Z",
      "updatedAt": "2026-10-26T07:30:00Z"
    }
  ],
  "page": {
    "limit": 2,
    "nextCursor": "eyJpZCI6NDQ5MH0="
  }
}
```

Cursor pagination (not page numbers) keeps queries fast when a user has thousands of notes. When `nextCursor` is `null`, there are no more notes.

## Error status codes

| Code | Meaning | When it is returned |
|------|---------|---------------------|
| `400 Bad Request` | Invalid input | Missing title, title longer than 100 characters, malformed JSON |
| `401 Unauthorized` | Not authenticated | Missing, expired or invalid token; wrong login credentials |
| `403 Forbidden` | Authenticated but not allowed | Trying to modify another user's note |
| `404 Not Found` | Resource does not exist | Unknown note or tag id (also used instead of 403 to avoid revealing that another user's note exists) |
| `409 Conflict` | State conflict | Registering an email that already exists |
| `429 Too Many Requests` | Rate limit hit | Client exceeds its request quota; includes `Retry-After` header |
| `500 Internal Server Error` | Unexpected server fault | Unhandled exception; the client may retry |
| `503 Service Unavailable` | Temporarily down | Database failover or maintenance |

All errors use one consistent body. Example for `400`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be 100 characters or fewer.",
    "details": [
      { "field": "title", "issue": "max_length_exceeded", "max": 100 }
    ],
    "requestId": "req_8f2c1a9e"
  }
}
```
