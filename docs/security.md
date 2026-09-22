# Storage and cross-cutting security

The private Supabase Storage bucket is accessed only with the server/worker
service-role key. That key is never exposed to browser code, serialized into
job metadata, or written to audit logs. Upload metadata is allowlisted and size
limited before a tenant-scoped key is generated under
`schools/{schoolId}/objects/{objectId}`.

Downloads use `createAuthorizedDownloadUrl`, which requires an active
`SchoolContext`, verifies that the requested school and storage key belong to
that context, and creates a signed URL that expires within 15 minutes. Resource
ownership checks for feature-specific records must happen before calling this
helper; a URL slug or client-provided school ID is not authorization.

Audit metadata is sanitized for credential-like fields and raw file content.
Audit records are append-oriented and have no generic application update or
delete path. Request IDs are accepted only in a constrained format or replaced
with a generated UUID. Structured logs cap nested data and redact passwords,
tokens, cookies, keys, and service-role values.
