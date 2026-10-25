# Library API Design

A REST API for a library's `books` resource. All requests and responses use JSON.

## Endpoints

### List books
- **Method and path:** `GET /books`
- **Description:** Returns all books in the library.
- **Request body:** none
- **Success status:** `200 OK`

### Get one book
- **Method and path:** `GET /books/{id}`
- **Description:** Returns the book with the given id.
- **Request body:** none
- **Success status:** `200 OK`

### Create a book
- **Method and path:** `POST /books`
- **Description:** Adds a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "year": 1958
  }
  ```
- **Success status:** `201 Created`

### Update a book
- **Method and path:** `PUT /books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "year": 1959
  }
  ```
- **Success status:** `200 OK`

### Delete a book
- **Method and path:** `DELETE /books/{id}`
- **Description:** Removes the book with the given id.
- **Request body:** none
- **Success status:** `204 No Content`

### List books by an author
- **Method and path:** `GET /books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the author given in the `author` query parameter.
- **Request body:** none
- **Success status:** `200 OK`

## Error codes

### 400 Bad Request
- The request is invalid and the server cannot process it.
- **Example:** `POST /books` with a body that has no `title`, or with `year` set to `"abc"` instead of a number.

### 404 Not Found
- The requested resource does not exist.
- **Example:** `GET /books/9999` when no book has the id 9999, or `DELETE /books/9999` for a missing book.
