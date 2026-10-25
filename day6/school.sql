-- Day 6: school database (SQLite)
PRAGMA foreign_keys = ON;

-- ---------- Tables ----------

CREATE TABLE students (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  title   TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0)
);

CREATE TABLE enrolments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id  INTEGER NOT NULL,
  grade      TEXT,  -- stays NULL until the student has been graded
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id)  REFERENCES courses(id),
  UNIQUE (student_id, course_id)  -- a student cannot enrol on the same course twice
);

-- ---------- Sample data ----------

INSERT INTO students (name, email) VALUES
  ('Amina Wanjiru', 'amina@example.com'),
  ('Brian Otieno',  'brian@example.com'),
  ('Cynthia Mwende','cynthia@example.com'),
  ('David Kamau',   'david@example.com');

INSERT INTO courses (title, credits) VALUES
  ('Web Development', 4),
  ('Databases',       3),
  ('Data Structures', 4);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 2, 'B'),
  (2, 1, 'B'),
  (3, 2, NULL),
  (3, 3, 'C');

-- ---------- Queries ----------

-- 1. All courses for one student (by name)
SELECT c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.id
JOIN courses c    ON c.id = e.course_id
WHERE s.name = 'Amina Wanjiru';

-- 2. All students on one course
SELECT s.name, s.email
FROM courses c
JOIN enrolments e ON e.course_id = c.id
JOIN students s   ON s.id = e.student_id
WHERE c.title = 'Web Development';

-- 3. Number of students per course (courses with none show 0)
SELECT c.title, COUNT(e.id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.id
GROUP BY c.id, c.title;

-- 4. Students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.id
WHERE e.id IS NULL;

-- 5. Update one enrolment's grade (Cynthia's Databases grade)
UPDATE enrolments
SET grade = 'A'
WHERE student_id = (SELECT id FROM students WHERE name = 'Cynthia Mwende')
  AND course_id  = (SELECT id FROM courses  WHERE title = 'Databases');

-- Check the update worked
SELECT s.name, c.title, e.grade
FROM enrolments e
JOIN students s ON s.id = e.student_id
JOIN courses c  ON c.id = e.course_id
WHERE s.name = 'Cynthia Mwende';
