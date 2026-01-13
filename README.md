# MediBook - Doctor Appointment Reservation System

A modern, full-stack appointment booking system for healthcare providers with real-time slot management, hold-and-release mechanism to prevent double bookings, and Google Calendar integration.

## Features

- **Real-time Slot Management**: View and book available appointment slots in real-time
- **Hold-and-Release Mechanism**: 5-minute slot holds prevent double bookings (mutex pattern)
- **Google Calendar Integration**: Automatically add appointments to your Google Calendar with reminders
- **Responsive Design**: Beautiful, mobile-first design that works on all devices
- **Doctor Profiles**: Browse qualified healthcare professionals by specialization
- **Contact Form**: Easy way for patients to reach out with questions

## Tech Stack

- **Frontend**: React.js, Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB (with in-memory fallback for development)
- **Authentication**: Google OAuth 2.0 for Calendar integration
- **Containerization**: Docker & Docker Compose

## Data Model

### Doctor
- id, name, email, specialization, qualification
- experience, avatar, bio, consultationFee
- availableDays, workingHours, slotDuration

### Patient
- id, name, email, phone
- dateOfBirth, gender, address, medicalHistory
- googleCalendarConnected, googleAccessToken, googleRefreshToken

### TimeSlot
- id, doctorId, date, startTime, endTime
- status (available | held | booked)
- heldBy, heldUntil

### Appointment
- id, patientId, doctorId, timeSlotId
- date, startTime, endTime
- status (scheduled | completed | cancelled | no-show)
- reason, notes, googleEventId

### SlotHold (for mutex mechanism)
- id, slotId, patientId, doctorId
- date, startTime, endTime
- expiresAt, createdAt

## Hold-and-Release Mechanism

The system implements a mutex-like pattern to prevent double bookings:

1. When a patient selects a time slot, it's "held" for 5 minutes
2. During this hold period, the slot appears unavailable to other users
3. If the booking is completed, the slot status changes to "booked"
4. If the hold expires without confirmation, the slot is automatically released
5. Patients can manually release holds if they change their mind

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (for containerized deployment)
- Google Cloud Console project (for Calendar integration)

### Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build just the app
docker build -t medibook .
docker run -p 3000:3000 medibook
```

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## API Endpoints

- `GET /api/slots?doctorId=&date=` - Get available slots
- `POST /api/slots/hold` - Hold a slot (returns holdId)
- `POST /api/slots/release` - Release a held slot
- `POST /api/appointments` - Confirm booking with held slot
- `GET /api/auth/google/callback` - Google OAuth callback

## License

MIT
