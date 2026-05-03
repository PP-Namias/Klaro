# Klaro Website – Visual Design Reference

**Purpose:** Quick visual reference for landing page and auth flows  
**Version:** 1.0  
**Date:** May 3, 2026

---

## Page Layout Map

### Landing Page Visual Hierarchy

```
╔════════════════════════════════════════════════════════════════════╗
║                           HEADER/NAV                              ║
║  [Klaro Logo]  [Home] [Features] [Security] [Blog]  [Sign In] CTA ║
╚════════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────────┐
│                      1. HERO SECTION                               │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐│
│  │ Headline                │  │                                  ││
│  │ "Understand Your        │  │    Doctor with stethoscope +     ││
│  │ Medical Documents.      │  │    document + light rays         ││
│  │ Instantly."             │  │    (animated glow effect)        ││
│  │                         │  │                                  ││
│  │ Subheading text...      │  │                                  ││
│  │                         │  │                                  ││
│  │ [Get Started] [Learn]   │  │                                  ││
│  └─────────────────────────┘  └──────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                   2. FEATURES SECTION (Cards)                      │
│                                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ 📷 Scan &     │  │ 💬 Understand │  │ 🗺️ Find       │         │
│  │ Analyze       │  │ in Your       │  │ Nearby Care   │         │
│  │               │  │ Language      │  │               │         │
│  │ Description   │  │ Description   │  │ Description   │         │
│  │ > Explore     │  │ > See Example │  │ > View Map    │         │
│  └───────────────┘  └───────────────┘  └───────────────┘         │
│                                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ 📅 Book &     │  │ 🔐 Secure     │  │ 📊 Your       │         │
│  │ Pay           │  │ Sharing       │  │ Health        │         │
│  │               │  │               │  │ History       │         │
│  │ Description   │  │ Description   │  │ Description   │         │
│  │ > Browse      │  │ > Learn More  │  │ > Get Started │         │
│  └───────────────┘  └───────────────┘  └───────────────┘         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│               3. SECURITY & TRUST SECTION                          │
│  ┌──────────────────┐      ┌──────────────────────────────────┐   │
│  │ 🔒 Lock icon     │      │ "Your Health Data is Private     │   │
│  │    + flag        │      │ & Secure"                        │   │
│  │                  │      │                                  │   │
│  │                  │      │ ✓ End-to-end encryption         │   │
│  │                  │      │ ✓ Complies with regulations     │   │
│  │                  │      │ ✓ No data shared without consent │   │
│  │                  │      │ ✓ Regular security audits       │   │
│  │                  │      │                                  │   │
│  │                  │      │ Badge: "ISO 27001 Ready"        │   │
│  └──────────────────┘      └──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│             4. SOCIAL PROOF SECTION (Testimonials)                 │
│                                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │ ⭐⭐⭐⭐⭐    │ │ ⭐⭐⭐⭐⭐    │ │ ⭐⭐⭐⭐⭐    │                │
│  │ "Finally I  │ │ "The AI     │ │ "My doctor │                │
│  │ understand  │ │ chat is so  │ │ loved this │                │
│  │ my lab      │ │ helpful."   │ │ tool!"     │                │
│  │ results!"   │ │             │ │             │                │
│  │             │ │ Maria Santos│ │ Juan Dela  │                │
│  │ Maria S.    │ │ Patient,    │ │ Cruz       │                │
│  │ Patient,    │ │ Manila      │ │ Doctor,    │                │
│  │ Cebu        │ │             │ │ QC         │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│              5. CALL-TO-ACTION SECTION (Gradient)                  │
│                                                                    │
│             "Ready to Understand Your Health?"                    │
│             "Start with a free scan. No credit card required."    │
│                                                                    │
│              [Get Started Now] (white button)                     │
│                                                                    │
│             "Join thousands of Filipinos taking control..."      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         FOOTER                                     │
│  [Klaro]          [Product]      [Company]      [Legal]           │
│  Understanding    Features       About          Privacy           │
│  healthcare       Pricing        Blog           Terms             │
│  together         Security       Careers        Contact           │
│                                                                    │
│  [Social Icons: Facebook, Twitter, LinkedIn, Instagram]          │
│                                                                    │
│  © 2026 Klaro. All rights reserved.                               │
└────────────────────────────────────────────────────────────────────┘
```

---

## Login Page Layout (Desktop)

```
════════════════════════════════════════════════════════════════════
                    Blue gradient background
                  (Primary Blue to light blue)

                     ┌──────────────────────────┐
                     │                          │
                     │   [Klaro Logo 24x24]    │
                     │                          │
                     │ Welcome Back to Klaro    │  ← H3
                     │ Sign in to your account  │  ← Body Small, gray
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │ 🔵 Sign in with      │ │  ← Button, 48px height
                     │ │     Google           │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │ 🟣 Sign in with      │ │  ← Button, 48px height
                     │ │     Discord          │ │  ← Discord purple
                     │ └──────────────────────┘ │
                     │                          │
                     │        – OR –            │  ← Divider
                     │                          │
                     │ Email Address            │  ← Label
                     │ ┌──────────────────────┐ │
                     │ │ user@example.com     │ │  ← Input, md radius
                     │ └──────────────────────┘ │
                     │                          │
                     │ Password                 │  ← Label
                     │ ┌──────────────────────┐ │
                     │ │ •••••••• [👁️ toggle]│ │  ← Input, show/hide
                     │ └──────────────────────┘ │
                     │                          │
                     │ ☐ Remember me     [Forgot?] │  ← Checkbox + link
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │   Sign In            │ │  ← Button, primary
                     │ │ (or spinner loading) │ │  ← 48px height
                     │ └──────────────────────┘ │
                     │                          │
                     │ Don't have an account?   │  ← Body Small
                     │ Sign up >>> (link)       │
                     │                          │
                     └──────────────────────────┘
                          White card
                         Shadow: lg
                     Max-width: 400px

════════════════════════════════════════════════════════════════════
```

---

## Sign-Up Page Layout (Desktop)

```
════════════════════════════════════════════════════════════════════
                   Light Gray background (mobile)

                     ┌──────────────────────────┐
                     │                          │
                     │   [Klaro Logo 24x24]    │
                     │                          │
                     │ Create Your Klaro        │  ← H3
                     │ Account                  │
                     │ Join our health community│  ← Body Small, gray
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │ 🔵 Sign up with      │ │  ← Button
                     │ │     Google           │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │ 🟣 Sign up with      │ │  ← Button
                     │ │     Discord          │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │        – OR –            │
                     │                          │
                     │ Full Name                │
                     │ ┌──────────────────────┐ │
                     │ │ John Dela Cruz       │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ Email Address            │
                     │ ┌──────────────────────┐ │
                     │ │ john@example.com     │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ Password                 │
                     │ ┌──────────────────────┐ │
                     │ │ •••••••• [👁️ toggle]│ │
                     │ └──────────────────────┘ │
                     │ ████░░░░░░ Moderate     │  ← Strength indicator
                     │                          │
                     │ Confirm Password         │
                     │ ┌──────────────────────┐ │
                     │ │ •••••••• [👁️ toggle]│ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ ☐ I agree to Terms of    │  ← Checkbox
                     │   Service and Privacy    │
                     │   Policy                 │
                     │                          │
                     │ ┌──────────────────────┐ │
                     │ │ Create Account       │ │
                     │ └──────────────────────┘ │
                     │                          │
                     │ Already have an account? │
                     │ Sign in >>> (link)       │
                     │                          │
                     └──────────────────────────┘
                          White card
                       Max-width: 400px

════════════════════════════════════════════════════════════════════
```

---

## Mobile Responsive View (< 641px)

### Landing Page Mobile

```
┌──────────────────────────────┐
│ [☰] Klaro           [Sign In] │  ← Header with hamburger menu
├──────────────────────────────┤
│                              │
│    HERO SECTION              │
│ "Understand Your Medical     │
│ Documents. Instantly."       │
│                              │
│ [Subheading text]            │
│                              │
│ [Get Started Button]         │
│ [Learn More (outlined)]      │
│                              │
│ ┌──────────────────────────┐ │
│ │  Doctor with document    │ │
│ │  (full width image)      │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│  FEATURES SECTION            │
│  (Single column stack)       │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📷 Scan & Analyze        │ │
│ │ Description text...      │ │
│ │ > Explore                │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 💬 Understand in Your    │ │
│ │    Language              │ │
│ │ Description text...      │ │
│ │ > See Example            │ │
│ └──────────────────────────┘ │
│                              │
│ [... 4 more cards stacked]   │
│                              │
├──────────────────────────────┤
│  SECURITY SECTION            │
│                              │
│ 🔒 [Icon centered]           │
│                              │
│ "Your Health Data is Private │
│ & Secure"                    │
│                              │
│ ✓ End-to-end encryption     │
│ ✓ Complies with regulations │
│ ✓ No data shared            │
│ ✓ Regular security audits   │
│                              │
├──────────────────────────────┤
│  TESTIMONIALS (Carousel)     │
│                              │
│ ← [Card 1] [Card 2] [Card 3] →│
│                              │
│ (Horizontal scrollable)      │
│                              │
├──────────────────────────────┤
│  CTA SECTION (Gradient)      │
│                              │
│ "Ready to Understand Your    │
│ Health?"                     │
│                              │
│ [Get Started Now Button]     │
│                              │
├──────────────────────────────┤
│  FOOTER                      │
│ [Klaro]                      │
│ [Product] [Company] [Legal]  │
│ (Each as collapsible section)│
│                              │
│ © 2026 Klaro                 │
└──────────────────────────────┘
```

### Login Mobile

```
┌──────────────────────────────┐
│ Klaro              [Sign Up ▶] │  ← Minimal header
├──────────────────────────────┤
│                              │
│   Light Gray background      │
│                              │
│ ┌──────────────────────────┐ │
│ │  Card (white, 90% width) │ │
│ │  with 16px margin        │ │
│ │                          │ │
│ │  [Klaro Logo 20x20]      │ │
│ │                          │ │
│ │  Welcome Back to Klaro   │ │ ← H3, smaller on mobile
│ │  Sign in to account      │ │ ← Body Small
│ │                          │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ 🔵 Sign in with      │ │ │ ← Full width button
│ │ │     Google           │ │ │ ← 44px height (touch target)
│ │ └──────────────────────┘ │ │
│ │                          │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ 🟣 Sign in with      │ │ │
│ │ │     Discord          │ │ │
│ │ └──────────────────────┘ │ │
│ │                          │ │
│ │      – OR –              │ │
│ │                          │ │
│ │ Email Address            │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ [input field]        │ │ │ ← 16px+ font (prevents zoom)
│ │ └──────────────────────┘ │ │
│ │                          │ │
│ │ Password                 │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ [input field]        │ │ │ ← show/hide toggle
│ │ └──────────────────────┘ │ │
│ │                          │ │
│ │ ☐ Remember me            │ │
│ │      [Forgot password?]  │ │ ← Link right-aligned
│ │                          │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ Sign In              │ │ │ ← 48px height
│ │ └──────────────────────┘ │ │
│ │                          │ │
│ │ Don't have account?      │ │
│ │ Sign up >>> (link)       │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

---

## Color Usage in UI

### Primary Actions
```
Button: Primary Blue (#2563EB)
Text: White
Icon: Left-aligned (if present)
Hover: Darker blue (#1D4ED8)
Example: "Get Started", "Sign In", "Submit"
```

### Secondary Actions
```
Button: Bordered Primary Blue
Text: Primary Blue (#2563EB)
Background: White (transparent on hover)
Hover: Light blue background (#F0F9FF)
Example: "Learn More", "Cancel", "Skip"
```

### Error States
```
Border: Danger Red (#EF4444)
Icon: Red warning icon
Text: "This field is required" (Caption, red)
Background: Light red tint (optional)
```

### Success States
```
Checkmark icon: Success Green (#10B981)
Text: "Account created successfully"
Toast notification: Green background with white text
```

### Medical Severity Indicators
```
Normal value: Green (#10B981) ✓
Caution: Yellow/Orange (#FBBF24) ⚠️
Alert: Orange (#F59E0B) ⚠️
Critical: Red (#DC2626) 🚨
```

---

## Animation & Interaction Guide

### Hover Effects
- Buttons: 2px scale increase, 100ms transition
- Cards: Shadow upgrade (sm → md), 300ms transition
- Links: Underline appears, color shifts
- No motion: Respect `prefers-reduced-motion` CSS media query

### Loading States
- Show spinner (circular rotating icon)
- Disable all buttons
- Change button text to "Loading..."
- Optional: progress bar for longer operations

### Form Validation
- On blur: Real-time validation, error message appears
- Error icon: Small red icon right side of input
- Focus state: 2px blue border, shadow activated
- Disabled state: Gray background, cursor not-allowed

### Toast Notifications
- Success: Green background, white text, checkmark icon
- Error: Red background, white text, X icon
- Info: Blue background, white text, info icon
- Position: Top-right (desktop), bottom-center (mobile)
- Auto-dismiss: 3-5 seconds (unless error)

---

## Breakpoint-Specific Behavior

### Desktop (1025px+)
- Hero: Side-by-side layout (50/50)
- Features: 3-column grid
- Navigation: Horizontal bar
- Footer: 4-column grid
- Modals: 600px width, centered

### Tablet (641px – 1024px)
- Hero: Stacked, text left-aligned
- Features: 2-column grid
- Navigation: Hamburger menu
- Footer: 2-column grid
- Modals: 90% width

### Mobile (< 641px)
- Hero: Stacked, text centered, image 80% width
- Features: 1-column grid
- Navigation: Hamburger menu (drawer)
- Footer: 1-column, collapsible sections
- All full-width buttons (100% with margin)
- Touch targets: 44px+ height

---

## Accessibility Checklist

### Color & Contrast
- ✓ All text passes 4.5:1 contrast ratio
- ✓ Color not used alone to convey meaning
- ✓ Medical severity levels use both color + icons

### Keyboard Navigation
- ✓ Tab order logical (top-left → bottom-right)
- ✓ Focus indicator visible (2px blue border, rounded)
- ✓ All buttons, links, inputs keyboard-accessible
- ✓ Escape key closes modals

### Screen Reader
- ✓ All images have descriptive `alt` text
- ✓ Buttons have `aria-label` if icon-only
- ✓ Form labels associated with inputs
- ✓ Error messages tied to inputs via `aria-describedby`

### Forms
- ✓ Password strength announced via `aria-live`
- ✓ Required fields marked with `aria-required` + asterisk
- ✓ Form validation happens on blur (not blocking)

### Mobile
- ✓ Touch targets 48x48px minimum
- ✓ Font size 16px+ (prevents iOS zoom)
- ✓ No horizontal scrolling
- ✓ Viewport meta tag set correctly

---

## Testing Scenarios

### User Journey Testing

**Scenario 1: First-Time Guest User**
- [ ] Load landing page
- [ ] Scroll through features
- [ ] Click "Get Started"
- [ ] Redirect to login
- [ ] Click "Sign up"
- [ ] Create account with email
- [ ] Verify email
- [ ] Land on dashboard

**Scenario 2: Existing User Login**
- [ ] Load landing page
- [ ] Click "Sign In"
- [ ] Enter email + password
- [ ] See "Remember me" works
- [ ] Land on dashboard
- [ ] Session persists on refresh

**Scenario 3: Google OAuth**
- [ ] Click "Sign in with Google"
- [ ] Google consent screen
- [ ] Grant permissions
- [ ] Callback works
- [ ] Session created
- [ ] Land on dashboard

**Scenario 4: Discord OAuth**
- [ ] Click "Sign in with Discord"
- [ ] Discord consent screen
- [ ] Grant permissions
- [ ] Callback works
- [ ] Session created
- [ ] Land on dashboard

**Scenario 5: Password Recovery**
- [ ] Click "Forgot password?"
- [ ] Enter email
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Set new password (with strength indicator)
- [ ] Redirect to login
- [ ] Sign in with new password

### Error Scenarios

**Invalid Email**
- [ ] Show "Please enter a valid email" error
- [ ] Button disabled until fixed

**Weak Password**
- [ ] Show strength indicator
- [ ] Show requirements not met
- [ ] Prevent submission if < 8 chars

**Account Exists**
- [ ] Show "Email already registered"
- [ ] Show "Sign in instead >" link

**Network Error**
- [ ] Show "Connection failed"
- [ ] Show retry button
- [ ] Don't lose form data

**OAuth Denied**
- [ ] Show "Access denied"
- [ ] Show "Try again or sign up with email" option

---

## Performance & SEO Targets

### Lighthouse Metrics (Target: 90+)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Image Optimization
- Hero image: < 200KB (WebP format)
- Icons: SVG (no raster)
- Lazy load: Below-fold images

### Font Loading
- Google Fonts: Preload woff2 format
- Font-display: swap (show fallback immediately)
- Subset: Latin only (optimize for Filipino browsers)

---

## Next Steps for Developer

1. **Setup:** Clone repo, install dependencies (pnpm)
2. **Design:** Review Figma mockups (link TBD)
3. **Components:** Build UI library components (button, input, card)
4. **Pages:** Implement landing page, login, signup
5. **Auth:** Integrate NextAuth.js with Google + Discord
6. **Testing:** Manual QA + accessibility audit
7. **Deployment:** Vercel (Next.js)

---

**Status:** ✅ Design-Ready for Development  
**Review Date:** Before Phase 2 starts  
**Questions?** Refer to UI_UX_DESIGN_GUIDE.md for detailed specifications
