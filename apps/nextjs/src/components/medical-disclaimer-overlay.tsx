"use client";

/**
 * Medical Disclaimer Overlay
 *
 * FE-07: Add disclaimer overlay before first AI response regarding medical advice limitations.
 *
 * This component displays a mandatory disclaimer that users must acknowledge
 * before receiving AI-generated medical information. Required for HIPAA compliance
 * and to set proper expectations about AI limitations.
 */

import { useState, useEffect, useCallback } from "react";

import { useLanguage } from "~/providers/language-provider";

// ============================================================================
// Types
// ============================================================================

interface MedicalDisclaimerOverlayProps {
  /** Whether to show the overlay */
  isOpen: boolean;
  /** Callback when user accepts disclaimer */
  onAccept: () => void;
  /** Callback when user declines (logs out or redirects) */
  onDecline?: () => void;
  /** Language override */
  language?: string;
}

// ============================================================================
// Translations
// ============================================================================

const DISCLAIMER_TRANSLATIONS = {
  en: {
    title: "Important Medical Disclaimer",
    subtitle: "Please read carefully before proceeding",
    sections: [
      {
        heading: "Not Medical Advice",
        content:
          "The information provided by this AI assistant is for educational and informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.",
      },
      {
        heading: "AI Limitations",
        content:
          "This AI system may occasionally produce inaccurate or incomplete information. Always verify critical health information with a qualified healthcare provider.",
      },
      {
        heading: "No Doctor-Patient Relationship",
        content:
          "Using this service does not create a doctor-patient relationship. The AI cannot examine you, review your full medical history, or provide personalized medical advice.",
      },
      {
        heading: "Emergency Situations",
        content:
          "If you are experiencing a medical emergency, call your local emergency number (911 in the US) or go to the nearest emergency department immediately.",
      },
    ],
    acceptButton: "I Understand & Accept",
    declineButton: "I Do Not Accept",
    requiredNotice: "You must accept this disclaimer to use the service.",
    privacyNote:
      "Your health data is encrypted and protected in accordance with HIPAA regulations.",
  },
  fil: {
    title: "Mahalagang Paunawa sa Medikal",
    subtitle: "Basahing mabuti bago magpatuloy",
    sections: [
      {
        heading: "Hindi Payong Medikal",
        content:
          "Ang impormasyong ibinibigay ng AI assistant na ito ay para lamang sa pang-edukasyong layunin. Ito ay HINDI kapalit ng propesyonal na payong medikal, pagsusuri, o paggamot.",
      },
      {
        heading: "Mga Limitasyon ng AI",
        content:
          "Maaaring maglabas ng hindi tumpak o hindi kumpletong impormasyon ang AI system na ito. Laging i-verify ang mahahalagang impormasyon sa kalusugan sa isang kwalipikadong tagapagbigay ng pangangalagang pangkalusugan.",
      },
      {
        heading: "Walang Relasyong Doktor-Pasyente",
        content:
          "Ang paggamit ng serbisyong ito ay hindi lumilikha ng relasyong doktor-pasyente. Hindi suriin ng AI ang iyong buong kasaysayan ng medikal o magbigay ng personalisadong payong medikal.",
      },
      {
        heading: "Mga Emergency na Sitwasyon",
        content:
          "Kung nakaranas ng emergency medikal, tumawag sa iyong lokal na emergency number o pumunta agad sa pinakamalapit na emergency department.",
      },
    ],
    acceptButton: "Naiintindihan ko at Tinatanggap ko",
    declineButton: "Hindi Ko Tinatanggap",
    requiredNotice: "Kailangan mong tanggapin ang paunawa na ito para magamit ang serbisyo.",
    privacyNote:
      "Ang iyong data sa kalusugan ay naka-encrypt at protektado ayon sa mga regulasyon ng HIPAA.",
  },
  ceb: {
    title: "Importante nga Medical Disclaimer",
    subtitle: "Basaha pag-ayo kadi magpadayon",
    sections: [
      {
        heading: "Dili Medikal nga Tambag",
        content:
          "Ang impormasyon nga gihatag niini nga AI assistant para lang sa edukasyon ug impormasyon. KINI DILI kapuli sa propesyonal nga medikal nga tambag, diagnosis, o pagtambal.",
      },
      {
        heading: "Mga Limitasyon sa AI",
        content:
          "Mahimong mogawas ang AI system nga dili tumpak o dili kompleto nga impormasyon. Siguradoha nga i-verify ang importante nga impormasyon sa kahimsog sa usa ka kwalipikado nga health provider.",
      },
      {
        heading: "Walay Relasyon sa Doktor-Pasyente",
        content:
          "Ang paggamit niini nga serbisyo dili molambo ug relasyon sa doktor-pasyente. Dili masusi sa AI ang imong tibuok nga kasaysayan sa medikal o mohatag og personalisadong medikal nga tambag.",
      },
      {
        heading: "Mga Emergency nga Sitwasyon",
        content:
          "Kung nag-agi ug emergency medikal, tawag ang imong lokal nga emergency number o adto dayon sa pinakaduol nga emergency department.",
      },
    ],
    acceptButton: "Nakabalo Ko ug Dawat Ko",
    declineButton: "Wala Ko Dakop",
    requiredNotice: "Kinahanglan nimu dawaton kini nga disclaimer aron mogamit sa serbisyo.",
    privacyNote:
      "Ang imong data sa kahimsog gi-encrypt ug giprotektahan sumala sa mga regulasyon sa HIPAA.",
  },
  ilo: {
    title: "Importante nga Medical Disclaimer",
    subtitle: "Basaan nga nalaka iti agpayo nga mag-ambek",
    sections: [
      {
        heading: "Haan a Medikal a Saranay",
        content:
          "Ti impormasyon nga ibinibigay daytoy a AI assistant para iti edukasyon wen a kasumpay. DAYTOY HAAN a kasumpay iti propesyonal a medikal a saranay, diagnosis, wen a panangpateg.",
      },
      {
        heading: "Mga Limitasyon iti AI",
        content:
          "Maaaramid a mangted iti haan a tumpak wen a haan a kompleto a impormasyon daytoy a AI system. Laging i-verify iti importante a impormasyon iti kasasaad iti kwalipikado a tagatangtangtugon iti panagsaludsog.",
      },
      {
        heading: "Walang Relasyon iti Doktor-Pasyente",
        content:
          "Ti panag-usage daytoy a serbisyo haan a mangted iti relasyon iti doktor-pasyente. Haan a masusi iti AI iti kasta a kasaysayan medikal wen a mangted iti personalisadong medikal a saranay.",
      },
      {
        heading: "Mga Emergency a Situasyon",
        content:
          "Kung nakaexperencia iti emergency medikal, awag iti lokal a emergency number wen a mangan iti pinakarugit a emergency department.",
      },
    ],
    acceptButton: "Nakunak iti Narigat & Tirikko",
    declineButton: "Haan Akka Tirikko",
    requiredNotice: "Kailangan mo tirikko daytoy a disclaimer aron magamit iti serbisyo.",
    privacyNote:
      "Ti data mo iti kasasaad ket encrypted ken naprotektahan babaen iti mga regulasyon iti HIPAA.",
  },
};

// ============================================================================
// Component
// ============================================================================

export function MedicalDisclaimerOverlay({
  isOpen,
  onAccept,
  onDecline,
  language: languageProp,
}: MedicalDisclaimerOverlayProps) {
  const { language: contextLanguage } = useLanguage();
  const language = languageProp || contextLanguage;
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const t =
    DISCLAIMER_TRANSLATIONS[language as keyof typeof DISCLAIMER_TRANSLATIONS] ||
    DISCLAIMER_TRANSLATIONS.en;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setHasScrolled(false);
    }
  }, [isOpen]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // User has scrolled to near the bottom (within 50px)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setHasScrolled(true);
    }
  }, []);

  const handleAccept = () => {
    // Store acceptance in localStorage
    try {
      localStorage.setItem("klaro-disclaimer-accepted", new Date().toISOString());
    } catch {
      // localStorage not available
    }
    onAccept();
  };

  const handleDecline = () => {
    onDecline?.();
  };

  if (!isOpen || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
        >
          <div className="space-y-4">
            {t.sections.map((section, index) => (
              <div
                key={index}
                className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
              >
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                  {section.heading}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t.privacyNote}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <p className="mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t.requiredNotice}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDecline}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t.declineButton}
            </button>
            <button
              onClick={handleAccept}
              disabled={!hasScrolled}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {t.acceptButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if user has already accepted the disclaimer
 */
export function hasAcceptedDisclaimer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("klaro-disclaimer-accepted") !== null;
  } catch {
    return false;
  }
}

/**
 * Clear disclaimer acceptance (for re-consent)
 */
export function clearDisclaimerAcceptance(): void {
  try {
    localStorage.removeItem("klaro-disclaimer-accepted");
  } catch {
    // localStorage not available
  }
}
