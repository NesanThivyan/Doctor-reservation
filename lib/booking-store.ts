// In-memory store for bookings with mutex (hold-and-release) mechanism
import type { TimeSlot, Appointment, SlotHold, Patient } from "./types"
import { mockDoctors, generateTimeSlots } from "./mock-data"

const HOLD_DURATION_MS = 5 * 60 * 1000 // 5 minutes hold duration

// In-memory stores (in production, use MongoDB)
const slotsStore = new Map<string, TimeSlot>()
const appointmentsStore = new Map<string, Appointment>()
const holdsStore = new Map<string, SlotHold>()
const patientsStore = new Map<string, Patient>()

// Initialize slots for demonstration
function initializeSlots() {
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]

    mockDoctors.forEach((doctor) => {
      const slots = generateTimeSlots(doctor, dateStr)
      slots.forEach((slot) => {
        slotsStore.set(slot.id, slot)
      })
    })
  }
}

// Initialize on first import
initializeSlots()

// Clean up expired holds
function cleanupExpiredHolds() {
  const now = new Date()
  holdsStore.forEach((hold, holdId) => {
    if (hold.expiresAt < now) {
      // Release the slot
      const slot = slotsStore.get(hold.slotId)
      if (slot && slot.status === "held" && slot.heldBy === hold.patientId) {
        slot.status = "available"
        slot.heldBy = undefined
        slot.heldUntil = undefined
        slotsStore.set(slot.id, slot)
      }
      holdsStore.delete(holdId)
    }
  })
}

// Get available slots for a doctor on a specific date
export function getAvailableSlots(doctorId: string, date: string): TimeSlot[] {
  cleanupExpiredHolds()

  const slots: TimeSlot[] = []
  slotsStore.forEach((slot) => {
    if (slot.doctorId === doctorId && slot.date === date) {
      slots.push(slot)
    }
  })

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// Hold a slot - returns the hold or null if slot is not available
export function holdSlot(slotId: string, patientId: string): SlotHold | null {
  cleanupExpiredHolds()

  const slot = slotsStore.get(slotId)
  if (!slot || slot.status !== "available") {
    return null
  }

  // Create the hold
  const now = new Date()
  const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS)

  const hold: SlotHold = {
    id: `hold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    slotId,
    patientId,
    doctorId: slot.doctorId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    expiresAt,
    createdAt: now,
  }

  // Update slot status
  slot.status = "held"
  slot.heldBy = patientId
  slot.heldUntil = expiresAt
  slotsStore.set(slotId, slot)
  holdsStore.set(hold.id, hold)

  return hold
}

// Release a held slot
export function releaseSlot(holdId: string, patientId: string): boolean {
  const hold = holdsStore.get(holdId)
  if (!hold || hold.patientId !== patientId) {
    return false
  }

  const slot = slotsStore.get(hold.slotId)
  if (slot && slot.status === "held" && slot.heldBy === patientId) {
    slot.status = "available"
    slot.heldBy = undefined
    slot.heldUntil = undefined
    slotsStore.set(slot.id, slot)
  }

  holdsStore.delete(holdId)
  return true
}

// Confirm booking - only works if the patient has a valid hold
export function confirmBooking(
  holdId: string,
  patientId: string,
  patientData: { name: string; email: string; phone: string },
  reason: string,
): Appointment | null {
  cleanupExpiredHolds()

  const hold = holdsStore.get(holdId)
  if (!hold || hold.patientId !== patientId) {
    return null
  }

  // Check if hold is still valid
  if (hold.expiresAt < new Date()) {
    holdsStore.delete(holdId)
    return null
  }

  const slot = slotsStore.get(hold.slotId)
  if (!slot || slot.status !== "held" || slot.heldBy !== patientId) {
    return null
  }

  // Create or update patient
  let patient = patientsStore.get(patientId)
  if (!patient) {
    patient = {
      id: patientId,
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      googleCalendarConnected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    patientsStore.set(patientId, patient)
  } else {
    patient.name = patientData.name
    patient.email = patientData.email
    patient.phone = patientData.phone
    patient.updatedAt = new Date()
    patientsStore.set(patientId, patient)
  }

  // Create appointment
  const appointment: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    patientId,
    doctorId: hold.doctorId,
    timeSlotId: hold.slotId,
    date: hold.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    status: "scheduled",
    reason,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Update slot to booked
  slot.status = "booked"
  slot.heldBy = undefined
  slot.heldUntil = undefined
  slotsStore.set(slot.id, slot)

  // Save appointment and remove hold
  appointmentsStore.set(appointment.id, appointment)
  holdsStore.delete(holdId)

  return appointment
}

// Get appointment by ID
export function getAppointment(appointmentId: string): Appointment | null {
  return appointmentsStore.get(appointmentId) || null
}

// Get patient appointments
export function getPatientAppointments(patientId: string): Appointment[] {
  const appointments: Appointment[] = []
  appointmentsStore.forEach((apt) => {
    if (apt.patientId === patientId) {
      appointments.push(apt)
    }
  })
  return appointments.sort(
    (a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime(),
  )
}

// Get hold time remaining in seconds
export function getHoldTimeRemaining(holdId: string): number {
  const hold = holdsStore.get(holdId)
  if (!hold) return 0

  const remaining = hold.expiresAt.getTime() - Date.now()
  return Math.max(0, Math.floor(remaining / 1000))
}

// Update appointment with Google Calendar event ID
export function updateAppointmentGoogleEvent(appointmentId: string, googleEventId: string): boolean {
  const appointment = appointmentsStore.get(appointmentId)
  if (!appointment) return false

  appointment.googleEventId = googleEventId
  appointment.updatedAt = new Date()
  appointmentsStore.set(appointmentId, appointment)
  return true
}

// Get patient by ID
export function getPatient(patientId: string): Patient | null {
  return patientsStore.get(patientId) || null
}

// Update patient Google Calendar tokens
export function updatePatientGoogleTokens(patientId: string, accessToken: string, refreshToken: string): boolean {
  const patient = patientsStore.get(patientId)
  if (!patient) return false

  patient.googleAccessToken = accessToken
  patient.googleRefreshToken = refreshToken
  patient.googleCalendarConnected = true
  patient.updatedAt = new Date()
  patientsStore.set(patientId, patient)
  return true
}
