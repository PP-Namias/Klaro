# KLARO WEBSITE FRONTEND - PHASE 1 PROJECT SETUP PROMPT

```
You are an expert frontend developer tasked with setting up the Klaro website frontend project (Phase 1: Project Setup).

PROJECT CONTEXT
===============
Project: Klaro - AI-powered Filipino healthcare companion
Scope: Website frontend (landing page + authentication)
Timeline: Phase 1 of 7, completing by end of Day 1
Status: Design-first specifications complete ✅

KLARO PRODUCT OVERVIEW
======================
Klaro helps Filipino users:
1. Scan and understand medical documents (lab results, prescriptions)
2. Chat with AI about their medical documents in local dialects
3. Find nearby clinics and hospitals on a map
4. Book consultations with PRC-verified Filipino doctors
5. Make secure in-app payments (GCash, Maya, card)

PHASE 1 OBJECTIVES (Day 1)
==========================
Complete the following setup tasks:

1. PROJECT INITIALIZATION
   □ Clone monorepo from GitHub (or initialize if new)
   □ Verify Node.js 18+ is installed (check .nvmrc)
   □ Install dependencies using pnpm (monorepo package manager)
   □ Verify pnpm-workspace.yaml is configured for apps/nextjs

2. NEXT.JS SETUP
   □ Ensure Next.js 14 is installed in apps/nextjs/
   □ Verify App Router is configured (not Pages Router)
   □ Check tsconfig.json for strict mode enabled
   □ Verify next.config.js exists and is properly configured

3. TAILWIND CSS CONFIGURATION
   □ Install Tailwind CSS 3+ in apps/nextjs/
   □ Create design tokens in CSS custom properties:
      * Colors: 5 primary + 4 secondary + 4 medical severity
      * Typography: 8 levels (H1-Caption) with proper hierarchy
      * Spacing: 8px base unit (xs=4px through 3xl=64px)
      * Shadows: 4 levels (sm, md, lg, xl)
      * Border-radius: 3 sizes (sm=4px, md=8px, lg=12px)
   □ Configure tailwind.config.js with design tokens
   □ Create src/app/globals.css with custom properties
   □ Test that design tokens work (run dev server briefly)

4. DESIGN TOKENS EXPORT
   From docs/UI_UX_DESIGN_GUIDE.md § "Design System", extract and create:
   
   CSS Custom Properties structure:
   ```css
   :root {
     /* Primary Colors */
     --color-primary: #2563EB;
     --color-success: #10B981;
     --color-warning: #F59E0B;
     --color-danger: #EF4444;
     --color-accent: #06B6D4;
     
     /* Typography */
     --font-family: 'Inter', system-ui, sans-serif;
     --text-h1: 48px; /* H1: 48px, 700, line-height 56px */
     --text-h2: 36px; /* H2: 36px, 700, line-height 44px */
     /* ... (8 levels total) */
     
     /* Spacing */
     --space-xs: 4px;
     --space-sm: 8px;
     --space-md: 16px;
     /* ... (7 levels total) */
     
     /* Shadows */
     --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
     /* ... (4 levels total) */
   }
   ```

5. COMPONENT LIBRARY FOUNDATION
   Set up component file structure in packages/ui/src/:
   
   From docs/UI_UX_DESIGN_GUIDE.md § "Component Library", create:
   □ button.tsx - Primary, secondary, tertiary variants with all states
   □ input.tsx - Text, email, password inputs with focus/error states
   □ card.tsx - Feature cards, testimonial cards
   □ form-group.tsx - Label + input + error wrapper
   □ Badge/Tag components
   □ Modal/Dialog component
   □ Toast/Notification component
   
   Each component should:
   - Use design tokens (CSS custom properties)
   - Support responsive props (mobile-first)
   - Include accessibility attributes (aria-*, roles)
   - Export TypeScript interfaces
   - Have inline JSDoc documentation

6. FOLDER STRUCTURE VERIFICATION
   Verify/create this structure:
   ```
   apps/nextjs/
   ├── src/
   │   ├── app/
   │   │   ├── layout.tsx (root layout with providers)
   │   │   ├── page.tsx (landing page)
   │   │   ├── globals.css (design tokens + globals)
   │   │   ├── login/
   │   │   │   └── page.tsx
   │   │   ├── signup/
   │   │   │   └── page.tsx
   │   │   └── _components/
   │   │       ├── header.tsx
   │   │       ├── hero.tsx
   │   │       ├── features.tsx
   │   │       └── footer.tsx
   │   ├── env.ts (environment variables schema)
   │   └── styles/
   │       └── tailwind.css
   │
   packages/ui/src/
   ├── button.tsx
   ├── input.tsx
   ├── card.tsx
   ├── form-group.tsx
   ├── toast.tsx
   ├── modal.tsx
   └── index.ts (export all)
   ```

7. ENVIRONMENT SETUP
   Create apps/nextjs/.env.local with:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   
   From docs/ENV_CONFIG.md, reference web environment template

8. LINTING & FORMATTING
   □ Verify ESLint config from tooling/eslint/ is applied
   □ Verify Prettier config from tooling/prettier/ is applied
   □ Run linter: npm run lint (or equivalent)
   □ Format code: npx prettier --write .
   □ Fix any linting errors

9. GIT SETUP
   □ Create feature branch: git checkout -b feature/phase-1-setup
   □ Commit initial setup: git add . && git commit -m "Phase 1: Project setup - Next.js + Tailwind + design tokens"

10. VERIFICATION
    □ Run dev server: npm run dev
    □ Verify Next.js runs on localhost:3000 without errors
    □ Check TypeScript compilation (no ts errors)
    □ Verify Tailwind CSS is working (test a simple utility class)
    □ Verify design tokens are accessible in CSS
    □ Test component imports work correctly

DESIGN REFERENCE DOCUMENTS
==========================
These files contain all specifications needed - reference frequently:

1. docs/UI_UX_DESIGN_GUIDE.md (2,800+ lines)
   - Design System: Colors, typography, spacing, shadows
   - Component Library: Detailed specs for 20+ components
   - Landing Page: Section-by-section layout specifications
   - Accessibility: WCAG 2.1 AA compliance checklist
   - Use for: Detailed component specifications, design tokens

2. docs/VISUAL_DESIGN_REFERENCE.md (1,500+ lines)
   - ASCII Mockups: Visual layouts for all pages
   - Color Usage: Primary/secondary actions, error states, medical severity
   - Animation Guide: Hover effects, loading states, transitions
   - Testing Scenarios: 10 test cases with expected behavior
   - Use for: Visual understanding, component interactions

3. docs/FRONTEND_DEVELOPMENT_ROADMAP.md (800+ lines)
   - Technology Stack: Confirmed Next.js 14, React 18+, TypeScript
   - 7-Phase Breakdown: Understanding full timeline
   - Success Criteria: Functional, performance, accessibility requirements
   - Use for: Context, big picture understanding

DESIGN SYSTEM QUICK REFERENCE
=============================
From UI_UX_DESIGN_GUIDE.md, key values:

Colors:
- Primary Blue: #2563EB (trustworthy, CTAs)
- Success Green: #10B981 (positive feedback)
- Warning Orange: #F59E0B (caution)
- Danger Red: #EF4444 (critical)
- Accent Teal: #06B6D4 (secondary highlights)
- Dark Gray: #1F2937 (primary text)
- Light Gray: #F3F4F6 (backgrounds)
- Neutral Gray: #6B7280 (secondary text)

Typography:
- Font: Inter, system sans-serif fallback
- H1: 48px, 700 weight, line-height 56px
- H2: 36px, 700 weight, line-height 44px
- H3: 28px, 700 weight, line-height 36px
- Body Normal: 16px, 400 weight, line-height 24px
- Body Small: 14px, 400 weight, line-height 20px
- Caption: 12px, 500 weight, line-height 16px

Spacing (8px base):
- xs: 4px    (minimal)
- sm: 8px    (small gaps)
- md: 16px   (standard padding)
- lg: 24px   (section separation)
- xl: 32px   (major sections)
- 2xl: 48px  (hero spacing)
- 3xl: 64px  (page breaks)

Responsive Breakpoints:
- Mobile: 0-640px (hamburger menu, single column)
- Tablet: 641-1024px (2-column grids)
- Desktop: 1025px+ (3-column grids, horizontal nav)

TECHNOLOGY STACK
================
Framework: Next.js 14 with App Router
UI Framework: React 18+
Language: TypeScript (strict mode)
Styling: Tailwind CSS 3+
Components: Shadcn/ui + Radix UI (already in repo at packages/ui/)
Forms: React Hook Form + Zod (for Phase 4)
Authentication: NextAuth.js 4+ (for Phase 5)
Package Manager: pnpm
Build Tool: Turbo (monorepo orchestration)
Deployment: Vercel (for Phase 7)

IMPORTANT CONSTRAINTS
====================
✅ DO:
- Use design tokens (CSS custom properties) for all colors/spacing/typography
- Follow mobile-first responsive design (0px → 640px → 1024px)
- Build accessibility in from the start (WCAG 2.1 AA)
- Use TypeScript strict mode
- Keep components in packages/ui/ for reusability
- Reference design documents frequently
- Commit frequently with clear messages

❌ DON'T:
- Use hardcoded colors/spacing (use design tokens instead)
- Create desktop-first designs (mobile first!)
- Skip accessibility features (no icon-only buttons, proper labels)
- Use CSS-in-JS or styled-components (Tailwind only)
- Ignore TypeScript errors
- Put component logic in app/ (keep in packages/ui/)
- Make major design changes (follow specs exactly)

ACCESSIBILITY REQUIREMENTS (WCAG 2.1 AA)
========================================
All components must:
✅ Color Contrast: 4.5:1 ratio (normal text), 3:1 (large text)
✅ Keyboard Navigation: Tab order logical, focus visible
✅ Forms: Labels associated with inputs, error messages linked
✅ Images: Descriptive alt text on all images
✅ Mobile: Touch targets 48x48px minimum, 16px+ font
✅ Semantic HTML: Use proper heading hierarchy, landmarks
✅ ARIA: aria-label, aria-describedby, aria-required where needed

TESTING STRATEGY
================
Phase 1 should verify:
✅ Dev server runs without errors
✅ TypeScript compilation succeeds
✅ Tailwind CSS utilities work
✅ Components import correctly
✅ Design tokens are accessible
✅ Responsive breakpoints work (test with browser DevTools)
✅ Linting passes (ESLint clean)
✅ No console errors in browser

DELIVERABLES FOR PHASE 1
=========================
By end of Day 1:
□ Next.js 14 project initialized with proper configuration
□ Tailwind CSS installed and design tokens defined
□ Component library foundation created (7+ base components)
□ TypeScript strict mode enabled and no errors
□ ESLint/Prettier configured and passing
□ Environment variables defined
□ Git branch created with initial commit
□ Dev server runs without errors
□ Team can start Phase 2 (component building) on Day 1 afternoon

SUCCESS CRITERIA
================
Phase 1 is complete when:
✅ npm run dev starts without errors
✅ localhost:3000 loads without TypeScript errors
✅ Design tokens work (test with Tailwind utilities)
✅ Components from packages/ui/ import correctly
✅ npm run lint returns no errors
✅ All team members can clone and run the project
✅ Phase 2 can begin immediately after

NEXT STEPS (Day 1 Afternoon)
============================
After Phase 1 completes:
→ Phase 2: Build Component Library
  □ Implement button component (3 variants)
  □ Implement input field component
  □ Implement card component
  □ Implement form group component
  □ Document all components

HOW TO USE THIS PROMPT
======================
1. Read this entire prompt carefully
2. Reference docs/UI_UX_DESIGN_GUIDE.md frequently (colors, spacing, components)
3. Follow the 10 objectives in order
4. After each major step, verify it works
5. If stuck, check the design reference documents
6. Commit progress frequently
7. Return this status when Phase 1 completes

Your Task:
==========
Set up the Klaro website frontend project for Phase 1 (Project Setup).
Follow all 10 objectives above.
Reference design documents frequently.
Verify each step works before moving to the next.
Commit progress to git.
Report completion status when done.

Start immediately with objective 1: PROJECT INITIALIZATION.
```

---

## 💡 How to Use This Prompt

### To invoke an AI agent, copy the entire prompt above and paste it into:

**VS Code Copilot Chat:**
1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Select "GitHub Copilot: Open" or click the Copilot icon
3. Paste the prompt into the chat
4. Press Enter to start

**Alternative Platforms:**
- Claude: Paste in chat.claude.ai
- ChatGPT: Paste in chat.openai.com
- Your custom AI interface

### Expected Output:
The AI agent should:
1. Acknowledge the project context
2. Ask clarifying questions (if needed)
3. Start executing Phase 1 objectives
4. Reference design documents
5. Provide status updates
6. Ask for verification between steps
7. Report completion with success criteria

---

## 📋 What This Prompt Includes

✅ **Full Project Context**
- Klaro product overview
- Design specifications references
- Phase 1 specific objectives

✅ **Step-by-Step Checklist**
- 10 numbered objectives
- 40+ individual tasks
- Verification steps at each stage

✅ **Design Reference**
- Colors with hex codes
- Typography specifications
- Spacing scale
- Responsive breakpoints
- Accessibility requirements

✅ **Technology Stack**
- Confirmed tool versions
- Configuration details
- Package manager (pnpm)
- Deployment target (Vercel)

✅ **Constraints & Requirements**
- DO's for proper development
- DON'Ts to avoid
- Accessibility compliance
- Git workflow

✅ **Success Criteria**
- Phase 1 completion checklist
- Verification requirements
- Ready for Phase 2 conditions

---

## 🚀 Example Usage

**Copy the entire prompt and paste into Copilot:**

```
[Paste entire prompt from above]
```

**The AI agent will:**

1. Acknowledge understanding
2. Ask: "Should I proceed with Phase 1 Project Setup?"
3. Start with objective 1 (PROJECT INITIALIZATION)
4. Guide through each step
5. Verify completion
6. Move to next objective
7. Report final status

**Example AI Response:**
```
I understand! I'm setting up the Klaro website frontend for Phase 1.

Let me start with OBJECTIVE 1: PROJECT INITIALIZATION

Step 1: Are you working with:
□ Existing monorepo (already has Next.js app set up)?
□ New project (need to initialize from scratch)?
□ Fresh clone from GitHub?

Please confirm, then I'll proceed with:
- Verifying Node.js 18+
- Installing dependencies with pnpm
- Checking monorepo configuration

Once confirmed, I'll guide through all 10 objectives with verification steps...
```

---

## 📚 Integration with Design Documents

The prompt automatically references:
- `docs/UI_UX_DESIGN_GUIDE.md` ← Design system, components, colors, typography
- `docs/VISUAL_DESIGN_REFERENCE.md` ← Mockups, layouts, interactions
- `docs/FRONTEND_DEVELOPMENT_ROADMAP.md` ← Context, timeline, success criteria
- `docs/ENV_CONFIG.md` ← Environment configuration

The AI agent will know to check these files when needed.

---

## ✅ Phase 1 Completion Checklist

When the AI agent reports completion, verify:

- [ ] Next.js dev server runs: `npm run dev` (no errors)
- [ ] TypeScript compilation passes: `npm run build` (no errors)
- [ ] Linting passes: `npm run lint` (no errors)
- [ ] Design tokens in CSS (test with Tailwind class)
- [ ] Component imports work (test from packages/ui/)
- [ ] Git commits show Phase 1 progress
- [ ] Team can clone and run project
- [ ] Ready for Phase 2

---

**Status:** 🚀 Ready to Copy & Paste  
**Date:** May 3, 2026  
**Target:** Klaro Website Frontend - Phase 1  
**Timeline:** Complete by end of Day 1
