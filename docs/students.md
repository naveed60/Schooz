# Students, guardians and enrollments

Students are permanent identities. Class placement is represented by `StudentEnrollment`, so a new academic year creates a new row and preserves prior history. All student, guardian, relationship and enrollment services require the centralized students permission and scope every lookup by `schoolId`.

Student lists are bounded and paginated with narrow selects. Detail loads guardians and enrollment history in bounded relation queries. Student photos use private keys under `schools/{schoolId}/students/{studentId}/` and the existing tenant-authorized signed URL helper.
