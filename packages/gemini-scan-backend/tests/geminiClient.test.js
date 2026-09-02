describe('geminiClient normalization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.MOCK_GEMINI;
  });

  it('returns a medical fallback result in mock mode', async () => {
    process.env.MOCK_GEMINI = 'true';
    process.env.GEMINI_API_KEY = '';

    const { processImages } = await import('../src/geminiClient');
    const result = await processImages(
      [{ filename: 'scan.jpg', buffer: Buffer.from('abc') }],
      { task: 'medical_scan', language: 'English' },
      { requestId: 'mock-1' },
    );

    expect(result.requestId).toBe('mock-1');
    expect(result.status).toBe('completed');
    expect(result.source).toBe('mock');
    expect(result.urgency).toBe('MODERATE');
    expect(result.plainLanguageSummary).toContain('processed successfully');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations).toHaveLength(3);
  });

  it('normalizes Gemini JSON into the scan response contract', async () => {
    process.env.MOCK_GEMINI = 'false';
    process.env.GEMINI_API_KEY = 'test-key';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        documentType: 'medical_scan',
        confidence: 0.88,
        fields: {
          glucose: { value: '210', flagged: true },
          a1c: { value: '9.2', flagged: true },
        },
        warnings: ['critical result detected'],
      }),
    });
    global.fetch = fetchMock;

    const { processImages } = await import('../src/geminiClient');
    const result = await processImages(
      [{ filename: 'scan.jpg', buffer: Buffer.from('abc') }],
      { task: 'medical_scan', language: 'English' },
      { requestId: 'live-1' },
    );

    expect(fetchMock).toHaveBeenCalled();
    expect(result.requestId).toBe('live-1');
    expect(result.status).toBe('completed');
    expect(result.source).toBe('llm');
    expect(result.urgency).toBe('HIGH');
    expect(result.plainLanguageSummary).toBeTruthy();
    expect(result.analysis).toBeTruthy();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('never instructs the model to persist or locate the received images', async () => {
    const { buildSystemPrompt } = await import('../src/prompts');

    for (const metadata of [{}, { task: 'medical_scan' }]) {
      const prompt = buildSystemPrompt(metadata);
      // RA 10173: the model must not be told to store images or return a location.
      expect(prompt).toContain('Do not persist');
      expect(prompt).not.toContain('storage_presigned_url');
      expect(prompt).not.toContain('storage_path');
      expect(prompt).not.toMatch(/save received images/i);
    }
  });
});