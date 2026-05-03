import Image from "next/image";
import Link from "next/link";

/* ──────────────────────────────────────────────
   SVG Icon Components (inline to avoid deps)
   ────────────────────────────────────────────── */

function ScanIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 14h1v3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#2563EB]"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10B981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="#FBBF24"
      stroke="#FBBF24"
      strokeWidth="1"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Feature Card Data
   ────────────────────────────────────────────── */

const features = [
  {
    icon: <ScanIcon />,
    title: "Scan & Analyze",
    description:
      "Take a photo or upload documents — lab results, prescriptions, discharge summaries. AI extracts and explains findings instantly.",
    action: "Explore",
  },
  {
    icon: <ChatIcon />,
    title: "Understand in Your Language",
    description:
      "Get explanations in plain Filipino, Bisaya, Ilocano, or English. Ask follow-up questions. AI chat adapts to your dialect.",
    action: "See Example",
  },
  {
    icon: <MapIcon />,
    title: "Find Nearby Care",
    description:
      "Discover PhilHealth-accredited clinics and hospitals near you. Filter by specialty and opening hours.",
    action: "View Map",
  },
  {
    icon: <CalendarIcon />,
    title: "Book Licensed Doctors",
    description:
      "Browse and book consultations with PRC-verified Filipino doctors. Chat, video, or async reviews — your choice.",
    action: "Browse Doctors",
  },
  {
    icon: <LockIcon />,
    title: "Secure Sharing",
    description:
      "Share scan results securely with 30-day expiry links. Keep family and caregivers informed safely.",
    action: "Learn More",
  },
  {
    icon: <HistoryIcon />,
    title: "Your Health History",
    description:
      "Save and track all your medical documents in one place. Personalized insights across your health journey.",
    action: "Get Started",
  },
];

/* ──────────────────────────────────────────────
   Testimonial Data
   ────────────────────────────────────────────── */

const testimonials = [
  {
    quote:
      "Finally, I understand my lab results! The AI explained everything in Bisaya and even told me which values to discuss with my doctor.",
    name: "Maria Santos",
    title: "Patient, Cebu",
  },
  {
    quote:
      "The AI chat is incredibly helpful. I asked follow-up questions about my prescription and got clear, simple answers. Game changer.",
    name: "Juan Dela Cruz",
    title: "Patient, Manila",
  },
  {
    quote:
      "My patients love Klaro. They come to their appointments better informed, and it saves us so much consultation time.",
    name: "Dr. Ana Reyes",
    title: "Physician, Quezon City",
  },
];

/* ──────────────────────────────────────────────
   Page Component
   ────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVIGATION ─── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1F2937]">
              Klaro
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#1F2937]"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#1F2937]"
            >
              Security
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#1F2937]"
            >
              Testimonials
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8] hover:shadow-md active:bg-[#1E40AF]"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#93C5FD]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-16 sm:px-6 md:flex-row md:py-24 lg:py-32">
          {/* Text Content */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
              AI-Powered Health Companion
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Understand Your
              <br />
              Medical Documents.
              <br />
              <span className="text-[#BAE6FD]">Instantly.</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-blue-100 sm:text-xl">
              Scan lab results, prescriptions, and discharge summaries. Get
              plain-language explanations and AI-powered guidance in your
              language.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row md:justify-start">
              <Link
                href="/login"
                className="w-full rounded-xl bg-white px-8 py-4 text-center text-base font-bold text-[#2563EB] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
              >
                Get Started Free
              </Link>
              <a
                href="#features"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-center text-base font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 sm:w-auto"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-y-1"
                >
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1">
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-2xl" />
              <Image
                src="/hero-doctor.png"
                alt="Doctor reviewing medical documents on a tablet with health analytics"
                width={520}
                height={520}
                className="relative z-10 drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="bg-[#F9FAFB] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-4 inline-block rounded-full bg-[#EFF6FF] px-4 py-1.5 text-sm font-semibold text-[#2563EB]">
              Core Features
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              Everything you need for your health journey
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[#6B7280]">
              From scanning documents to booking consultations, Klaro simplifies
              every step of understanding your health.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#EFF6FF]">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#1F2937]">
                  {feature.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[#6B7280]">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] transition-all group-hover:gap-2">
                  {feature.action}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY & TRUST SECTION ─── */}
      <section id="security" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            {/* Visual */}
            <div className="flex flex-1 items-center justify-center">
              <div className="relative flex h-64 w-64 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-[#EFF6FF]" />
                <div className="absolute inset-4 rounded-full bg-[#DBEAFE]" />
                <div className="absolute inset-8 flex items-center justify-center rounded-full bg-[#2563EB]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 space-y-6">
              <span className="inline-block rounded-full bg-[#F0FDF4] px-4 py-1.5 text-sm font-semibold text-[#10B981]">
                Privacy First
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
                Your Health Data is
                <br />
                Private & Secure
              </h2>
              <div className="space-y-4">
                {[
                  "End-to-end encryption for all documents",
                  "Complies with local healthcare regulations",
                  "No data shared without your explicit consent",
                  "Regular security audits and updates",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircleIcon />
                    <span className="text-[#4B5563]">{item}</span>
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#6B7280]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                ISO 27001 Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─── */}
      <section id="testimonials" className="bg-[#F9FAFB] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-[#FFF7ED] px-4 py-1.5 text-sm font-semibold text-[#F59E0B]">
              Testimonials
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              Trusted by Filipino patients & doctors
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <blockquote className="mb-6 text-sm leading-relaxed text-[#4B5563]">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-sm font-bold text-white">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#06B6D4]">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Understand Your Health?
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            Start with a free scan. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl border-2 border-white bg-white px-10 py-4 text-base font-bold text-[#2563EB] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Get Started Now
          </Link>
          <p className="mt-6 text-sm text-blue-200/80">
            Join thousands of Filipinos taking control of their health.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#1F2937] text-[#D1D5DB]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
                  <span className="text-sm font-bold text-white">K</span>
                </div>
                <span className="text-lg font-bold text-white">Klaro</span>
              </div>
              <p className="text-sm leading-relaxed text-[#9CA3AF]">
                Understanding healthcare, together. AI-powered medical document
                analysis for Filipino patients.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Security", "API"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-[#9CA3AF] transition-colors hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-[#9CA3AF] transition-colors hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Legal
              </h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-[#9CA3AF] transition-colors hover:text-white"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-center text-sm text-[#9CA3AF]">
              &copy; {new Date().getFullYear()} Klaro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
