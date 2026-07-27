# @klaro/ai-sidecar

LangChain/LangGraph RAG microservice for Klaro. Runs on port **3002**.

## Quick Start

```bash
# Install dependencies
pnpm install --filter @klaro/ai-sidecar

# Build
pnpm --filter @klaro/ai-sidecar build

# Start dev server
pnpm --filter @klaro/ai-sidecar dev

# Run tests
pnpm --filter @klaro/ai-sidecar test
```

## Environment Variables

### Google Gemini (primary LLM)

| Variable               | Precedence | Description                 |
| ---------------------- | ---------- | --------------------------- |
| `GOOGLE_API_KEY`       | 1st        | Standard Google AI key      |
| `GOOGLE_GENAI_API_KEY` | 2nd        | LangChain-specific key name |
| `GEMINI_API_KEY`       | 3rd        | Klaro root `.env` uses this |

The provider is set via `LLM_PROVIDER=gemini` (alias for `google-genai`).  
Default model: `gemini-2.0-flash`.

### Embeddings

| Variable             | Description                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `EMBEDDING_PROVIDER` | `google-genai` or `openai` (default: same as `LLM_PROVIDER`)                               |
| `EMBEDDING_MODEL`    | Model name (default: `text-embedding-004` for Google, `text-embedding-3-small` for OpenAI) |

### Vector Store

| Variable                    | Default                 | Description            |
| --------------------------- | ----------------------- | ---------------------- |
| `VECTOR_STORE_PROVIDER`     | `chroma`                | `chroma` or `supabase` |
| `CHROMA_DB_URL`             | `http://localhost:8000` | ChromaDB endpoint      |
| `SUPABASE_URL`              | —                       | Supabase project URL   |
| `SUPABASE_SERVICE_ROLE_KEY` | —                       | Supabase service key   |

### Chunking

| Variable        | Default | Description            |
| --------------- | ------- | ---------------------- |
| `CHUNK_SIZE`    | `1000`  | Characters per chunk   |
| `CHUNK_OVERLAP` | `200`   | Overlap between chunks |

### Rate Limit Fallback

| Variable              | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `CHAT_MODEL_FALLBACK` | Alternative model spec when primary is rate-limited (e.g. `openai/gpt-4o-mini`) |

### Server

| Variable       | Default | Description          |
| -------------- | ------- | -------------------- |
| `PORT`         | `3002`  | Express listen port  |
| `CORS_ORIGINS` | `*`     | CORS allowed origins |

## API Reference

### `GET /api/health`

Health check.

```json
{ "status": "ok", "service": "ai-sidecar", "version": "1.0.0" }
```

### `POST /api/chat`

Synchronous chat with document-aware RAG.

**Request:**

```json
{
  "question": "What does this lab result mean?",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi, how can I help?" }
  ]
}
```

**Response:**

```json
{
  "answer": "Your blood sugar level is...",
  "followUpQuestions": ["Should I be concerned?", "What foods should I avoid?"]
}
```

### `GET /api/chat/stream`

Server-Sent Events (SSE) streaming endpoint.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `question` | `string` | Yes | The user's question |
| `messages` | `string` | No | JSON-encoded array of `{role, content}` |

**Events:**

```
data: {"event":"status","message":"Starting retrieval..."}
data: {"event":"token","token":"Your"}
data: {"event":"token","token":" blood"}
data: {"event":"token","token":" sugar"}
data: {"event":"status","message":"Generation complete"}
data: {"event":"complete","answer":"Your blood sugar level is...","followUpQuestions":["..."]}
```

**Error events:**

```
data: {"error":"Quota or rate limit exceeded","code":429}
```

### `POST /api/ingest`

Upload a document for vector indexing. Accepts `multipart/form-data` with a `file` field.

**Supported types:** `application/pdf`, `image/png`, `image/jpeg`, `image/webp`  
**Max file size:** 20 MB

```json
{ "status": "ok", "ingested": true, "docCount": 12 }
```

## .NET Client Examples

### Consuming the SSE stream (`GET /api/chat/stream`)

```csharp
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;

public class ChatStreamEvent
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("answer")]
    public string? Answer { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("code")]
    public int? Code { get; set; }
}

public async Task StreamChatAsync(string question, List<(string role, string content)> messages)
{
    var messagesJson = JsonSerializer.Serialize(
        messages.Select(m => new { role = m.role, content = m.content })
    );

    var url = $"http://localhost:3002/api/chat/stream?question={Uri.EscapeDataString(question)}&messages={Uri.EscapeDataString(messagesJson)}";

    using var httpClient = new HttpClient();
    using var response = await httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);

    response.EnsureSuccessStatusCode();

    using var stream = await response.Content.ReadAsStreamAsync();
    using var reader = new StreamReader(stream);

    var fullAnswer = new StringBuilder();

    while (!reader.EndOfStream)
    {
        var line = await reader.ReadLineAsync();

        if (string.IsNullOrEmpty(line) || !line.StartsWith("data: "))
            continue;

        var json = line.Substring(6); // strip "data: " prefix
        var chatEvent = JsonSerializer.Deserialize<ChatStreamEvent>(json);

        if (chatEvent == null) continue;

        switch (chatEvent.Event)
        {
            case "token":
                Console.Write(chatEvent.Token);
                fullAnswer.Append(chatEvent.Token);
                break;

            case "complete":
                Console.WriteLine();
                Console.WriteLine("=== Full Answer ===");
                Console.WriteLine(chatEvent.Answer);
                break;

            case "status":
                Console.WriteLine($"[{chatEvent.Event}] {chatEvent.Token ?? chatEvent.Message}");
                break;
        }

        if (chatEvent.Error != null)
        {
            Console.Error.WriteLine($"Error ({chatEvent.Code}): {chatEvent.Error}");
        }
    }
}
```

### POST to the synchronous chat endpoint

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class ChatResponse
{
    public string? Answer { get; set; }
    public List<string>? FollowUpQuestions { get; set; }
}

public async Task<ChatResponse> ChatAsync(string question, List<(string role, string content)> messages)
{
    using var client = new HttpClient();

    var body = new
    {
        question,
        messages = messages.Select(m => new { role = m.role, content = m.content })
    };

    var json = JsonSerializer.Serialize(body);
    var content = new StringContent(json, Encoding.UTF8, "application/json");

    var response = await client.PostAsync("http://localhost:3002/api/chat", content);
    response.EnsureSuccessStatusCode();

    var responseJson = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<ChatResponse>(responseJson)
           ?? throw new InvalidOperationException("Deserialization failed");
}
```

### Upload a document for ingest

```csharp
using System.Net.Http;

public async Task<bool> IngestDocumentAsync(string filePath)
{
    using var client = new HttpClient();
    using var formData = new MultipartFormDataContent();
    using var fileStream = File.OpenRead(filePath);
    using var fileContent = new StreamContent(fileStream);

    formData.Add(fileContent, "file", Path.GetFileName(filePath));

    var response = await client.PostAsync("http://localhost:3002/api/ingest", formData);
    return response.IsSuccessStatusCode;
}
```

## Vercel Deployment

The `api/index.ts` file exports the Express app as a Vercel serverless function.
Configure `AI_SIDECAR_URL` in the consuming application to point to the deployed URL.

```bash
vercel --prod
```

## Architecture

```
┌──────────────────────────────────────────────┐
│              Express Server (3002)             │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ /health  │ │  /chat   │ │   /ingest      │ │
│  └────┬─────┘ └────┬─────┘ └───────┬────────┘ │
│       │            │               │          │
│       ▼            ▼               ▼          │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  Simple  │ │ Retrieval│ │   Ingestion    │ │
│  │  Health  │ │  Graph   │ │    Graph       │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
│                      │               │        │
│                      ▼               ▼        │
│               ┌────────────┐ ┌──────────────┐ │
│               │ ChromaDB / │ │   PDF Parse   │ │
│               │ Supabase   │ │  → Chunk      │ │
│               │ Vector DB  │ │  → Embed      │ │
│               └────────────┘ └──────────────┘ │
└──────────────────────────────────────────────┘
```
