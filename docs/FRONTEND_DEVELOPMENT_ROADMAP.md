# Klaro Website Frontend – Development Roadmap

**Date:** May 3, 2026  
**Status:** 🎨 Design-Ready for Implementation  
**Focus:** Landing Page + Authentication (Design-First)

---

## 📋 What Has Been Delivered

### Design Documentation

✅ **UI/UX Design Guide** (`docs/UI_UX_DESIGN_GUIDE.md`)
- Complete design system (colors, typography, spacing, shadows, borders)
- Brand identity and messaging pillars
- Landing page section-by-section specifications
- Login page detailed layout and interactions
- Sign-up page with password strength indicator
- SSO OAuth flow diagrams (Google + Discord)
- Error states and validation rules
- Component library specifications (buttons, inputs, cards, forms)
- Responsive breakpoints and mobile-first strategy
- WCAG 2.1 AA accessibility standards
- User flows (registration, login, guest scan, password recovery)
- Implementation checklist for 5 phases
- Design resources (Figma, icons, fonts, stock photos)

✅ **Visual Design Reference** (`docs/VISUAL_DESIGN_REFERENCE.md`)
- ASCII mockups of all page layouts
- Desktop, tablet, and mobile responsive views
- Hero section visual hierarchy
- Feature cards layout (6 features in 3-column grid)
- Security & trust section design
- Social proof/testimonials carousel
- CTA section with gradient background
- Footer navigation structure
- Login page desktop and mobile layouts
- Sign-up page layouts
- Color usage reference for UI elements
- Animation and interaction guidelines
- Breakpoint-specific behavior patterns
- Accessibility checklist
- Testing scenarios (5 user journeys + error cases)
- Performance targets (Lighthouse metrics, Core Web Vitals)

---

## 🎯 Key Design Decisions

### Color System
- **Primary Blue:** `#2563EB` - trustworthy, used for CTAs and primary actions
- **Success Green:** `#10B981` - positive feedback and normal medical values
- **Warning Orange:** `#F59E0B` - caution states and alerts
- **Danger Red:** `#EF4444` - critical alerts and errors
- **Neutral Grays:** Hierarchy for text, borders, and backgrounds
- **Accent Teal:** `#06B6D4` - secondary highlights (Filipino cultural warmth)

### Typography
- **Font:** Inter + system sans-serif fallback (optimized for Filipino devices)
- **Hierarchy:** 7-level system (H1 48px → Caption 12px)
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Spacing System
- **8px base unit** for consistency
- **7 spacing levels:** xs (4px) through 3xl (64px)
- **Apply throughout:** Padding, margins, gaps, component sizing

### Brand Voice
- **Approachable** - simple, jargon-free language
- **Trustworthy** - confidence in medical context
- **Helpful** - guide users without overwhelming
- **Filipino-centric** - celebrate local healthcare context

---

## 🏗️ Landing Page Structure

### 6 Main Sections

1. **Hero Section** (600px height)
   - Split layout on desktop (text left, imagery right)
   - Headline: "Understand Your Medical Documents. Instantly."
   - Subheading with feature overview
   - 2 CTAs: "Get Started" (primary) + "Learn More" (secondary)
   - Animated doctor/document image (glow effect)

2. **Features Section** (6 feature cards in 3x2 grid)
   - Scan & Analyze
   - Understand in Your Language
   - Find Nearby Care
   - Book Licensed Doctors
   - Secure Sharing
   - Your Health History
   - Cards have hover effect (shadow + scale)

3. **Security & Trust Section**
   - Image left, text right layout
   - 4 trust bullets with checkmarks
   - "ISO 27001 Ready" badge
   - Emphasizes privacy and compliance

4. **Social Proof Section** (Testimonials carousel)
   - 5-star ratings
   - User quotes
   - Avatar + name + title
   - Scrollable on mobile, 3-visible on desktop

5. **Call-to-Action Section** (Gradient background)
   - Blue gradient background
   - White text
   - Single strong CTA: "Get Started Now"
   - Supporting text: "Join thousands of Filipinos..."

6. **Footer** (4-column on desktop)
   - Klaro branding section
   - Product links
   - Company links
   - Legal links
   - Social media icons
   - Copyright notice

---

## 🔐 Authentication Pages

### Login Page (/login)
- **Layout:** Centered white card (400px max-width) on gradient background
- **SSO Options:** Google + Discord (prominent buttons, full-width)
- **Divider:** "– OR –" for email/password section
- **Form Fields:** Email + Password inputs with proper styling
- **Checkbox:** "Remember me" functionality
- **Link:** "Forgot password?" (right-aligned)
- **CTA:** Primary "Sign In" button (48px height)
- **Footer:** "Don't have an account? Sign up >" link

### Sign-Up Page (/signup)
- **Same card layout** as login for consistency
- **SSO Options:** Google + Discord buttons
- **Form Fields:** Full name + Email + Password + Confirm password
- **Password Strength:** Visual indicator (weak/moderate/strong)
- **Checkbox:** Terms & Privacy Policy agreement
- **CTA:** "Create Account" button
- **Footer:** "Already have an account? Sign in >" link

### OAuth Flows
- **Google OAuth:** Redirect → consent → callback → session → dashboard
- **Discord OAuth:** Redirect → consent → callback → session → dashboard
- **Error handling:** Timeout, denied access, network errors with user messaging

---

## 📱 Responsive Design

### Breakpoints
- **Mobile:** 0–640px (hamburger menu, single-column layout)
- **Tablet:** 641–1024px (2-column grids, drawer menu)
- **Desktop:** 1025px+ (3-column grids, horizontal nav)

### Key Responsive Behaviors
- **Hero:** Stacked on mobile, side-by-side on desktop
- **Features:** 1 column → 2 columns → 3 columns
- **Navigation:** Drawer (mobile) → horizontal bar (desktop)
- **Footer:** 1 column → 2 columns → 4 columns
- **All buttons:** 100% width on mobile with 16px margins
- **Touch targets:** 48px+ height for accessibility

---

## ♿ Accessibility (WCAG 2.1 AA)

✅ **Color Contrast**
- Normal text: 4.5:1 ratio minimum
- Large text (18px+): 3:1 ratio minimum
- UI components: 3:1 ratio minimum

✅ **Keyboard Navigation**
- Tab order logical (top-left → bottom-right)
- Focus indicator visible (2px blue border)
- Escape key closes modals
- All interactive elements keyboard-accessible

✅ **Forms**
- Labels associated with inputs
- Error messages tied via `aria-describedby`
- Required fields marked with `aria-required` + asterisk
- Password strength announced via `aria-live`

✅ **Images & Icons**
- Descriptive `alt` text on all images
- Icons paired with text (no icon-only buttons)
- SVG icons include `<title>` elements

✅ **Mobile Accessibility**
- Touch targets 48x48px minimum
- Font size 16px+ (prevents iOS auto-zoom)
- No horizontal scrolling
- Proper viewport meta tag

---

## 🚀 Development Phase Breakdown

### Phase 1: Project Setup (Day 1)
- [ ] Clone monorepo, install dependencies
- [ ] Review design guide and Figma mockups
- [ ] Set up Next.js app structure
- [ ] Configure Tailwind CSS with design tokens
- [ ] Set up repository folder structure

### Phase 2: Component Library (Day 1-2)
- [ ] Create reusable button component (primary, secondary, tertiary)
- [ ] Create input field component (text, email, password)
- [ ] Create card component (feature card, testimonial card)
- [ ] Create form group component (label + input + error)
- [ ] Create badge and tag components
- [ ] Create modal/dialog component
- [ ] Create toast/notification component
- [ ] Export component storybook or living guide

### Phase 3: Landing Page (Day 2-3)
- [ ] Build header/navigation (desktop + mobile responsive)
- [ ] Implement hero section with gradient and CTA buttons
- [ ] Build feature cards section (6 cards, grid layout)
- [ ] Implement security & trust section
- [ ] Build testimonials carousel (horizontal scroll on mobile)
- [ ] Create CTA section with gradient background
- [ ] Build footer with multi-column layout
- [ ] Add animations (hover effects, scrolling effects)
- [ ] Implement responsive breakpoints (test on mobile/tablet/desktop)

### Phase 4: Authentication Pages (Day 3-4)
- [ ] Create login page (/login)
- [ ] Create sign-up page (/signup)
- [ ] Create forgot-password page (/forgot-password)
- [ ] Create reset-password page (/reset-password?token=xxx)
- [ ] Implement form validation (real-time, on blur)
- [ ] Build error state displays (invalid email, weak password, etc.)
- [ ] Add loading states (spinner on submit)
- [ ] Implement password strength indicator

### Phase 5: NextAuth.js Integration (Day 4)
- [ ] Install and configure NextAuth.js
- [ ] Set up Google OAuth provider (get credentials)
- [ ] Set up Discord OAuth provider (get credentials)
- [ ] Create callback handlers (/api/auth/callback/google, etc.)
- [ ] Implement session management (HttpOnly cookies)
- [ ] Create user database schema (if using session DB)
- [ ] Test OAuth flows end-to-end

### Phase 6: Testing & QA (Day 5)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] Form validation testing (all error states)
- [ ] OAuth flow testing (Google + Discord)
- [ ] Password reset flow testing
- [ ] Lighthouse audit (target: 90+ all metrics)

### Phase 7: Performance & Deploy (Day 5)
- [ ] Image optimization (WebP, lazy loading)
- [ ] CSS/JS minification
- [ ] Font loading optimization
- [ ] SEO metadata (title, description, og tags)
- [ ] Deploy to Vercel
- [ ] Verify production build
- [ ] Monitor for errors (Sentry/similar)

---

## 📦 Technology Stack

### Frontend Framework
- **Next.js 14** with App Router
- **React 18+**
- **TypeScript** (strict mode)

### Styling
- **Tailwind CSS 3+** with design tokens
- **PostCSS** for processing

### Authentication
- **NextAuth.js 4+** with Google + Discord OAuth providers
- **HttpOnly cookies** for session management

### UI Components
- **Shadcn/ui** foundation (already in repo)
- **Radix UI** primitives for accessibility
- **React Hook Form** for form handling
- **Zod** for validation

### Utilities
- **clsx/classnames** for conditional CSS classes
- **next/image** for image optimization
- **next/font** for font optimization
- **ESLint + Prettier** for code quality

### Testing
- **Jest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests (optional for Phase 1)

---

## ✅ Success Criteria

### Functional Requirements
- ✅ Landing page loads and all sections visible
- ✅ Responsive on mobile (640px), tablet (1024px), and desktop
- ✅ All CTAs link to correct pages
- ✅ Login page form validates email and password
- ✅ Sign-up page form validates all fields
- ✅ Google OAuth flow works end-to-end
- ✅ Discord OAuth flow works end-to-end
- ✅ Forgot password flow sends reset email
- ✅ Password reset form updates password correctly
- ✅ Session persists on page refresh

### Performance Requirements
- ✅ Lighthouse Performance score: 90+
- ✅ Lighthouse Accessibility score: 95+
- ✅ Lighthouse Best Practices: 90+
- ✅ Lighthouse SEO: 95+
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ FID (First Input Delay): < 100ms
- ✅ CLS (Cumulative Layout Shift): < 0.1

### Accessibility Requirements
- ✅ WCAG 2.1 AA compliant
- ✅ All interactive elements keyboard-accessible
- ✅ Focus indicators visible
- ✅ Form labels properly associated
- ✅ Color contrast meets minimum ratios
- ✅ Screen reader tested
- ✅ Mobile touch targets 48x48px+
- ✅ No horizontal scrolling on mobile

### Browser/Device Support
- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ iOS Safari (latest)
- ✅ Android Chrome (latest)

---

## 🔗 Reference Files

### Design Documentation
1. [UI_UX_DESIGN_GUIDE.md](./UI_UX_DESIGN_GUIDE.md) - Detailed design system and specifications
2. [VISUAL_DESIGN_REFERENCE.md](./VISUAL_DESIGN_REFERENCE.md) - ASCII mockups and visual guidelines

### Product Documentation
1. [prd.json](../prd.json) - Product requirements and feature specifications
2. [README.md](../README.md) - Project overview
3. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - 5-day MVP implementation plan

### Existing Codebase
- **Next.js app:** `apps/nextjs/`
- **UI components:** `packages/ui/`
- **Database:** `packages/db/`
- **Validators:** `packages/validators/`

---

## 📝 Notes for Implementation Team

### Design Quality First
- Review all design specifications before starting implementation
- Use Figma mockups as reference (link to be provided by design team)
- Follow design tokens for colors, spacing, typography
- Test designs on actual devices throughout implementation

### Code Organization
- Keep components in `packages/ui/` for reusability
- Styles in `src/app/globals.css` and component files
- Use Tailwind CSS utility classes (no custom CSS unless necessary)
- Follow Next.js App Router conventions

### Testing Strategy
- Unit test components with React Testing Library
- E2E test critical user flows (login, signup, OAuth)
- Accessibility testing with axe-core or similar
- Manual testing on mobile devices (real devices, not just emulators)

### Git Workflow
- Feature branches: `feature/landing-page`, `feature/auth-pages`
- Commit messages: Clear, descriptive (no conventional commits prefixes)
- PRs: Include screenshots of changes
- Review checklist: Accessibility, responsive design, performance

### Performance Considerations
- Lazy load images below the fold
- Use Next.js Image component for optimization
- Preload critical fonts
- Minimize JavaScript bundle size
- Cache static assets aggressively

### Security Considerations
- Use environment variables for OAuth credentials
- HttpOnly cookies for session management
- CSRF protection via NextAuth.js
- Content Security Policy headers
- Input sanitization on forms

---

## 🎉 Deliverables Summary

This design-first approach ensures:

✅ **Clear specifications** before a single line of code  
✅ **Accessibility-first** design that includes WCAG 2.1 AA compliance  
✅ **Mobile-responsive** layouts for all breakpoints  
✅ **Professional UI/UX** with proper visual hierarchy and interactions  
✅ **Complete component library** specifications for reusability  
✅ **User flow documentation** for authentication journeys  
✅ **Testing criteria** for QA validation  
✅ **Performance targets** aligned with industry standards  

---

## 🚀 Next Steps

1. **Design Team:** Create Figma mockups based on this guide
2. **Engineering Lead:** Review design documents and prepare architecture
3. **Frontend Engineer:** Set up Next.js project with Tailwind CSS
4. **OAuth Specialist:** Set up Google + Discord OAuth credentials
5. **QA Lead:** Prepare testing checklist
6. **Project Manager:** Schedule Phase-based sprints

---

**Status:** 🎨 Ready to Start Phase 1 (Project Setup)  
**Estimated Timeline:** 5 days for MVP (landing page + auth)  
**Design Review:** Complete ✅  
**Next Review:** After Phase 1 setup is complete

**Questions?** Refer to UI_UX_DESIGN_GUIDE.md or VISUAL_DESIGN_REFERENCE.md
