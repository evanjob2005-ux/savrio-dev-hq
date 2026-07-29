# Naming Standard

**Document ID:** STANDARD-019  
**Version:** 1.0.0  
**Applies To:** All Dev HQ work

## Purpose

Names must communicate purpose consistently without concealing ownership or behavior.

## Requirements

- Follow the established convention in the affected subsystem; do not introduce a second convention without approval.
- Use descriptive, domain-specific names. Avoid unexplained abbreviations, placeholders, and misleading legacy names.
- Type and component names use `PascalCase`; JavaScript/TypeScript functions, variables, and fields use `camelCase`; constants use the repository's established convention.
- Files follow their framework and neighboring-directory convention. Database identifiers and environment variables follow the applicable database and security standards.
- Boolean names state the proposition they represent. Event names use completed domain facts; commands use imperative intent.
- Public names, status-check names, routes, schema fields, and persisted identifiers are compatibility surfaces and may not be renamed silently.
- A coordinated product rename requires an explicit owner and migration plan; discovery of inconsistent labels is not authorization to mass rename.

When conventions conflict or a rename crosses an ownership boundary, escalate and record the decision.
