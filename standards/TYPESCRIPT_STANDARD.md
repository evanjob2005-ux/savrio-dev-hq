# TypeScript Engineering Standard

**Document ID:** STANDARD-002

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required TypeScript engineering practices for every Savrio project.

All application code must prioritize type safety, readability, maintainability, and long-term scalability.

---

# Guiding Principles

Every TypeScript implementation must be:

- Strongly typed
- Readable
- Predictable
- Maintainable
- Reusable
- Self-documenting
- Production-ready

---

# Strict Mode

Required:

- `"strict": true`

Never disable:

- noImplicitAny
- strictNullChecks
- noUncheckedIndexedAccess (when enabled)
- exactOptionalPropertyTypes (when enabled)

Avoid weakening compiler rules.

---

# Type Safety

Always:

- Prefer explicit types
- Narrow unknown values
- Validate external inputs
- Use discriminated unions where appropriate

Never:

- Use `any`
- Suppress compiler errors unnecessarily
- Ignore null or undefined handling

---

# Interfaces vs Types

Use:

- `interface` for extendable object contracts
- `type` for unions, mapped types, utility types, and aliases

Choose the simplest construct that communicates intent.

---

# Function Design

Functions should:

- Have a single responsibility
- Define parameter types
- Define return types
- Avoid side effects
- Be small and composable

---

# Object Modeling

Prefer:

- Immutable data where practical
- Readonly properties when appropriate
- Small focused interfaces
- Shared reusable types

Avoid duplicate type definitions.

---

# Enums

Prefer:

- String literal unions

Avoid traditional enums unless interoperability requires them.

---

# Generics

Use generics only when they improve reuse and readability.

Avoid overly complex generic abstractions.

---

# Type Assertions

Avoid assertions whenever possible.

Prefer:

- Type narrowing
- Type guards
- Runtime validation

Never use assertions to silence compiler errors.

---

# Error Handling

Errors should:

- Be typed where appropriate
- Preserve useful context
- Avoid leaking internal implementation details

---

# Async Code

Always:

- Await promises
- Handle rejected promises
- Return typed async results

Avoid floating promises.

---

# Imports

Use:

- Named imports
- Consistent ordering
- Absolute imports when configured

Remove unused imports immediately.

---

# Naming

Use:

- PascalCase for interfaces and types
- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants

Names should clearly communicate intent.

---

# File Organization

Keep:

- Related types together
- Shared types centralized
- Files focused on a single concern

Avoid circular dependencies.

---

# Documentation

Complex types should include concise documentation explaining purpose and usage.

Avoid documenting obvious behavior.

---

# Performance

Optimize:

- Type readability
- Compiler performance
- Build stability

Avoid unnecessary type complexity.

---

# Testing Expectations

Before merge verify:

- TypeScript passes
- No implicit any
- No unused types
- No unused exports
- Build succeeds

---

# Code Review Checklist

Verify:

- Strong typing
- No unnecessary assertions
- No any usage
- Clear interfaces
- Proper null handling
- Readable types
- Reusable abstractions
- Consistent naming
- Maintainable structure
- Standards compliance

---

# Definition of Done

A TypeScript implementation is complete when:

- Strict typing maintained
- Compiler passes
- Types are readable
- Build succeeds
- Standards followed
- Ready for production

---

# Compliance

All engineering agents must comply with this standard.

Type safety is a mandatory engineering requirement throughout the Savrio ecosystem.
