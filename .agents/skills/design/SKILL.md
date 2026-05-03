---
name: design
description: Guides the implementation of high-fidelity, premium UI designs. Use when styling components, mapping BEM classes, or setting up GSAP animations.
---

# Design Skill

This skill ensures that all UI implementations adhere to the project's premium aesthetic and technical standards.

## When to use this skill

- Use this when building new Svelte components that require styling.
- Use this when implementing complex animations using GSAP.
- Use this when mapping CSS classes to the BEM (Block Element Modifier) convention.

## How to use it

### 1. Style Awareness

Always refer to the existing design system in `apps/web/src/styles`:

- **Colors (`_colors.css`)**: Use `var(--color-bg)`, `var(--color-text)`, and `var(--color-primary)`. Use `--color-overlay-xx` for depth.
- **Typography (`_typography.css`)**: Use `Geist` (200 weight, 0.34% tracking) for main text. Use `GeistPixel` or `Advine-Pixel` for custom branding.
- **Layout (`_containers.css`)**: Wrap hero and section content in `.section-container` (max-width 1920px).

### 2. BEM Mapping

- Always structure classes as `block`, `block__element`, and `block--modifier`.
- Avoid deeply nested selectors; rely on specific BEM classes for scoping.

### 3. Animation Guidelines (GSAP)

- Use GSAP for all state transitions.
- Avoid instant visual snaps; favor fluid, organic motion.
- Implement micro-animations for interactive elements (hover, active states).

## Examples

```svelte
<!-- Good: BEM + Tokens + Layout -->
<section class="hero section-container">
  <h1 class="hero__title">Ego Ipse</h1>
</section>

<style>
  .hero__title {
    color: var(--color-text);
    font-family: 'Geist', sans-serif;
    font-weight: 200;
    letter-spacing: 0.34%;
  }
</style>
```

## Anti-patterns

- Hardcoding hex codes (e.g., `#ffffff`) instead of using CSS variables.
- Using plain browser defaults or generic colors.
- Instant visibility toggles (always use GSAP or Svelte transitions).
