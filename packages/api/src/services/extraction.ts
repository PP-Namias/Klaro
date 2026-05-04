export type ExtractedTest = {
  name: string;
  value: number;
  unit?: string;
  referenceRange?: string;
  flag?: "low" | "high" | "normal";
};

const canonicalNameMap = new Map<string, string>([
  ["wbc", "white blood cell"],
  ["rbc", "red blood cell"],
  ["hgb", "hemoglobin"],
  ["hct", "hematocrit"],
  ["plt", "platelets"],
  ["glucose", "glucose"],
  ["creatinine", "creatinine"],
]);

const lineRegex =
  /^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z0-9/%^]+)?(?:\s+(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?))?$/;

const rangeRegex = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/;

const normalizeName = (name: string) => {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const key = cleaned.toLowerCase();
  return canonicalNameMap.get(key) ?? cleaned;
};

const computeFlag = (value: number, range?: string) => {
  if (!range) return undefined;
  const match = rangeRegex.exec(range);
  if (!match) return undefined;

  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return undefined;

  if (value < low) return "low";
  if (value > high) return "high";
  return "normal";
};

export const extractTestsFromText = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: ExtractedTest[] = [];

  for (const line of lines) {
    const match = lineRegex.exec(line);
    if (!match) continue;

    const name = normalizeName(match[1] ?? "");
    const value = Number(match[2]);
    if (!Number.isFinite(value)) continue;

    const unit = match[3];
    const referenceRange = match[4];

    results.push({
      name,
      value,
      unit,
      referenceRange,
      flag: computeFlag(value, referenceRange),
    });
  }

  return results;
};
