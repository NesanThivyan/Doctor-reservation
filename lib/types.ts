// Data Models for the Appointment System

export interface Doctor {
  id: string
  name: string
  email: string
  specialization: string
  qualification: string
  experience: number // years
  avatar?: string
  bio: string
  consultationFee: number
  availableDays: string[] // e.g., ['Monday', 'Tuesday', 'Wednesday']
  workingHours: {
    start: string // e.g., "09:00"
    end: string // e.g., "17:00"
  }
  slotDuration: number // in minutes
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth?: Date
  gender?: "male" | "female" | "other"
  address?: string
  medicalHistory?: string
  googleCalendarConnected: boolean
  googleAccessToken?: string
  googleRefreshToken?: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeSlot {
  id: string
  doctorId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  status: "available" | "held" | "booked"
  heldBy?: string // patient ID who is holding the slot
  heldUntil?: Date // expiration time for the hold
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  timeSlotId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  reason: string // reason for visit
  notes?: string
  googleEventId?: string // Google Calendar event ID
  createdAt: Date
  updatedAt: Date
}

export interface SlotHold {
  id: string
  slotId: string
  patientId: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  expiresAt: Date
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BookingFormData {
  patientName: string
  patientEmail: string
  patientPhone: string
  reason: string
  addToGoogleCalendar: boolean
}
