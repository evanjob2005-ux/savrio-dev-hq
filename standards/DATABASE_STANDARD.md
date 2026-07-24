# Database Engineering Standard

**Document ID:** STANDARD-007

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required engineering practices for designing, implementing, maintaining, and evolving databases throughout the Savrio ecosystem.

Every database implementation must prioritize integrity, scalability, security, performance, and maintainability.

---

# Guiding Principles

Every database implementation must be:

- Secure by default
- Normalized
- Scalable
- Performant
- Reliable
- Auditable
- Consistent
- Maintainable

---

# Database Platform

Approved production database:

- PostgreSQL (Supabase)

All development should assume PostgreSQL compatibility.

---

# Schema Design

Schemas should:

- Model real business entities
- Minimize duplication
- Support future growth
- Remain easy to understand
- Use consistent naming

Avoid unnecessary complexity.

---

# Normalization

Target:

- Third Normal Form (3NF)

Denormalization is acceptable only when justified by measurable performance improvements.

---

# Primary Keys

Every table must contain:

- A primary key

Preferred:

- UUID

Avoid composite primary keys unless there is a strong architectural reason.

---

# Foreign Keys

Always enforce:

- Referential integrity
- Cascading behavior intentionally
- Explicit relationships

Never leave relationships implied.

---

# Constraints

Use database constraints whenever possible:

- NOT NULL
- UNIQUE
- CHECK
- FOREIGN KEY

Business-critical validation should not rely solely on application code.

---

# Indexing

Indexes should support:

- Foreign keys
- Frequent filtering
- Sorting
- Search operations
- High-traffic queries

Avoid unnecessary indexes that increase write costs.

---

# Naming Conventions

Use:

- snake_case
- plural table names
- descriptive column names
- consistent foreign key naming

Examples:

```
users
recipes
recipe_images

user_id
recipe_id
created_at
updated_at
```

---

# Timestamps

Every major table should include:

- created_at
- updated_at

Soft-delete tables should also include:

- deleted_at

Store timestamps in UTC.

---

# Migrations

All schema changes must:

- Use version-controlled migrations
- Be reversible when practical
- Be reviewed before production

Never modify production schemas manually.

---

# Query Design

Queries should:

- Be parameterized
- Minimize joins when practical
- Retrieve only required columns
- Support pagination
- Avoid N+1 query patterns

Never concatenate SQL manually.

---

# Transactions

Use transactions whenever:

- Multiple writes must succeed together
- Financial or critical operations occur
- Data consistency depends on multiple updates

Keep transactions short.

---

# Security

Always:

- Enforce Row Level Security
- Validate ownership
- Restrict privileged access
- Encrypt sensitive information where appropriate

Never expose unrestricted database access.

---

# Performance

Optimize through:

- Proper indexing
- Efficient queries
- Query analysis
- Pagination
- Batch operations
- Connection reuse

Measure performance before optimizing.

---

# Backups

Production systems should support:

- Automated backups
- Point-in-time recovery
- Disaster recovery procedures
- Backup verification

Recovery procedures should be documented.

---

# Data Integrity

Maintain:

- Referential integrity
- Consistent constraints
- Valid relationships
- Accurate data

Data correctness takes priority over convenience.

---

# Logging

Log:

- Migration failures
- Connection failures
- Unexpected query failures
- Replication issues
- Backup failures

Never log sensitive user data.

---

# Documentation

Document:

- Tables
- Relationships
- Constraints
- Indexes
- Business purpose
- Migration history

Documentation should remain current.

---

# Testing Expectations

Before merge verify:

- Migrations succeed
- Rollback succeeds where applicable
- Constraints enforced
- Relationships valid
- Queries perform acceptably
- RLS policies verified

---

# Code Review Checklist

Verify:

- Proper normalization
- Strong referential integrity
- Appropriate indexing
- Secure access
- Efficient queries
- Migration quality
- Consistent naming
- Documentation
- Performance
- Standards compliance

---

# Definition of Done

A database implementation is complete when:

- Schema validated
- Constraints enforced
- Relationships verified
- Performance acceptable
- Security reviewed
- Documentation complete
- Standards followed
- Ready for production

---

# Compliance

All engineering agents must comply with this standard.

Database decisions should prioritize long-term maintainability, integrity, scalability, and operational reliability.