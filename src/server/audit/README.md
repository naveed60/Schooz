Audit events are append-oriented. Application UI must not expose generic update or
delete operations for `AuditLog`; corrections should be represented by a new
event. `AuditService` deliberately redacts credential-like keys and file content
fields before persistence.
