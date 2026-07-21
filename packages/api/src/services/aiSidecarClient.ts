const AI_SIDECAR_URL =
  process.env.AI_SIDECAR_URL ?? 'http://localhost:3002';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  followUpQuestions: string[];
}

export interface IngestResponse {
  status: string;
  ingested: boolean;
  docCount: number;
}

export class AiSidecarClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AiSidecarClientError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${AI_SIDECAR_URL}${path}`;
  const headers: Record<string, string> = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new AiSidecarClientError(
      errorBody || `Sidecar returned ${res.status}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export async function chat(
  question: string,
  messages: ChatMessage[] = [],
): Promise<ChatResponse> {
  if (!question || typeof question !== 'string') {
    throw new AiSidecarClientError('question is required', 400);
  }
  return request<ChatResponse>('POST', '/api/chat', { question, messages });
}

export async function chatStreamURL(
  question: string,
  messages: ChatMessage[] = [],
): Promise<string> {
  const params = new URLSearchParams({ question });
  if (messages.length > 0) {
    params.set('messages', JSON.stringify(messages));
  }
  return `${AI_SIDECAR_URL}/api/chat/stream?${params.toString()}`;
}

export async function ingest(
  file: File | Blob,
  fileName: string,
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file, fileName);

  const url = `${AI_SIDECAR_URL}/api/ingest`;
  const res = await fetch(url, { method: 'POST', body: formData });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new AiSidecarClientError(
      errorBody || `Sidecar ingest returned ${res.status}`,
      res.status,
    );
  }

  return res.json() as Promise<IngestResponse>;
}

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>('GET', '/api/health');
}
