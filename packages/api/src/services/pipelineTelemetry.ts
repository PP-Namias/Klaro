export interface PipelineTelemetryEvent {
  event: string;
  timestamp: string;
  requestId?: string;
  ocrConfidence?: number;
  geminiConfidence?: number;
  path?: string;
  accepted?: boolean;
  processingTimeMs?: number;
  warnings?: string[];
  error?: string;
}

export function emitTelemetry(
  eventName: string,
  data: Partial<PipelineTelemetryEvent> = {},
): void {
  const entry: PipelineTelemetryEvent = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    try {
      console.log(JSON.stringify(entry));
    } catch {
      console.log(JSON.stringify(entry));
    }
  } else {
    console.log(JSON.stringify(entry));
  }
}

export async function emitPipelineTelemetry(
  stage: string,
  data: Partial<PipelineTelemetryEvent>,
): Promise<void> {
  emitTelemetry(`pipeline.${stage}`, data);
}
