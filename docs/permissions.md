# Permission matrix

Authorization is server-side and tenant-scoped. A URL slug, submitted role, or
submitted school ID is never trusted. `resolveSchoolContext({ slug })` first
authenticates the Supabase user, loads the school by its unique slug, requires
an `ACTIVE` school, and then requires an `ACTIVE` membership for that exact
`(schoolId, userId)` pair.

`PLATFORM_ADMIN` is a platform role on `UserProfile`; it is intentionally not a
school membership role. `/platform/*` is protected by a server layout that
requires that role. `/s/[schoolSlug]/*` is protected by a server layout that
requires an active school membership.

| Role | Permissions |
| --- | --- |
| `SCHOOL_OWNER` | All school/settings, students, teachers, academics, exams/results, fees/payments, and id-card read/manage permissions |
| `SCHOOL_ADMIN` | Same V1 permissions as `SCHOOL_OWNER` |
| `TEACHER` | All read permissions; manage teachers, academics, and exams/results |
| `ACCOUNTANT` | All read permissions; manage fees/payments |
| `EXAM_CONTROLLER` | All read permissions; manage exams/results |
| `RECEPTIONIST` | Read school/settings, students, teachers, academics, exams/results, fees/payments, and id-card |
| `PARENT` | Read students, academics, exams/results, fees/payments, and id-card |
| `STUDENT` | Read academics, exams/results, and id-card |

Permission constants live in `src/server/authorization/permissions.ts`.
Application repositories must accept `SchoolContext` (or an explicit
`schoolId`) and apply `withSchoolScope(context, where)` to tenant predicates.
Membership resolution uses the unique school slug lookup plus the indexed
membership `(schoolId, status)` predicate and the unique `(schoolId, userId)`
constraint. Pass the resolved context down a server render tree when multiple
tenant operations are needed to avoid repeated resolution.
