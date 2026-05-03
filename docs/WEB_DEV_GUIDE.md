# Web Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- Next.js 14+ (already in monorepo)
- TypeScript
- Tailwind CSS

### Project Structure
```
apps/nextjs/
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── scan/           # KL-DS-002: File upload
│   │   ├── results/        # Analysis display
│   │   ├── chat/           # KL-CHAT-001: Chat interface
│   │   ├── doctors/        # KL-DR-001: Doctor search
│   │   └── bookings/       # KL-BK-001: Booking UI
│   ├── components/         # Reusable React components
│   ├── lib/               # Utilities and helpers
│   ├── trpc/              # tRPC client setup
│   └── styles/            # Tailwind CSS configs
├── public/                # Static assets
├── package.json
├── next.config.js
└── tsconfig.json
```

## Key Pages & Features

### 1. Upload Page (apps/nextjs/src/app/scan/)
**Ticket:** KL-DS-002

Features:
- File input with drag-and-drop
- PDF preview with page selector
- Client-side validation
- Progress indicator during upload

Implementation:
```typescript
// apps/nextjs/src/app/scan/page.tsx
'use client';

import { FileUpload } from '@/components/FileUpload';
import { useTRPC } from '@/trpc/client';

export default function ScanPage() {
  const uploadMutation = useTRPC().documents.scan.useMutation();
  
  const handleUpload = async (file: File, pages?: number[]) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pages) formData.append('pages', JSON.stringify(pages));
    
    const result = await uploadMutation.mutateAsync(formData);
    router.push(`/results/${result.documentId}`);
  };
  
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Medical Document</h1>
      <FileUpload onUpload={handleUpload} />
    </div>
  );
}
```

### 2. Results Page (apps/nextjs/src/app/results/[id]/)
**Ticket:** KL-LLM-001, KL-EX-001

Features:
- Display extracted data in table format
- Severity badges with color coding
- Tanong Mo Sa Doktor card
- Copy/Share buttons
- Action buttons: Chat, Book Doctor, Save

Implementation:
```typescript
// apps/nextjs/src/app/results/[id]/page.tsx
export default function ResultsPage({ params }: { params: { id: string } }) {
  const { data: analysis } = useTRPC().documents.get.useQuery({ 
    documentId: params.id 
  });
  
  return (
    <div className="space-y-6">
      <AnalysisTable data={analysis.extractedData} />
      <SummaryCard summary={analysis.summary} severity={analysis.severity} />
      <TanongCard questions={analysis.tanongCard} />
      <ActionButtons documentId={params.id} />
    </div>
  );
}
```

### 3. Chat Page (apps/nextjs/src/app/chat/)
**Ticket:** KL-CHAT-001, KL-LOC-001

Features:
- Side-by-side layout: document + chat
- Message history
- Dialect selector dropdown
- Simplify button per message
- Follow-up suggestions as quick reply buttons

Implementation:
```typescript
// apps/nextjs/src/app/chat/[documentId]/page.tsx
export default function ChatPage({ params }: { params: { documentId: string } }) {
  const [messages, setMessages] = useState([]);
  const [selectedDialect, setSelectedDialect] = useState('fil');
  const chatMutation = useTRPC().chat.sendMessage.useMutation();
  
  const handleSendMessage = async (message: string) => {
    const response = await chatMutation.mutateAsync({
      documentId: params.documentId,
      message,
      dialect: selectedDialect
    });
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: response.response, followUps: response.followUps }
    ]);
  };
  
  return (
    <div className="flex gap-6">
      <DocumentContext documentId={params.documentId} />
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        selectedDialect={selectedDialect}
        onDialectChange={setSelectedDialect}
      />
    </div>
  );
}
```

### 4. Doctors Page (apps/nextjs/src/app/doctors/)
**Ticket:** KL-DR-001

Features:
- Doctor card grid with photo, specialty, rating
- Filter by specialty and price
- Availability slots
- View profile or book appointment

Implementation:
```typescript
// apps/nextjs/src/app/doctors/page.tsx
export default function DoctorsPage() {
  const [filters, setFilters] = useState({ specialty: '', price: '' });
  const { data: doctors } = useTRPC().doctors.list.useQuery(filters);
  
  return (
    <div className="space-y-6">
      <DoctorFilters onFilterChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {doctors?.map(doctor => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
}
```

### 5. Bookings Page (apps/nextjs/src/app/bookings/)
**Ticket:** KL-BK-001

Features:
- View past and upcoming bookings
- Booking status badge
- Cancel or reschedule buttons
- View attached document link

## Components Library

### Reusable Components
```
src/components/
├── FileUpload.tsx        # KL-DS-002: Upload widget
├── AnalysisTable.tsx     # Results display
├── TanongCard.tsx        # Question card
├── ChatInterface.tsx     # KL-CHAT-001: Message UI
├── DoctorCard.tsx        # KL-DR-001: Doctor listing
├── BookingForm.tsx       # KL-BK-001: Booking flow
├── PaymentForm.tsx       # KL-PAY-001: Stripe form
└── MapView.tsx           # KL-MAP-002: Facilities map
```

## State Management

Using React Query + tRPC:
```typescript
// Automatic query caching and invalidation
const { data, isLoading } = useTRPC().documents.get.useQuery({ id });
const mutation = useTRPC().documents.create.useMutation({
  onSuccess: (data) => {
    queryClient.invalidateQueries();
  }
});
```

## Styling

Using Tailwind CSS + shadcn/ui:
```typescript
// apps/nextjs/src/components/Button.tsx
import { cn } from '@/lib/utils';

export function Button({ className, ...props }) {
  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-lg font-semibold transition',
        'bg-blue-600 text-white hover:bg-blue-700',
        className
      )}
      {...props}
    />
  );
}
```

## Testing & QA

### Unit Tests (Jest)
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### Visual Testing
```bash
# Storybook
npm run storybook
```

### Test Checklist
- [ ] File upload accepts PNG/JPG/PDF
- [ ] PDF page selection works correctly
- [ ] Chat responses render within 5 seconds
- [ ] Dialect selector changes response language
- [ ] Doctor cards display all information
- [ ] Booking form validates required fields
- [ ] Share button copies link to clipboard

## Deployment

### Vercel (Recommended)
```bash
# Already configured in vercel.json
vercel deploy --prod
```

### Environment Variables
- See docs/ENV_CONFIG.md for required vars
- Configure in Vercel dashboard

## Performance Optimization

- Image optimization with `next/image`
- Code splitting with dynamic imports
- Server-side rendering for SEO
- CDN caching for static assets
- Database query optimization via tRPC
