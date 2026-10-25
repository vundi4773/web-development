# School Database Design

## Tables

### students
- Stores one row per student: `id` (primary key), `name` and `email`.
- `name` and `email` are `NOT NULL`, and `email` is `UNIQUE` so two students cannot share an address.

### courses
- Stores one row per course: `id` (primary key), `title` and `credits`.
- `title` and `credits` are `NOT NULL`, and a `CHECK` makes sure credits are greater than zero.

### enrolments
- Stores the fact that a student is enrolled on a course, plus the `grade` they received.
- `student_id` and `course_id` are foreign keys pointing at `students` and `courses`, and both are `NOT NULL`.
- `grade` is allowed to be `NULL` because a student has no grade until they have been assessed.
- `UNIQUE (student_id, course_id)` stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments is one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments is one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses is many-to-many.** A student can take many courses, and a course has many students.
- **Why a join table is needed:** a relational table cannot hold a list of values in one column. Putting a `course_id` column in `students` would allow only one course per student, and putting a `student_id` column in `courses` would allow only one student per course. The `enrolments` table solves this by holding one row per student and course pair. It is also the right place for the `grade`, because a grade belongs to the pair, not to the student or the course alone.

## Index

I would add an index on the course column of the enrolments table:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

The reason is speed for the "students on one course" query and the "students per course" count. Both look up enrolments by `course_id`. The `UNIQUE (student_id, course_id)` rule already creates an index that helps searches by student, but it cannot be used efficiently to search by `course_id` alone. Without the new index, the database would scan every row of `enrolments` as the table grows.

## SQL or NoSQL?

I would choose SQL for this system. The data is highly structured and the relationships are central to it: students, courses and enrolments always connect in the same way. SQL enforces those connections for me with foreign keys, unique rules and `NOT NULL`, so the database itself prevents duplicate enrolments, duplicate emails and enrolments for students who do not exist. Questions such as "which students have no enrolments" or "how many students are on each course" are also natural with joins and `GROUP BY`. A NoSQL document database could store each student with an embedded list of courses, but then the same course data would be repeated in many documents, and queries from the course side would be awkward. NoSQL would make more sense if the data had no fixed shape or needed to scale across many servers, and a school system does not.
