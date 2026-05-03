# Mobile Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS simulator or Xcode for iOS development
- Android Studio for Android emulator

### Project Structure
```
apps/expo/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   └── post/
│       └── [id].tsx
├── src/
│   ├── app/               # Screen components
│   │   ├── home/
│   │   ├── scan/          # KL-DS-001: Camera capture
│   │   ├── chat/          # KL-CHAT-001: Chat UI
│   │   ├── map/           # KL-MAP-002: Facilities map
│   │   ├── doctors/       # KL-DR-001: Doctor listing
│   │   └── booking/       # KL-BK-001: Booking flow
│   ├── styles/            # Global styles and Tailwind
│   ├── components/        # Reusable components
│   └── utils/
│       ├── api.tsx        # tRPC client
│       ├── auth.ts        # Auth utilities
│       └── storage.ts     # LocalStorage helpers
├── package.json
└── app.config.ts          # Expo configuration
```

## Key Screens & Features

### 1. Home Screen (apps/expo/src/app/home/)
- Guest vs Registered mode toggle
- "Scan Document" button → scan/
- Recent documents list (if logged in)
- Navigation tabs: Home, Scan, Chat, Map, Profile

### 2. Scan Screen (apps/expo/src/app/scan/)
**Ticket:** KL-DS-001

Features:
- Camera capture with live guide overlay
- Auto-crop and edge detection
- Local preprocessing (deskew, denoise)
- Upload progress indicator
- Resumable upload support

Implementation:
```typescript
// apps/expo/src/app/scan/index.tsx
import { CameraView } from 'expo-camera';
import { useTRPC } from '../utils/api';

export default function ScanScreen() {
  const uploadDocument = useTRPC().documents.scan.useMutation();
  
  const handleCapture = async (uri: string) => {
    // 1. Local preprocessing (deskew, denoise)
    const processed = await preprocessImage(uri);
    
    // 2. Upload to /api/documents/scan
    const result = await uploadDocument.mutateAsync({
      file: processed,
      documentType: 'lab_result'
    });
    
    // 3. Navigate to results
    router.push(`/results/${result.documentId}`);
  };
  
  return (
    <CameraView onCaptured={handleCapture}>
      <AlignmentGuide />
    </CameraView>
  );
}
```

### 3. Chat Screen (apps/expo/src/app/chat/)
**Ticket:** KL-CHAT-001, KL-LOC-001

Features:
- Document context display
- Message input with auto-complete
- Dialect detection and selection (Tagalog/Bisaya/Ilocano)
- Simplify button for each response
- Follow-up suggestions

Implementation:
```typescript
// apps/expo/src/app/chat/index.tsx
const chatMutation = useTRPC().chat.sendMessage.useMutation();

const sendMessage = async (message: string) => {
  const response = await chatMutation.mutateAsync({
    documentId,
    message,
    dialect: selectedDialect  // 'fil' | 'bis' | 'ilo'
  });
  
  setMessages([...messages, { role: 'user', content: message }]);
  setMessages([...messages, { role: 'assistant', content: response }]);
};
```

### 4. Facilities Map Screen (apps/expo/src/app/map/)
**Ticket:** KL-MAP-002

Features:
- Google Maps integration with react-native-maps
- Clinic/hospital pins clustered
- Filter by PhilHealth, specialty, open-now
- Tap facility to see details + booking CTA
- Offline map support

Implementation:
```typescript
// apps/expo/src/app/map/index.tsx
import MapView, { Marker, Callout } from 'react-native-maps';

export default function MapScreen() {
  const { data: facilities } = useTRPC().facilities.nearby.useQuery({
    latitude, longitude, radiusKm: 5
  });
  
  return (
    <MapView initialRegion={initialRegion}>
      {facilities?.map(fac => (
        <Marker key={fac.id} coordinate={{ 
          latitude: fac.latitude, 
          longitude: fac.longitude 
        }}>
          <Callout onPress={() => bookDoctor(fac)}>
            <FacilityCard facility={fac} />
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
```

### 5. Doctor Listing & Booking (apps/expo/src/app/booking/)
**Ticket:** KL-DR-001, KL-BK-001

Features:
- Filter doctors by specialty and price
- View availability slots
- Confirm booking with document attachment
- Session type selection (chat/video/async)

Implementation:
```typescript
const bookingMutation = useTRPC().bookings.create.useMutation();

const confirmBooking = async (doctorId, sessionType, slotDateTime) => {
  const booking = await bookingMutation.mutateAsync({
    doctorId,
    documentId,  // Auto-attached
    sessionType,
    proposedDateTime: slotDateTime
  });
  
  // Redirect to payment screen
  router.push(`/payment/${booking.bookingId}`);
};
```

## Testing & QA

### Device Testing
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Expo Preview (over-the-air)
npm start
```

### Test Checklist
- [ ] Camera capture works on both iOS and Android
- [ ] Auto-crop accuracy >=90% on demo images
- [ ] Uploads resume after network interruption
- [ ] Maps render smoothly with 100+ pins
- [ ] Chat responds within 5 seconds
- [ ] Dialect detection accuracy >=85%

## Debugging

### Enable Debug Logs
```typescript
// In development, enable verbose logs
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(false);
```

### Common Issues
1. **Expo build fails:** Clear cache with `expo prebuild --clean`
2. **API calls timeout:** Check `EXPO_PUBLIC_API_URL` in .env
3. **Camera permission denied:** Ensure `app.json` has camera permission

## Performance Considerations

- Lazy load map pins (paginate by 50)
- Cache document analyses locally with React Query
- Debounce chat input (300ms)
- Compress images before upload (target <2MB)
