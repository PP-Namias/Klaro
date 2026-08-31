if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class MockFileReader {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    result: string | null = null;
    readAsDataURL(blob: Blob): void {
      this.result = "data:text/plain;base64,dGVzdA==";
      if (this.onload) setTimeout(() => this.onload!());
    }
  } as unknown as typeof FileReader;
}

process.env.POSTGRES_URL = "postgres://mock:mock@localhost:5432/mock";
process.env.AUTH_DISCORD_ID = "mock-discord-id";
process.env.AUTH_DISCORD_SECRET = "mock-discord-secret";
process.env.AUTH_GOOGLE_ID = "mock-google-id";
process.env.AUTH_GOOGLE_SECRET = "mock-google-secret";
process.env.AUTH_SECRET = "mock-auth-secret";
process.env.AI_SIDECAR_URL = "http://localhost:3002";
process.env.ANTHROPIC_API_KEY = "mock-anthropic-key";
process.env.AWS_BEDROCK_REGION = "us-east-1";
process.env.CHAT_MODEL_FALLBACK = "openai/gpt-4o-mini";
process.env.CHUNK_SIZE = "1000";
process.env.CORS_ORIGINS = "*";
process.env.CAL_COM_USERNAME = "mock-user";
process.env.ENCRYPTION_MASTER_KEY = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
process.env.ENCRYPTION_KEY_VERSION = "1";
process.env.CLOUDINARY_CLOUD_NAME = "mock-cloud";
process.env.CLOUDINARY_API_KEY = "mock-key";
process.env.CLOUDINARY_API_SECRET = "mock-secret";
process.env.CLEANUP_BATCH_SIZE = "50";
process.env.CLEANUP_DRY_RUN = "false";
process.env.EMBEDDING_MODEL = "text-embedding-3-small";
process.env.EMBEDDING_PROVIDER = "openai";
process.env.FILE_MAX_RETENTION_HOURS = "168";
process.env.FILE_RETENTION_HOURS = "24";
process.env.FIREWORKS_API_KEY = "mock-fireworks-key";
process.env.GEMINI_FALLBACK_ENABLED = "false";
process.env.GEMINI_LOG_FALLBACK = "false";
process.env.GEMINI_MOCK_DELAY = "0";
process.env.GEMINI_MODEL = "gemini-2.0-flash";
process.env.GEMINI_SCAN_API_URL = "http://localhost:3001";
process.env.GEMINI_API_KEY = "mock-gemini-key";
// Because GEMINI_API_KEY is set above, geminiClient would otherwise treat the
// suite as "configured" and issue real requests to generativelanguage.googleapis.com,
// making tests network-dependent and prone to 5s timeouts. Force the offline mock.
// Suites that exercise the live path delete this var themselves.
process.env.MOCK_GEMINI = "true";
process.env.GOOGLE_API_KEY = "mock-google-api-key";
process.env.GOOGLE_GENAI_API_KEY = "mock-google-genai-key";
process.env.GOOGLE_VISION_API_KEY = "mock-google-vision-key";
process.env.GROQ_API_KEY = "mock-groq-key";
process.env.LLM_API_KEY = "mock-llm-key";
process.env.LLM_MODEL = "gpt-4o-mini";
process.env.LLM_PROVIDER = "openai";
process.env.MEDICAL_GUARDRAIL_STRICT = "false";
process.env.MODEL_MAX_RETRIES = "3";
process.env.MODEL_TIMEOUT = "25000";
process.env.OCR_CONFIDENCE_THRESHOLD = "0.7";
process.env.OCR_ENABLED = "true";
process.env.OLLAMA_BASE_URL = "http://localhost:11434";
process.env.OPENAI_API_KEY = "mock-openai-key";
process.env.PIPELINE_ENABLE_FALLBACK = "true";
process.env.PIPELINE_ENABLE_GEMINI = "true";
process.env.PIPELINE_ENABLE_OCR = "true";
process.env.PIPELINE_LANGUAGE = "en";
process.env.PORT = "3000";
process.env.SESSION_TIMEOUT_MS = "900000";
process.env.SESSION_WARNING_MS = "60000";
process.env.TOGETHER_API_KEY = "mock-together-key";
process.env.VERCEL_ENV = "development";
process.env.VERCEL_PROJECT_PRODUCTION_URL = "klaro.app";
process.env.VERCEL_URL = "localhost:3000";
process.env.VECTOR_STORE_PROVIDER = "chroma";
process.env.CAL_COM_API_KEY = "mock-cal-key";
process.env.CAL_COM_BASE_URL = "https://api.cal.com";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key";
process.env.NEXT_PUBLIC_NEON_AUTH_URL = "https://mock.neon.local/auth";
