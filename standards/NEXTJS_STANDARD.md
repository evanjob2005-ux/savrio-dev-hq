# Next.js Engineering Standard

**Document ID:** STANDARD-001

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required engineering practices for all Next.js development within the Savrio ecosystem.

Every engineer and AI agent must follow these standards unless an approved architectural exception exists.

---

# Guiding Principles

Every Next.js implementation must be:

- Server-first
- Secure by default
- Type-safe
- Performant
- Modular
- Accessible
- Maintainable
- Scalable

---

# Approved Framework

Required:

- Next.js App Router

Do NOT use:

- Pages Router
- Mixed routing architectures

---

# Project Structure

Applications should follow:

```
app/
components/
features/
lib/
hooks/
types/
styles/
public/
```

Feature-specific code should remain inside its feature directory whenever practical.

---

# Routing

Use:

- App Router
- Nested layouts
- Route groups when appropriate
- Dynamic routes only when required

Avoid:

- Duplicate routes
- Deep routing complexity
- Unnecessary nesting

---

# Server Components

Default to:

- Server Components

Only use Client Components when required for:

- State
- Browser APIs
- Event handlers
- Interactive UI

Never convert an entire page into a Client Component unless absolutely necessary.

---

# Data Fetching

Prefer:

- Server Components
- Route Handlers
- Server Actions (when appropriate)

Avoid:

- Client-side fetching for protected data
- Duplicate requests
- Waterfall fetching

---

# Rendering Strategy

Use the most appropriate rendering method:

- Static Rendering
- Dynamic Rendering
- Incremental Static Regeneration

Choose the simplest option that satisfies requirements.

---

# API Design

Internal APIs should:

- Validate inputs
- Return typed responses
- Handle errors consistently
- Avoid exposing internal implementation details

---

# State Management

Prefer:

1. Server state
2. URL state
3. Local component state

Introduce global state only when justified.

---

# Performance

Optimize for:

- Fast initial load
- Minimal JavaScript
- Streaming where appropriate
- Lazy loading
- Image optimization
- Font optimization
- Code splitting

Avoid premature optimization.

---

# Security

Never:

- Expose secrets to the client
- Trust client input
- Store sensitive logic in Client Components

Always:

- Validate requests
- Sanitize inputs
- Protect authenticated routes

---

# Error Handling

Implement:

- error.tsx
- not-found.tsx
- Loading states
- Graceful fallback UI

Errors should be recoverable whenever possible.

---

# Accessibility

Every page should:

- Use semantic HTML
- Support keyboard navigation
- Include accessible labels
- Meet WCAG expectations

Accessibility is mandatory.

---

# Styling

Approved:

- Tailwind CSS
- CSS Modules when justified

Avoid:

- Inline styles
- Large global CSS files

---

# File Organization

Keep:

- Components focused
- Files reasonably small
- Features isolated
- Shared utilities centralized

Avoid unnecessary abstraction.

---

# Naming

Use:

- PascalCase for components
- camelCase for variables
- kebab-case for route folders

Names should clearly describe intent.

---

# Testing Expectations

Before merge verify:

- Application builds
- Lint passes
- TypeScript passes
- Critical user flows work
- No console errors

---

# Code Review Checklist

Verify:

- Server-first architecture
- Minimal Client Components
- Clean routing
- Proper error handling
- Type safety
- Performance considerations
- Accessibility
- Security
- Readability
- Standards compliance

---

# Definition of Done

A Next.js implementation is complete when:

- Architecture follows App Router
- Code builds successfully
- Performance is acceptable
- Accessibility verified
- Security reviewed
- Standards followed
- Ready for production

---

# Compliance

All engineering agents must comply with this standard.

Architectural deviations require explicit approval from the AI Agent Orchestrator.