# Supabase Engineering Standard

**Document ID:** STANDARD-005

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required engineering practices for using Supabase within the Savrio ecosystem.

All Supabase implementations must prioritize security, scalability, maintainability, and predictable data access.

---

# Guiding Principles

Every Supabase implementation must be:

- Secure by default
- Server-first
- Type-safe
- Performant
- Scalable
- Reliable
- Auditable
- Maintainable

---

# Approved Services

Approved Supabase services include:

- Authentication
- PostgreSQL
- Row Level Security (RLS)
- Storage
- Edge Functions (when appropriate)
- Realtime (only when justified)

Avoid enabling services that are not required.

---

# Authentication

Use:

- Supabase Auth
- Secure session management
- Server-side authentication
- Protected routes

Never:

- Store secrets in the client
- Trust client authentication state alone
- Bypass authentication checks

---

# Authorization

Authorization must always be enforced using:

- Row Level Security
- Server-side validation
- Principle of least privilege

Never rely solely on frontend authorization.

---

# Database

All database changes must:

- Use migrations
- Preserve referential integrity
- Follow normalization principles
- Use descriptive naming
- Include appropriate indexes

Never modify production schemas manually.

---

# Row Level Security

Every user-accessible table must:

- Have RLS enabled
- Include explicit policies
- Deny unauthorized access by default

Policies should remain simple and auditable.

---

# Storage

Use Supabase Storage for:

- User uploads
- Images
- Documents
- Public assets when appropriate

Validate uploads before storage.

Restrict bucket access appropriately.

---

# API Access

Prefer:

- Server Components
- Server Actions
- Route Handlers

Avoid exposing direct database operations to the client unless explicitly required.

---

# Environment Variables

Secrets must exist only in secure environment variables.

Never:

- Commit secrets
- Hardcode credentials
- Expose service role keys
- Store API keys in client bundles

---

# Type Safety

Generate and maintain database types.

Use typed database clients throughout the application.

Avoid untyped queries.

---

# Performance

Optimize through:

- Proper indexing
- Efficient queries
- Pagination
- Batch operations
- Connection reuse

Avoid unnecessary database round trips.

---

# Error Handling

Database operations should:

- Return meaningful errors
- Log failures
- Avoid leaking internal implementation details

Gracefully handle connection failures.

---

# Logging

Log:

- Authentication failures
- Authorization failures
- Storage failures
- Migration failures
- Unexpected database errors

Never log sensitive user information.

---

# Security

Always:

- Validate user input
- Enforce RLS
- Sanitize uploaded files
- Protect secrets
- Verify ownership before writes

Never bypass security controls for convenience.

---

# File Organization

Organize Supabase code into:

```
lib/supabase/
├── client.ts
├── server.ts
├── middleware.ts
├── types.ts
└── helpers/
```

Keep queries close to their associated features whenever practical.

---

# Naming

Use:

- snake_case for database objects
- camelCase for TypeScript variables
- PascalCase for TypeScript types and interfaces

Maintain consistency across the application.

---

# Testing Expectations

Before merge verify:

- Authentication works
- Authorization enforced
- RLS policies validated
- Storage permissions verified
- Migrations succeed
- Database types updated

---

# Code Review Checklist

Verify:

- RLS enabled
- Secure authentication
- Proper authorization
- Type-safe queries
- No exposed secrets
- Efficient database access
- Proper indexing
- Error handling
- Logging
- Standards compliance

---

# Definition of Done

A Supabase implementation is complete when:

- Authentication secure
- Authorization verified
- RLS enforced
- Database types updated
- Performance acceptable
- Standards followed
- Ready for production

---

# Compliance

All engineering agents must comply with this standard.

Every Supabase implementation must prioritize security, data integrity, and long-term maintainability.