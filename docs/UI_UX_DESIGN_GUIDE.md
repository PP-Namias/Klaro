# Klaro Website – UI/UX Design Guide

**Version:** 1.0  
**Date:** May 3, 2026  
**Focus:** Landing Page + Authentication (Design-First)  
**Target:** Filipino users, mobile-responsive, accessibility-first

---

## Table of Contents

1. [Design System](#design-system)
2. [Brand Identity](#brand-identity)
3. [Landing Page Design](#landing-page-design)
4. [Authentication Flow & UI](#authentication-flow--ui)
5. [Component Library](#component-library)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Accessibility Standards](#accessibility-standards)
8. [User Flows](#user-flows)

---

## Design System

### Color Palette

#### Primary Colors
| Color | Hex | Usage | Purpose |
|-------|-----|-------|---------|
| **Primary Blue** | `#2563EB` | Buttons, links, CTAs | Main action color; trustworthy for healthcare |
| **Success Green** | `#10B981` | Status indicators, positive actions | Affirmation, safety |
| **Warning Orange** | `#F59E0B` | Alerts, caution states | Medical severity levels |
| **Danger Red** | `#EF4444` | Critical alerts, errors | Urgent attention |
| **Neutral Gray** | `#6B7280` | Text, borders, secondary elements | Readability |

#### Secondary Colors
| Color | Hex | Usage | Purpose |
|-------|-----|-------|---------|
| **Light Gray** | `#F3F4F6` | Backgrounds, cards | Clean, minimal spacing |
| **Lighter Gray** | `#FAFBFC` | Page backgrounds | Very subtle contrast |
| **Dark Gray** | `#1F2937` | Primary text | High contrast readability |
| **Accent Teal** | `#06B6D4` | Highlights, secondary CTAs | Filipino cultural warmth |

#### Semantic Medical Colors
| Severity | Color | Hex | Description |
|----------|-------|-----|-------------|
| **Normal** | Green | `#10B981` | Values within range |
| **Caution** | Yellow | `#FBBF24` | Slightly elevated, monitor |
| **Alert** | Orange | `#F59E0B` | Elevated, discuss with doctor |
| **Critical** | Red | `#DC2626` | Requires immediate attention |

---

### Typography

#### Font Stack
```css
Font Family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif
Fallback: System fonts for optimal performance on Filipino devices
```

#### Font Sizes & Line Heights

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | 48px | 700 (Bold) | 56px | Page titles, hero heading |
| **H2** | 36px | 700 (Bold) | 44px | Section headers |
| **H3** | 28px | 700 (Bold) | 36px | Subsection titles |
| **Body Large** | 18px | 400 (Regular) | 28px | Feature descriptions, large text |
| **Body Normal** | 16px | 400 (Regular) | 24px | Main body text, paragraphs |
| **Body Small** | 14px | 400 (Regular) | 20px | Helper text, labels |
| **Caption** | 12px | 500 (Medium) | 16px | Meta information, footnotes |
| **Button** | 16px | 600 (Semibold) | 24px | Button labels |

#### Font Weights
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

---

### Spacing System

**Base Unit:** 8px (applies consistently across all components)

| Spacing | Pixels | Usage |
|---------|--------|-------|
| **xs** | 4px | Minimal internal spacing |
| **sm** | 8px | Small gaps, label-input spacing |
| **md** | 16px | Standard component padding |
| **lg** | 24px | Section separation |
| **xl** | 32px | Major section spacing |
| **2xl** | 48px | Hero spacing, top-level separation |
| **3xl** | 64px | Page breaks, large whitespace |

---

### Border Radius

| Size | Pixels | Usage |
|------|--------|-------|
| **sm** | 4px | Subtle rounded corners on inputs |
| **md** | 8px | Buttons, cards, standard components |
| **lg** | 12px | Large modal cards, feature cards |
| **full** | 9999px | Badges, avatar images, pill buttons |

---

### Shadows

| Level | CSS | Usage |
|-------|-----|-------|
| **sm** | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth on inputs |
| **md** | `0 4px 6px rgba(0,0,0,0.1)` | Card elevation |
| **lg** | `0 10px 25px rgba(0,0,0,0.15)` | Modal, prominent cards |
| **xl** | `0 20px 40px rgba(0,0,0,0.2)` | Hero imagery overlay |

---

## Brand Identity

### Brand Voice & Tone

**Klaro** means "clear" in Filipino. Our voice reflects this:

- **Approachable:** Use simple, jargon-free language
- **Trustworthy:** Medical context demands clarity and confidence
- **Helpful:** Guide users, don't overwhelm
- **Filipino-centric:** Celebrate local context (dialects, healthcare references, cultural sensibility)

### Messaging Pillars

1. **Clarity:** "Understand your medical documents. Instantly."
2. **Accessibility:** "Healthcare explained in your language."
3. **Care:** "Your health companion, always with you."

### Logo & Visual Identity

**Logo Placement:**
- Top-left on all pages (16x16 or 24x24px)
- Linked to home (`/`)

**Visual Metaphor:**
- Stethoscope merged with check mark (symbolizes clarity + care)
- Clean, modern, scalable vector format

---

## Landing Page Design

### Landing Page Sections (Scroll Journey)

#### 1. Hero Section
**Height:** 600px (desktop), 400px (mobile)  
**Background:** Gradient from Primary Blue (`#2563EB`) to light blue (`#93C5FD`)  
**Layout:** Split (text left, imagery right on desktop; stacked on mobile)

**Content:**
- **Headline:** "Understand Your Medical Documents. Instantly."
- **Subheading:** "Scan lab results, prescriptions, and discharge summaries. Get plain-language explanations and AI-powered guidance in your language."
- **CTA Buttons:**
  - Primary: "Get Started" → `/login` (Primary Blue, 48px height)
  - Secondary: "Learn More" → `#features` (Bordered, text-only, scroll to features)

**Visual:**
- Hero image on right: Doctor with stethoscope + medical document + light rays (positive, modern, diverse face)
- Animation: Subtle pulse or glow on image (2-3 second loop)

**Code Skeleton:**
```
<section class="hero">
  <div class="container flex flex-col md:flex-row gap-8 items-center">
    <div class="content md:w-1/2">
      <h1>Understand Your Medical Documents. Instantly.</h1>
      <p>Scan lab results, prescriptions, and discharge summaries...</p>
      <div class="cta-buttons">
        <button class="btn-primary">Get Started</button>
        <button class="btn-secondary">Learn More</button>
      </div>
    </div>
    <div class="imagery md:w-1/2">
      <img src="/hero-doctor.svg" alt="Medical document analysis" />
    </div>
  </div>
</section>
```

---

#### 2. Features Section
**Height:** Variable (600px + per feature)  
**Background:** Light Gray (`#F3F4F6`)  
**Layout:** Grid of 3 feature cards (mobile: 1 column, tablet: 2 columns, desktop: 3 columns)

**Feature Cards (3 per row on desktop):**

**Card 1: Scan & Analyze**
- Icon: Camera + Document (32x32px, Primary Blue)
- Title: "Scan & Analyze"
- Description: "Take a photo or upload documents (lab results, prescriptions, discharge summaries). AI extracts and explains findings instantly."
- Action: "Explore >" (link color, no button styling)

**Card 2: Understand in Your Language**
- Icon: Chat bubble + Language flags (32x32px, Primary Blue)
- Title: "Understand in Your Language"
- Description: "Get explanations in plain Filipino, Bisaya, Ilocano, or English. Ask follow-up questions. AI chat adapts to your dialect."
- Action: "See Example >" (link color)

**Card 3: Find Nearby Care**
- Icon: Map + Hospital (32x32px, Primary Blue)
- Title: "Find Nearby Care"
- Description: "Discover PhilHealth-accredited clinics and hospitals near you. Filter by specialty and opening hours."
- Action: "View Map >" (link color)

**Card 4: Book & Pay**
- Icon: Calendar + Stethoscope (32x32px, Primary Blue)
- Title: "Book Licensed Doctors"
- Description: "Browse and book consultations with PRC-verified Filipino doctors. Chat, video, or async reviews."
- Action: "Browse Doctors >" (link color)

**Card 5: Secure Sharing**
- Icon: Lock + Share (32x32px, Primary Blue)
- Title: "Secure Sharing"
- Description: "Share scan results securely. 30-day expiry links. Family and caregivers stay informed."
- Action: "Learn More >" (link color)

**Card 6: Your Health History**
- Icon: History + Document (32x32px, Primary Blue)
- Title: "Your Health History"
- Description: "Save and track all your medical documents. Personalized insights across your health journey."
- Action: "Get Started >" (link color)

**Card Styling:**
- Background: White
- Border: 1px solid Light Gray (`#E5E7EB`)
- Padding: 24px (md)
- Border radius: 8px (md)
- Shadow: sm
- Hover: Shadow upgrade to md, slight scale transform (1.02)
- Transition: 300ms ease-in-out

**Code Skeleton:**
```
<section id="features" class="features bg-light-gray py-16 md:py-24">
  <div class="container">
    <h2 class="text-center mb-12">Core Features</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Feature cards mapped */}
      <FeatureCard icon={ScanIcon} title="Scan & Analyze" description="..." />
      {/* ... 5 more cards */}
    </div>
  </div>
</section>
```

---

#### 3. Security & Trust Section
**Height:** 400px (desktop), 500px (mobile)  
**Background:** White  
**Layout:** Image left, text right (desktop); stacked (mobile)

**Content:**
- **Headline:** "Your Health Data is Private & Secure"
- **Bullet Points (Body Small):**
  - ✓ End-to-end encryption for all documents
  - ✓ Complies with local healthcare regulations
  - ✓ No data shared without your consent
  - ✓ Regular security audits and updates

**Visual:**
- Icon: Lock with Philippine flag
- Badge: "ISO 27001 Ready" (placeholder, update as needed)

---

#### 4. Social Proof Section
**Height:** 300px  
**Background:** Light Gray (`#F3F4F6`)  
**Layout:** Carousel of testimonials (mobile scrollable, desktop 3 visible)

**Testimonial Card Format:**
- Star rating: ⭐⭐⭐⭐⭐ (5 stars)
- Quote: "Finally, I understand my lab results! The AI chat is so helpful." (Body Small)
- Name: "Maria Santos" (Caption, semibold)
- Title: "Patient, Manila" (Caption, gray)
- Avatar: 48x48px circle image

---

#### 5. Call-to-Action Section
**Height:** 300px  
**Background:** Primary Blue gradient  
**Text Color:** White

**Content:**
- **Headline (H2, white):** "Ready to Understand Your Health?"
- **Subheading (Body Normal, white):** "Start with a free scan. No credit card required."
- **CTA Button:** "Get Started Now" (white text, Primary Blue background, outlined with white border, 48px height, centered)
- **Secondary Text:** "Join thousands of Filipinos taking control of their health." (Body Small, white, 80% opacity)

---

#### 6. Footer
**Height:** 250px (desktop), 400px (mobile)  
**Background:** Dark Gray (`#1F2937`)  
**Text Color:** Light Gray (`#D1D5DB`)

**Footer Structure:**
```
<footer>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
    <div>
      <h4>Klaro</h4>
      <p>Understanding healthcare, together.</p>
      <SocialLinks />
    </div>
    <div>
      <h4>Product</h4>
      <ul>
        <li><a href="#">Features</a></li>
        <li><a href="#">Pricing</a></li>
        <li><a href="#">Security</a></li>
      </ul>
    </div>
    <div>
      <h4>Company</h4>
      <ul>
        <li><a href="#">About</a></li>
        <li><a href="#">Blog</a></li>
        <li><a href="#">Careers</a></li>
      </ul>
    </div>
    <div>
      <h4>Legal</h4>
      <ul>
        <li><a href="#">Privacy</a></li>
        <li><a href="#">Terms</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </div>
  </div>
  <hr />
  <p class="text-center text-sm">© 2026 Klaro. All rights reserved.</p>
</footer>
```

---

## Authentication Flow & UI

### Authentication Architecture

**SSO Providers:**
- Google OAuth 2.0
- Discord OAuth 2.0
- Future: Facebook, Apple (phase 2)

**Guest Mode:**
- Users can scan without authentication
- Scans not persisted; shared links expire in 30 days
- Prompt to register after 3rd scan

---

### Login Page (/login)

**Page Layout:** Centered card on background

**Background:**
- Desktop: Gradient (Primary Blue to light blue)
- Mobile: Solid Light Gray
- Hero image overlay (optional, 40% opacity): Medical professionals collaborating

**Card Container:**
- Width: 400px (max-width on mobile: 90%, with 16px margin)
- Background: White
- Border radius: 12px (lg)
- Shadow: lg
- Padding: 32px (24px on mobile)

**Card Content:**

```
┌─────────────────────────────┐
│                             │
│      Klaro Logo (24x24)     │
│                             │
│  Welcome Back to Klaro      │ (H3)
│  Sign in to your account    │ (Body Small, gray)
│                             │
│  ┌─────────────────────────┐│
│  │ 🔵  Sign in with Google ││ (Button, lg, white text, Primary Blue bg)
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 🟣  Sign in with Discord ││ (Button, lg, white text, secondary color)
│  └─────────────────────────┘│
│                             │
│          – OR –             │ (Divider, gray)
│                             │
│  Email Address              │ (Label, Body Small)
│  ┌─────────────────────────┐│
│  │ user@example.com        ││ (Input, md border radius, sm shadow)
│  └─────────────────────────┘│
│                             │
│  Password                   │ (Label, Body Small)
│  ┌─────────────────────────┐│
│  │ ••••••••••              ││ (Input, show/hide toggle)
│  └─────────────────────────┘│
│                             │
│  ☐ Remember me              │ (Checkbox)
│  Forgot password? >>>       │ (Link, right-aligned)
│                             │
│  ┌─────────────────────────┐│
│  │ Sign In                 ││ (Button, primary, lg, 48px height)
│  └─────────────────────────┘│
│                             │
│  Don't have an account?     │
│  Sign up >>> (link)         │ (Body Small, center)
│                             │
└─────────────────────────────┘
```

**Button Specifications:**

| Button | Style | Size | Behavior |
|--------|-------|------|----------|
| **Sign in with Google** | Filled, Primary Blue background, white text, Google icon left | 48px height, full width | Triggers Google OAuth flow |
| **Sign in with Discord** | Filled, Discord purple (#5865F2), white text, Discord icon left | 48px height, full width | Triggers Discord OAuth flow |
| **Sign In (Email)** | Filled, Primary Blue, white text, no icon | 48px height, full width | Submit email/password form; show loading spinner; disable on submit |
| **Forgot password?** | Link, Primary Blue, underline on hover | Body Small | Navigate to `/forgot-password` |
| **Sign up** | Link, Primary Blue, underline on hover | Body Small | Navigate to `/signup` |

**Input Fields:**
- Label: Body Small, semibold, dark gray
- Border: 1px solid Light Gray
- Border radius: 4px (sm)
- Padding: 12px (md)
- Font: Body Normal
- Focus state: Border Primary Blue (2px), shadow sm
- Error state: Border Danger Red, error icon right, error message below (Caption, red)

**Checkbox:**
- Size: 18x18px
- Unchecked: Light Gray border, white background
- Checked: Primary Blue background, white checkmark
- Label text: "Remember me" (Body Small, gray)

---

### Sign-Up Page (/signup)

**Page Layout:** Similar to login, but with additional fields

**Card Content:**

```
┌─────────────────────────────┐
│      Klaro Logo (24x24)     │
│  Create Your Klaro Account  │ (H3)
│  Join our health community  │ (Body Small, gray)
│                             │
│  ┌─────────────────────────┐│
│  │ 🔵  Sign up with Google ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 🟣  Sign up with Discord ││
│  └─────────────────────────┘│
│                             │
│          – OR –             │
│                             │
│  Full Name                  │
│  ┌─────────────────────────┐│
│  │ John Dela Cruz          ││
│  └─────────────────────────┘│
│                             │
│  Email Address              │
│  ┌─────────────────────────┐│
│  │ john@example.com        ││
│  └─────────────────────────┘│
│                             │
│  Password                   │
│  ┌─────────────────────────┐│
│  │ ••••••••••              ││ (with strength indicator below)
│  └─────────────────────────┘│
│  Strength: Moderate         │ (Caption, orange)
│                             │
│  Confirm Password           │
│  ┌─────────────────────────┐│
│  │ ••••••••••              ││
│  └─────────────────────────┘│
│                             │
│  ☐ I agree to Terms of      │
│    Service and Privacy      │ (Checkbox, Body Small)
│    Policy                   │
│                             │
│  ┌─────────────────────────┐│
│  │ Create Account          ││ (Button, primary, lg)
│  └─────────────────────────┘│
│                             │
│  Already have an account?   │
│  Sign in >>> (link)         │
│                             │
└─────────────────────────────┘
```

**Password Strength Indicator:**
- Weak (< 8 chars): Red bar, 33% width, "Weak" label
- Moderate (8-12 chars, no special chars): Orange bar, 66% width, "Moderate" label
- Strong (12+ chars, mixed types): Green bar, 100% width, "Strong" label
- Color: Green (`#10B981`), Orange (`#F59E0B`), Red (`#EF4444`)

---

### SSO OAuth Flow Diagrams

#### Google OAuth Flow

```
User clicks "Sign in with Google"
        ↓
Redirect to Google OAuth consent screen
        ↓
User grants permissions (email, name, avatar)
        ↓
Redirect to /api/auth/callback/google
        ↓
Backend validates token, creates/updates session
        ↓
Redirect to /dashboard (authenticated)
```

#### Discord OAuth Flow

```
User clicks "Sign in with Discord"
        ↓
Redirect to Discord OAuth consent screen
        ↓
User grants permissions (email, username, avatar)
        ↓
Redirect to /api/auth/callback/discord
        ↓
Backend validates token, creates/updated session
        ↓
Redirect to /dashboard (authenticated)
```

**Callback Handling:**
- Success: Store session token in HttpOnly cookie, redirect to `/dashboard`
- Error: Show error toast, stay on `/login` with error message
- Timeout: Show "Authorization timed out. Try again." error
- Denied: Show "Access denied. You can sign up instead." message

---

### Error States & Validation

#### Email Validation
- **On blur:** Real-time validation
- **Invalid format:** Error icon + "Please enter a valid email" (Caption, red)
- **Already registered:** "This email is already registered" (Caption, red) with "Sign in instead >" link

#### Password Validation
- **Minimum:** 8 characters
- **Requires:** 1 uppercase, 1 lowercase, 1 number, 1 special character
- **Display:** Password strength indicator (see above)
- **Error:** "Password must contain..." with unmet requirements (Caption, red)

#### Account Creation Errors
- **User exists:** "An account with this email already exists" + "Sign in >" link
- **Network error:** "Connection failed. Please try again." with retry button
- **Server error:** "Something went wrong. Our team has been notified. Try again later."

#### Loading & Disabled States
- During OAuth flow: Show spinner, disable button, text "Signing in..."
- During form submission: Show spinner, disable all buttons, text "Creating account..."
- Error state: Enable button again, show error message

---

## Component Library

### Buttons

#### Primary Button
```css
Background: #2563EB (Primary Blue)
Text: White, semibold, 16px
Padding: 12px 24px (md)
Border: None
Border-radius: 8px (md)
Height: 48px (standard), 40px (small), 56px (large)
Cursor: Pointer

States:
  Default: Background #2563EB
  Hover: Background #1D4ED8 (darker)
  Active: Background #1E40AF (even darker)
  Disabled: Background #D1D5DB, cursor not-allowed
  Loading: Spinner icon, disabled
```

#### Secondary Button (Outlined)
```css
Background: White
Text: #2563EB, semibold, 16px
Border: 2px solid #2563EB
Padding: 12px 24px (md)
Border-radius: 8px (md)

States:
  Hover: Background #F0F9FF (light blue)
  Active: Background #E0F2FE
  Disabled: Border #D1D5DB, text #9CA3AF
```

#### Link Button
```css
Background: Transparent
Text: #2563EB, 16px
Border: None
Padding: 0
Text-decoration: Underline (on hover)
Cursor: Pointer

States:
  Hover: Text-decoration underline
  Visited: Text #7C3AED
```

### Input Fields

#### Text Input
```css
Border: 1px solid #E5E7EB (Light Gray)
Border-radius: 4px (sm)
Padding: 12px 16px (md)
Font-size: 16px
Background: White

States:
  Focus: Border 2px solid #2563EB, shadow sm
  Error: Border 2px solid #EF4444
  Disabled: Background #F3F4F6, text #9CA3AF
```

#### Select / Dropdown
```css
Border: 1px solid #E5E7EB
Padding: 12px 16px (md)
Border-radius: 4px (sm)
Display: Flex, justify-content: space-between
Arrow icon: Right side, 16x16px

States:
  Open: Border Primary Blue, shadow sm
  Hover: Border #D1D5DB
```

### Cards

#### Feature Card
```css
Background: White
Border: 1px solid #E5E7EB
Border-radius: 8px (md)
Padding: 24px (lg)
Shadow: sm

States:
  Hover: Shadow md, transform scale(1.02), transition 300ms
```

#### Testimonial Card
```css
Background: White
Border: 1px solid #E5E7EB
Border-radius: 8px (md)
Padding: 20px (md)
Shadow: sm

Layout:
  Stars: Top-left
  Quote: Body Small, dark gray
  Avatar + Name: Bottom-left
  Title: Caption, gray
```

### Forms

#### Form Group (Label + Input)
```html
<div class="form-group mb-md">
  <label class="block text-sm font-semibold text-dark-gray mb-2">
    Email Address
  </label>
  <input type="email" class="w-full input-md" placeholder="user@example.com" />
  <p class="text-xs text-gray-500 mt-1">We'll never share your email.</p>
</div>
```

---

## Responsive Breakpoints

### Mobile-First Design Strategy

**Breakpoints:**
- **Mobile:** 0px – 640px (default, smallest screens)
- **Tablet:** 641px – 1024px
- **Desktop:** 1025px+

**Container Widths:**
| Breakpoint | Max-Width | Padding |
|-----------|-----------|---------|
| Mobile | 100% | 16px sides |
| Tablet | 672px | 24px sides |
| Desktop | 1200px | 0 (centered) |

### Landing Page Responsive Behavior

**Hero Section:**
- **Mobile:** Stacked layout (image below text), text centered, image 80% width
- **Tablet:** Stacked, text left-aligned
- **Desktop:** Side-by-side (50/50)

**Feature Cards:**
- **Mobile:** 1 column, full width with 16px margin
- **Tablet:** 2 columns, 12px gap
- **Desktop:** 3 columns, 24px gap

**Footer:**
- **Mobile:** 1 column, stacked
- **Tablet:** 2 columns
- **Desktop:** 4 columns

### Navigation (Header)

**Mobile (<641px):**
- Hamburger menu icon (3 horizontal lines)
- Logo left, hamburger right
- Slide-out drawer menu

**Desktop (>1025px):**
- Horizontal navigation bar
- Logo left, nav items center, CTA button right

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text:** Minimum 4.5:1 ratio (e.g., dark gray on white)
- **Large text (18px+):** Minimum 3:1 ratio
- **UI components:** 3:1 ratio minimum
- **Do not use color alone** to indicate status (always pair with icons or text)

#### Keyboard Navigation
- All interactive elements accessible via Tab key
- Focus indicator visible (2px blue border, rounded)
- Logical tab order (top-to-bottom, left-to-right)
- Escape key closes modals and dropdowns

#### Form Accessibility
- All inputs have associated `<label>` elements
- Error messages tied to inputs via `aria-describedby`
- Password strength indicator labeled via `aria-live` (polite)
- Required fields marked with `aria-required="true"` + asterisk (*)

#### Images & Icons
- All images have descriptive `alt` text
- Icons paired with text labels (no icon-only buttons)
- SVG icons include `<title>` elements

#### Motion & Animation
- Animations respect `prefers-reduced-motion` preference
- No autoplay videos
- No flashing content (> 3 flashes per second forbidden)

#### Semantic HTML
```html
<!-- Good -->
<header>
  <nav>
    <a href="/">Logo</a>
    <ul>
      <li><a href="#features">Features</a></li>
    </ul>
  </nav>
</header>
<main>
  <section id="hero">
    <h1>Welcome</h1>
  </section>
</main>
<footer>
  <p>&copy; 2026 Klaro</p>
</footer>

<!-- Bad -->
<div class="header">
  <div class="nav">
    <a href="/">Logo</a>
    <div>
      <div><a href="#features">Features</a></div>
    </div>
  </div>
</div>
```

#### Screen Reader Support
- All interactive elements have `role` attributes where needed
- Use `aria-label` for icon-only buttons
- Use `aria-live="polite"` for dynamic content updates
- Use `aria-expanded`, `aria-hidden` for collapsible content

#### Mobile Accessibility
- Touch targets minimum 48x48px (accessibility standard)
- Form inputs 16px+ font size (prevents iOS zoom on focus)
- Avoid horizontal scrolling

---

## User Flows

### Flow 1: New User Registration & First Scan

```
START (Landing page)
  ↓
User clicks "Get Started"
  ↓
Redirected to /signup
  ↓
Choose: [Google SSO] [Discord SSO] [Email]
  ↓
IF Google/Discord:
  - OAuth consent screen
  - Approve permissions
  - Session created
  ELSE (Email):
  - Enter full name, email, password
  - Validate, create account
  ↓
Email verification (if email signup)
  - Link sent, user clicks in email
  - Account confirmed
  ↓
Redirected to /dashboard
  ↓
Welcome modal shown: "Your first scan awaits"
  ↓
User clicks [Start Scanning]
  ↓
Redirected to /scan
  ↓
User uploads/captures document
  ↓
OCR processing (spinner: "Analyzing document...")
  ↓
Results page: Plain-language explanation + Tanong Mo Sa Doktor card
  ↓
User sees: [Chat] [Find Clinics] [Book Doctor] [Save] buttons
  ↓
END
```

### Flow 2: Existing User Login

```
START (Landing page)
  ↓
User clicks "Sign In"
  ↓
Redirected to /login
  ↓
Choose: [Google SSO] [Discord SSO] [Email]
  ↓
IF Google/Discord:
  - OAuth consent (if not cached)
  - Session validated
  ELSE (Email):
  - Enter email + password
  - Server validates
  - Session created
  ↓
Redirected to /dashboard
  ↓
User sees: [Recent scans] [New scan] [Doctor bookings] [Chat history]
  ↓
END
```

### Flow 3: Guest Scan (No Auth)

```
START (Landing page)
  ↓
User clicks "Get Started"
  ↓
Can scan without signup (session created as guest)
  ↓
User uploads/captures document
  ↓
Results displayed (plain-language + Tanong card)
  ↓
Prompt after 3rd scan: "Sign up to save results"
  ↓
IF user declines:
  - Generate 30-day shareable link
  - Scan expires after 30 days
  ELSE:
  - Redirect to /signup
  - Create account, scan saved
  ↓
END
```

### Flow 4: Forgotten Password Recovery

```
START (/login)
  ↓
User clicks "Forgot password?"
  ↓
Redirected to /forgot-password
  ↓
User enters email
  ↓
Form submitted
  ↓
Backend checks if email exists
  ↓
IF exists:
  - Reset link generated, sent to email
  - Success message shown: "Check your email for reset link"
  ELSE:
  - Same success message (don't leak email existence)
  ↓
User clicks link in email
  ↓
Redirected to /reset-password?token=xxx
  ↓
Enter new password (with strength indicator)
  ↓
Submit
  ↓
Backend validates token, updates password
  ↓
Success message, redirect to /login
  ↓
END
```

---

## Implementation Checklist

### Phase 1: Design Handoff
- [ ] Finalize color palette and apply to component library
- [ ] Create high-fidelity mockups (Figma/Adobe XD)
- [ ] Design system documentation (this file)
- [ ] Create responsive wireframes for all breakpoints
- [ ] Share Figma link with dev team
- [ ] Create design tokens (colors, spacing, typography) exportable for code

### Phase 2: Frontend Development
- [ ] Set up Next.js project with Tailwind CSS
- [ ] Implement design tokens in CSS custom properties
- [ ] Create reusable component library (button, input, card, etc.)
- [ ] Build landing page (hero, features, testimonials, CTA, footer)
- [ ] Implement login page with email validation
- [ ] Implement signup page with password strength
- [ ] Set up NextAuth.js integration

### Phase 3: Backend Integration
- [ ] Configure Google OAuth 2.0 credentials
- [ ] Configure Discord OAuth 2.0 credentials
- [ ] Implement NextAuth.js providers
- [ ] Build user registration endpoint
- [ ] Build login endpoint (email/password)
- [ ] Build password reset flow
- [ ] Implement session management

### Phase 4: Testing & QA
- [ ] Manual testing on mobile (iOS + Android)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Password reset flow end-to-end
- [ ] OAuth flow end-to-end (Google + Discord)
- [ ] Error state testing

### Phase 5: Performance & Optimization
- [ ] Lighthouse audit (target: 90+ on all metrics)
- [ ] Image optimization (WebP, lazy loading)
- [ ] CSS/JS minification
- [ ] Font loading optimization
- [ ] SEO metadata

---

## Design Resources

### Figma Design System
- **Link:** (To be provided by design team)
- **Components:** Buttons, inputs, cards, modals, badges, avatars
- **Pages:** Landing page, auth pages, responsive views

### Icon Set
- **Library:** Heroicons (24x24px, filled + outlined variants)
- **Alternative:** Tabler Icons
- **Primary Color:** Primary Blue (#2563EB)

### Stock Photography
- **Hero imagery:** Healthcare professionals, diverse faces, warm lighting
- **Source:** Unsplash, Pexels (free, CC0 licensed)
- **Requirement:** 1200x800px minimum, compressed < 200KB

### Fonts
- **Primary:** Inter (Google Fonts) – fallback to system sans-serif
- **Weights:** 400, 500, 600, 700
- **Preload:** Optimize font loading to reduce CLS

---

## Next Steps

1. **Review this design guide** with stakeholders
2. **Create Figma mockups** for landing page + auth pages
3. **Get design approval** before dev starts
4. **Export design tokens** (colors, spacing, typography)
5. **Handoff to frontend team** with component specs
6. **Begin Phase 2 implementation** (Next.js + components)

---

**Document Version:** 1.0  
**Last Updated:** May 3, 2026  
**Status:** Design-Ready for Development  
**Next Review:** After Phase 1 stakeholder feedback
