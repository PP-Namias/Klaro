import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-[#f3f4f6] px-6 py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-24 flex flex-col justify-between gap-12 lg:flex-row">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <div className="footer-logo flex items-center gap-2 text-black">
              <Image
                src="/klaro-dark.svg"
                alt="Klaro"
                width={28}
                height={28}
                className="opacity-90"
              />
              Klaro
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-3 lg:gap-32">
            <div className="flex flex-col gap-4">
              <h4 className="feature-small-title text-zinc-600">Features</h4>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/scan"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Scan & Analyze
                </Link>
                <Link
                  href="/scan"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  AI Medical Chat
                </Link>
                <Link
                  href="/maps"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Clinic Finder
                </Link>
                <span
                  className="feature-small-desc cursor-not-allowed text-zinc-300"
                  aria-disabled="true"
                >
                  Doctor Booking
                </span>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="feature-small-title text-zinc-600">Resources</h4>
              <nav className="flex flex-col gap-2">
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  How it Works
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Patient Stories
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Security & Privacy
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Contact Support
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="feature-small-title text-zinc-600">Legal</h4>
              <nav className="flex flex-col gap-2">
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  DPA Compliance
                </a>
                <a
                  href="#"
                  className="feature-small-desc text-zinc-500 transition-colors hover:text-black"
                >
                  Cookie Settings
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between border-t border-zinc-200/50 pt-10 sm:flex-row">
          <p className="footer-copyright mb-6 text-zinc-500 sm:mb-0">
            © 2026 Klaro. Built for the Philippines.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-zinc-700 transition-colors hover:text-black"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-zinc-700 transition-colors hover:text-black"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.05.05 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-zinc-700 transition-colors hover:text-black"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
