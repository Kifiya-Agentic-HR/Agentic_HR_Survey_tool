# Kifiya AI Interview Platform

![Kifiya Logo](https://kifiya.com/wp-content/uploads/2022/12/Logo.svg)

A next-generation virtual interview system powered by AI, featuring robust anti-cheat mechanisms and seamless candidate experience.

## Features

- 🧠 AI-Powered Conversational Interface
- 🛡️ Real-time Anti-Cheating System
  - Face Detection & Recognition
  - Tab Switching Monitoring
  - Copy/Paste Prevention
  - Fullscreen Enforcement
- 📹 Device Check System (Camera/Mic)
- 📜 Session Management with Local Storage
- 🎨 Consistent Kifiya Branding (#364957 Color Scheme)
- 🚀 Smooth Animations & Transitions

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui Components
- **State Management**: React Query
- **Animations**: Framer Motion
- **Face Detection**: TensorFlow.js
- **Video Handling**: Media Devices API

## Installation

```bash
npm install
npm run dev
```

## Configuration

Create `.env.local` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Project Structure

```
├── app/               # App router entries
├── components/        # Reusable components
├── hooks/             # Custom hooks
├── lib/               # API clients & utilities
├── pages/             # Special pages
├── public/            # Static assets
└── styles/            # Global styles
```

## Key Components

### `ChatInterface.tsx`
- Handles AI conversation flow
- Integrates with video monitoring
- Implements anti-cheat warnings
- Uses WebSocket/API for real-time communication

### `PreInterviewCheck.tsx`
- Device compatibility verification
- Camera/microphone testing
- Face detection calibration
- User consent management

### `VideoFeed.tsx`
- Picture-in-picture video monitoring
- Drag-and-drop positioning
- Real-time face tracking
- Violation detection overlay

## Anti-Cheat System

```typescript
interface Violation {
  type: "MINOR" | "MAJOR";
  description: string;
  weight: number;
  timestamp: number;
}

const VIOLATION_WEIGHTS = {
  COPY_PASTE: 0.5,
  FACE_AWAY: 0.5,
  TAB_SWITCH: 2,
  WINDOW_MINIMIZE: 2,
  MULTIPLE_FACES: 3
};
```

Features:
- Fullscreen enforcement
- Tab switching detection
- Window focus monitoring
- Copy/paste prevention
- Face presence verification

## API Integration

```typescript
// lib/api.ts
interface SessionResponse {
  success: boolean;
  sessionId?: string;
  chatHistory: ChatMessage[];
  error?: string;
}

interface ChatResponse {
  state: 'welcome' | 'ongoing' | 'completed';
  text: string;
  success: boolean;
  error?: string;
}

// Core functions
createSession(interviewId: string): Promise<SessionResponse>
sendChatMessage(sessionId: string, message: string): Promise<ChatResponse>
flagInterview(sessionId: string, violations: string): Promise<{ success: boolean }>
```

## Development Guidelines

1. **Branding Compliance**
   - Use Kifiya blue (#364957) for primary actions
   - Maintain logo aspect ratio (120x32px)
   - Follow motion design principles

2. **Security Requirements**
   - All API calls must include session validation
   - Sensitive operations require user consent
   - Never store session data in reducers

3. **Performance**
   - Limit video resolution to 720p
   - Optimize face detection model loading
   - Implement lazy loading for non-critical components

## Gotchas

⚠️ **Browser Permissions**
- Requires HTTPS for media devices
- Needs camera/mic permissions
- Safari has strict fullscreen policies

💡 **Pro Tips**
- Use `useAntiCheat` hook for new interview flows
- Maintain session ID in localStorage
- Validate device capabilities before interview start

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Internal © [Kifiya Technologies](https://kifiya.com)

---

**Made with ❤️ by Kifiya Technologies**  
*Empowering Digital Recruitment in Africa*