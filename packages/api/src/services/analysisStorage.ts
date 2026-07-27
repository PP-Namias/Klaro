export interface AnalysisRecord {
  id: string;
  documentId: string;
  extractedFields: Record<string, unknown>;
  plainLanguageSummary: string;
  tanongMoCard: Record<string, unknown>;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveAnalysisInput {
  documentId: string;
  extractedFields: Record<string, unknown>;
  plainLanguageSummary: string;
  tanongMoCard: Record<string, unknown>;
  severity: string;
}

const analysisStore = new Map<string, AnalysisRecord>();

export function saveAnalysis(input: SaveAnalysisInput): AnalysisRecord {
  const id = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const record: AnalysisRecord = {
    id,
    documentId: input.documentId,
    extractedFields: input.extractedFields,
    plainLanguageSummary: input.plainLanguageSummary,
    tanongMoCard: input.tanongMoCard,
    severity: input.severity,
    status: "completed",
    createdAt: now,
    updatedAt: now,
  };

  analysisStore.set(id, record);
  return record;
}

export function getAnalysis(id: string): AnalysisRecord | null {
  return analysisStore.get(id) || null;
}

export function getAnalysisByDocumentId(
  documentId: string,
): AnalysisRecord | null {
  for (const record of analysisStore.values()) {
    if (record.documentId === documentId) {
      return record;
    }
  }
  return null;
}

export function getAllAnalyses(): AnalysisRecord[] {
  return Array.from(analysisStore.values());
}

export function updateAnalysisStatus(
  id: string,
  status: string,
): AnalysisRecord | null {
  const record = analysisStore.get(id);
  if (!record) return null;

  record.status = status;
  record.updatedAt = new Date();
  analysisStore.set(id, record);
  return record;
}

export function deleteAnalysis(id: string): boolean {
  return analysisStore.delete(id);
}

export function clearAllAnalyses(): void {
  analysisStore.clear();
}

export function formatAnalysisForStorage(
  record: AnalysisRecord,
): Record<string, unknown> {
  return {
    id: record.id,
    documentId: record.documentId,
    extractedFields: JSON.stringify(record.extractedFields),
    plainLanguageSummary: record.plainLanguageSummary,
    tanongMoCard: JSON.stringify(record.tanongMoCard),
    severity: record.severity,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function parseAnalysisFromStorage(
  data: Record<string, unknown>,
): AnalysisRecord {
  return {
    id: data.id as string,
    documentId: data.documentId as string,
    extractedFields: JSON.parse(data.extractedFields as string),
    plainLanguageSummary: data.plainLanguageSummary as string,
    tanongMoCard: JSON.parse(data.tanongMoCard as string),
    severity: data.severity as string,
    status: data.status as string,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  };
}
