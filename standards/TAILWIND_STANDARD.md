# Tailwind CSS Engineering Standard

**Document ID:** STANDARD-004

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required Tailwind CSS engineering practices for every Savrio application.

All styling should be consistent, maintainable, responsive, accessible, and aligned with the Savrio design system.

---

# Guiding Principles

Every Tailwind implementation must be:

- Utility-first
- Consistent
- Responsive
- Accessible
- Maintainable
- Reusable
- Performant
- Design-system driven

---

# Design System

Always use:

- Design tokens
- Shared color palette
- Shared spacing scale
- Shared typography
- Shared border radius
- Shared shadows

Avoid introducing one-off values without approval.

---

# Utility Classes

Prefer:

- Tailwind utilities
- Semantic component composition
- Shared utility patterns

Avoid:

- Long unreadable class strings
- Duplicate styling
- Conflicting utilities

---

# Responsive Design

Use Tailwind's responsive breakpoints:

- sm
- md
- lg
- xl
- 2xl

Design mobile-first.

Avoid desktop-first layouts.

---

# Layout

Prefer:

- Flexbox
- CSS Grid
- Gap utilities
- Container utilities

Avoid unnecessary wrapper elements.

---

# Spacing

Use the Tailwind spacing scale.

Never use arbitrary spacing values unless required by the approved design system.

Maintain consistent vertical rhythm throughout the application.

---

# Colors

Only use approved design tokens.

Avoid:

- Random hex values
- Inline colors
- Unapproved palettes

Support both light and dark themes where applicable.

---

# Typography

Maintain consistent:

- Font sizes
- Font weights
- Line heights
- Letter spacing

Headings should follow a clear hierarchy.

---

# Components

Extract reusable UI when styling patterns repeat.

Avoid copying large utility blocks across multiple files.

---

# State Styling

Support all applicable states:

- Hover
- Focus
- Active
- Disabled
- Loading
- Error

Interactive elements must include visible focus indicators.

---

# Dark Mode

Support the approved theme strategy.

Do not implement separate duplicated components for light and dark mode.

---

# Accessibility

Ensure:

- Sufficient color contrast
- Visible focus rings
- Readable typography
- Accessible spacing
- Touch-friendly targets

Accessibility takes priority over visual preference.

---

# Animations

Animations should:

- Be subtle
- Improve usability
- Respect reduced motion preferences
- Avoid distracting effects

Favor CSS transitions over complex animations.

---

# Performance

Optimize by:

- Minimizing unnecessary utilities
- Removing unused styles
- Reusing components
- Avoiding excessive DOM complexity

Keep styling efficient.

---

# File Organization

Keep styling:

- Inside components
- Consistent across features
- Easy to scan
- Easy to maintain

Avoid large custom CSS files.

---

# Naming

Component names should:

- Describe purpose
- Match feature organization
- Remain consistent across the project

---

# Testing Expectations

Before merge verify:

- Responsive layouts
- Dark mode support
- Accessible styling
- No visual regressions
- Consistent spacing
- Proper focus states

---

# Code Review Checklist

Verify:

- Mobile-first implementation
- Design system compliance
- Consistent spacing
- Consistent typography
- Responsive behavior
- Accessible colors
- Minimal duplication
- Readable class organization
- Performance considerations
- Standards compliance

---

# Definition of Done

A Tailwind implementation is complete when:

- Design system followed
- Responsive across supported devices
- Accessible
- Maintainable
- Visually consistent
- Standards followed
- Ready for production

---

# Compliance

All engineering agents must comply with this standard.

Styling decisions should prioritize consistency, maintainability, and long-term scalability over short-term convenience.