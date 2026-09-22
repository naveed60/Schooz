# Academic structure

Academic years, classes, sections, subjects and class-subject mappings are tenant-scoped. Every service receives an authenticated `SchoolContext` and adds `schoolId` to every lookup and write; relation inputs are re-checked against that same school before creation.

The migration enforces per-school uniqueness, date and marks checks, and a partial unique index permits at most one current academic year. Records use `ACTIVE`/`ARCHIVED`; destructive deletion is intentionally not exposed. Current-year selection clears the existing current flag and sets the requested year in one transaction, with the partial index as the concurrency backstop.

Class-subject list loading includes class, subject and year in one bounded relation query, avoiding one query per row.
