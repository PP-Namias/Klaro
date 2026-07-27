import type { SeverityLevel } from "./severityScoring";
import { calculateSeverity } from "./severityScoring";

export interface TanongMoCard {
  id: string;
  title: string;
  severity: SeverityLevel;
  questions: string[];
  recommendations: string[];
  bookingCta: boolean;
  disclaimer: string;
  generatedAt: Date;
}

export interface TanongMoConfig {
  language?: string;
  includeBookingCta?: boolean;
  maxQuestions?: number;
}

const DISCLAIMERS: Record<string, string> = {
  en: "This information is for educational purposes only. Always consult your doctor for medical advice.",
  fil: "Ang impormasyong ito ay para sa layuning pang-edukasyon lamang. Laging kumonsulta sa iyong doktor para sa medikal na payo.",
  bisaya:
    "Kining impormasyona para ra sa edukasyon. Konsulta gyud sa imong doktor alang sa medikal nga tambag.",
  ilocano:
    "Daytoy a impormasyon para iti edukasyon laeng. Konsultam lagep ti doktor mo para iti medikal a tulung.",
};

function generateQuestions(
  testCode: string,
  severity: SeverityLevel,
  language = "en",
): string[] {
  const questionsBySeverity: Record<SeverityLevel, string[]> = {
    normal: [
      "What does this result mean for my health?",
      "How often should I get this test done?",
      "Are there lifestyle changes I should make?",
    ],
    borderline: [
      "What lifestyle changes can help improve this result?",
      "How soon should I retest this?",
      "Should I be concerned about this result?",
    ],
    high: [
      "What treatment options are available?",
      "What symptoms should I watch for?",
      "How urgent is follow-up needed?",
      "What medications might be prescribed?",
    ],
    critical: [
      "What immediate actions should I take?",
      "Should I go to the hospital?",
      "What complications could arise?",
      "What specialist should I see?",
    ],
  };

  const questions = questionsBySeverity[severity] || questionsBySeverity.normal;

  if (language === "fil") {
    return questions.map((q) => translateToFilipino(q));
  }

  return questions;
}

function translateToFilipino(english: string): string {
  const translations: Record<string, string> = {
    "What does this result mean for my health?":
      "Ano ang ibig sabihin ng resultang ito para sa aking kalusugan?",
    "How often should I get this test done?":
      "Gaano kadalas dapat gawin ang test na ito?",
    "Are there lifestyle changes I should make?":
      "May mga pagbabago ba sa pamumuhay na dapat kong gawin?",
    "What lifestyle changes can help improve this result?":
      "Anong mga pagbabago sa pamumuhay ang makakatulong para mapabuti ang resultang ito?",
    "How soon should I retest this?": "Gaano katagal bago ako magpa-test ulit?",
    "Should I be concerned about this result?":
      "Dapat ba akong mag-alala sa resultang ito?",
    "What treatment options are available?":
      "Anong mga opsyon sa paggamot ang available?",
    "What symptoms should I watch for?":
      "Anong mga sintomas ang dapat kong bantayan?",
    "How urgent is follow-up needed?":
      "Gaano ka-urgent ang kailanganang follow-up?",
    "What medications might be prescribed?":
      "Anong mga gamot ang maaaring resitahan?",
    "What immediate actions should I take?":
      "Anong mga agarang aksyon ang dapat kong gawin?",
    "Should I go to the hospital?": "Dapat ba akong pumunta sa ospital?",
    "What complications could arise?":
      "Anong mga komplikasyon ang maaaring mangyari?",
    "What specialist should I see?":
      "Anong specialist ang dapat kong konsultahin?",
  };

  return translations[english] || english;
}

function generateRecommendations(
  severity: SeverityLevel,
  _language = "en",
): string[] {
  const recommendations: Record<SeverityLevel, string[]> = {
    normal: [
      "Continue maintaining a healthy lifestyle",
      "Keep regular check-up schedule",
    ],
    borderline: [
      "Consider dietary modifications",
      "Schedule follow-up test in 1-3 months",
      "Monitor for any symptoms",
    ],
    high: [
      "Consult with your doctor promptly",
      "Follow prescribed treatment plan",
      "Schedule regular monitoring",
    ],
    critical: [
      "Seek immediate medical attention",
      "Do not delay consultation",
      "Follow emergency instructions if given",
    ],
  };

  return recommendations[severity] || recommendations.normal;
}

export function generateTanongMoCard(
  testCode: string,
  value: number,
  config: TanongMoConfig = {},
): TanongMoCard {
  const {
    language = "en",
    includeBookingCta = true,
    maxQuestions = 3,
  } = config;

  const severityResult = calculateSeverity(testCode, value);
  const severity = severityResult.severity;

  const questions = generateQuestions(testCode, severity, language).slice(
    0,
    maxQuestions,
  );

  const recommendations = generateRecommendations(severity, language);

  return {
    id: `tanong-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: `Tanong Mo Sa Doktor: ${severityResult.testCode}`,
    severity,
    questions,
    recommendations,
    bookingCta:
      includeBookingCta && (severity === "high" || severity === "critical"),
    disclaimer:
      DISCLAIMERS[language] ?? DISCLAIMERS.en ?? "Consult your doctor.",
    generatedAt: new Date(),
  };
}

export function formatTanongMoCard(
  card: TanongMoCard,
): Record<string, unknown> {
  return {
    id: card.id,
    title: card.title,
    severity: card.severity,
    questions: card.questions,
    recommendations: card.recommendations,
    bookingCta: card.bookingCta,
    disclaimer: card.disclaimer,
    generatedAt: card.generatedAt.toISOString(),
  };
}

export function validateTanongMoCard(card: TanongMoCard): string[] {
  const errors: string[] = [];

  if (!card.id) errors.push("Card ID is required");
  if (!card.title) errors.push("Card title is required");
  if (!card.severity) errors.push("Severity level is required");
  if (!card.questions || card.questions.length === 0) {
    errors.push("At least one question is required");
  }
  if (!card.disclaimer) errors.push("Disclaimer is required");

  return errors;
}
