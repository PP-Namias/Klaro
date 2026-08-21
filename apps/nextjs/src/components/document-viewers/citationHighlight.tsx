"use client";

export interface Citation {
  text: string;
  page?: number;
  confidence?: number;
}

export function highlightCitations(text: string, citations: Citation[]): React.ReactNode {
  if (!citations.length || !text) return text;

  let highlighted = text;
  const markers: { start: number; end: number }[] = [];

  for (const c of citations) {
    const idx = text.toLowerCase().indexOf(c.text.toLowerCase());
    if (idx === -1) continue;
    markers.push({ start: idx, end: idx + c.text.length });
  }

  if (markers.length === 0) return text;

  markers.sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let last = 0;
  markers.forEach((m, i) => {
    if (m.start > last) parts.push(text.slice(last, m.start));
    parts.push(
      <mark
        key={i}
        style={{
          backgroundColor: "#fef08a",
          padding: "0 2px",
          borderRadius: "3px",
          borderBottom: "2px solid #eab308",
        }}
        data-citation={citations[i]?.text}
        title="Citation - extracted lab value"
      >
        {text.slice(m.start, m.end)}
      </mark>,
    );
    last = m.end;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
