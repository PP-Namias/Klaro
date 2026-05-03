# Klaro Frontend AI Agent - Next Steps Guide

Copy and paste the section below into your AI agent prompt to continue building the Klaro frontend.

---

## AGENT PROMPT: Continue Klaro Frontend Development

```
You are an expert frontend developer continuing the Klaro website frontend implementation.

PROJECT STATUS
==============
COMPLETED:
- Landing page (/page.tsx)
- Login page (/login/page.tsx)
- Dashboard page (/dashboard/page.tsx)
- Scan page (/scan/page.tsx)
- Sign-up page (/signup/page.tsx)
- Forgot-password page (/forgot-password/page.tsx)
- Reset-password page (/reset-password/page.tsx)

NEXT TASKS (In order of priority)
=================================
Task 1: Build 404 Error Page
  Location: apps/nextjs/src/app/not-found.tsx + not-found.module.css
  Requirements:
    - Show when user navigates to non-existent route
    - Use same premium styling as other pages
    - Include navigation back to dashboard/home
    - Keep calm clinical tone
    - Show error code 404
    - Guest/auth visibility consistent with other pages

Task 2: Build 500 Server Error Page
  Location: apps/nextjs/src/app/error.tsx + error.module.css
  Requirements:
    - Show on server-side errors
    - Explain error in plain language
    - Include retry button
    - Link to help/support
    - Same premium design system
    - Reassure about data safety

Task 3: Build Auth Error Handler
  Location: apps/nextjs/src/app/auth/error/page.tsx (already exists, check for enhancement)
  Requirements:
    - Handle OAuth failures
    - Show error message in plain language
    - Provide retry option
    - Link back to login
    - Maintain brand consistency

Task 4: Test All Routes
  - Verify all pages load without errors
  - Check responsive design (mobile/tablet/desktop)
  - Test navigation flows
  - Verify form interactions work

IMPLEMENTATION STYLE
====================
For each new page:
1. Create page.tsx in appropriate route folder
2. Create page.module.css with BEM-style class names
3. Use same design tokens and premium aesthetic
4. Include session check if needed (auth state awareness)
5. Add guest/auth paths visibility
6. Ensure responsive breakpoints (0-640px, 641-1024px, 1025px+)
7. Keep typography calm and clinical
8. Use glassmorphism effects with subtle gradients

CODE STRUCTURE
==============
- Import Link, Button from @klaro/ui
- Import getSession from ~/auth/server (if needed)
- Use async component pattern
- Add metadata export for SEO
- CSS Module with scoped classes
- Grid/flex layouts for responsive
- Color tokens via CSS variables

ACCESSIBILITY
==============
- Color contrast 4.5:1 (normal), 3:1 (large)
- Touch targets minimum 48x48px
- Keyboard navigation logical
- Semantic HTML (proper headings, landmarks)
- ARIA labels where needed
- Alt text for images
- Focus visible on interactive elements

DESIGN CONSISTENCY
==================
Color Palette (CSS Variables):
- Primary: var(--primary)
- Secondary: var(--secondary)
- Accent: var(--accent)
- Background: var(--background)
- Card: var(--card)
- Foreground: var(--foreground)
- Muted-foreground: var(--muted-foreground)

Typography Scale:
- H1: clamp(3rem, 7.5vw, 6rem)
- H2: clamp(2rem, 5vw, 4rem)
- Body: 1rem with line-height 1.5-1.65
- Eyebrow: 0.82rem uppercase

Spacing (8px base):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

Responsive Breakpoints:
- Mobile: 0-640px (1 column, burger menu)
- Tablet: 641-1024px (2 columns)
- Desktop: 1025px+ (3+ columns, full nav)

Border Radius:
- sm: 0.5rem
- md: 1rem
- lg: 1.5rem
- full: 999px (for buttons)

COMMITMENT GUIDELINES
=====================
After each page/feature:
1. Run get_errors validation
2. Commit with plain-English one-line message
3. Message format: "Add [page name] with [description]"
4. Each file separate: "Add [filename] for [component]"
5. Update todo list progress
6. Verify responsive layout (test at 3 breakpoints)

TESTING FLOW
============
Per page:
1. Visual: Check desktop, tablet, mobile layouts
2. Interaction: Verify links work, forms interactive
3. Accessibility: Tab through, check contrast
4. Error handling: Show/hide auth state correctly
5. Copy: Read all text for clarity, tone match

SUCCESS CRITERIA
================
A page is complete when:
- No TypeScript/lint errors
- Responsive at all breakpoints
- Guest/auth paths visible
- Consistent with design system
- Accessibility checklist pass
- Plain-English plain language copy
- Committed with clear message

FINAL CHECKLIST (When all pages done)
=====================================
- DONE: All 7 auth/intake/error pages built
- DONE: All pages responsive (3 breakpoints tested)
- DONE: No console errors
- DONE: Accessibility audit pass
- DONE: Navigation flows work
- DONE: Form interactions functional
- DONE: Premium design consistent throughout
- DONE: All commits clean and clear

NEXT ITERATION
===============
After completing all pages above:
1. Run full accessibility audit
2. Verify Lighthouse scores
3. Test on real devices (mobile phone)
4. Optimize performance
5. Create component library extraction
6. Set up storybook for UI documentation

Remember: Build iteratively. Commit after each file. Test responsiveness early and often.
Keep tone clinical, calm, and encouraging throughout.
```

---

## How to Use This Guide

1. Copy the entire AGENT PROMPT section above (everything between the triple backticks)
2. Paste it into your next conversation with the AI agent
3. The agent will understand the project state and build the next features
4. After each feature, the agent will:
   - Validate the code
   - Commit individually with clear messages
   - Update the todo list
   - Move to the next task

## Project Completion Status

- Landing Page: COMPLETE
- Login Page: COMPLETE
- Sign-Up Page: COMPLETE
- Forgot-Password Page: COMPLETE
- Reset-Password Page: COMPLETE
- Dashboard Page: COMPLETE
- Scan Page: COMPLETE

**Remaining Pages:**
- 404 Error Page (not-found.tsx)
- 500 Server Error Page (error.tsx)
- Auth Error Handler (enhancement)
- Testing & Validation

**Total Pages to Build:** 11  
**Pages Complete:** 7  
**Completion Rate:** 64%

---

## Quick Reference: File Structure

```
apps/nextjs/src/app/
├── page.tsx (Landing) - DONE
├── page.module.css - DONE
├── login/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── signup/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── forgot-password/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── reset-password/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── dashboard/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── scan/
│   ├── page.tsx - DONE
│   └── page.module.css - DONE
├── not-found.tsx - TODO
├── not-found.module.css - TODO
├── error.tsx - TODO
├── error.module.css - TODO
└── auth/
    └── error/
        ├── page.tsx - TODO (enhance)
        └── page.module.css - TODO
```

---

## Pro Tips

1. **Iteration Loop:**
   - Build page → Validate → Commit → Move next
   - Each page: ~5-10 minutes
   - CSS module: ~10-15 minutes

2. **Responsive Testing:**
   - Test at 0-640px (mobile)
   - Test at 641-1024px (tablet)
   - Test at 1025px+ (desktop)

3. **Consistency Checks:**
   - Copy design tokens from existing pages
   - Use same gradient/shadow patterns
   - Match typography scale
   - Keep spacing rhythm

4. **Commit Messages:**
   - "Add [page name] for [purpose]"
   - "Add [page name] styles"
   - "Remove emojis from docs"
   - "Update [file] with [change]"

5. **Testing Before Moving On:**
   - Run `get_errors` on new files
   - Check responsive at 3 breakpoints
   - Verify auth state visibility
   - Test navigation links

---

## Next Command to Run

When ready to continue, copy the AGENT PROMPT section above and ask the AI:

"Please continue building the Klaro frontend. Use this plan: [PASTE AGENT PROMPT HERE]"

Or simply ask:

"Build the 404 and 500 error pages for Klaro following the same premium design pattern. Commit each file separately with plain-English messages."

---

**Status:** 7 of 11 pages complete  
**Last Updated:** May 4, 2026  
**Design System:** Premium, clinical, calm tone  
**Target:** Complete full frontend UI/UX  
