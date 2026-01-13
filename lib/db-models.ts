import { connectToDatabase, COLLECTIONS } from "./mongodb"
import type { Doctor, Patient, TimeSlot, Appointment, SlotHold } from "./types"
import { mockDoctors, generateTimeSlots } from "./mock-data"

const HOLD_DURATION_MS = 5 * 60 * 1000 // 5 minutes hold duration

// Initialize database with doctors and time slots
export async function initializeDatabase() {
  const { db } = await connectToDatabase()

  // Check if doctors already exist
  const existingDoctors = await db.collection(COLLECTIONS.DOCTORS).countDocuments()
  if (existingDoctors === 0) {
    // Insert mock doctors
    await db.collection(COLLECTIONS.DOCTORS).insertMany(
      mockDoctors.map((doc) => ({
        ...doc,
        _id: doc.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    console.log("Initialized doctors collection")
  }

  // Generate time slots for the next 14 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]

    for (const doctor of mockDoctors) {
      // Check if slots exist for this doctor and date
      const existingSlots = await db.collection(COLLECTIONS.TIME_SLOTS).countDocuments({
        doctorId: doctor.id,
        date: dateStr,
      })

      if (existingSlots === 0) {
        const slots = generateTimeSlots(doctor, dateStr)
        if (slots.length > 0) {
          await db.collection(COLLECTIONS.TIME_SLOTS).insertMany(
            slots.map((slot) => ({
              ...slot,
              _id: slot.id,
            })),
          )
        }
      }
    }
  }
  console.log("Time slots initialized")
}

// Clean up expired holds
export async function cleanupExpiredHolds() {
  const { db } = await connectToDatabase()
  const now = new Date()

  // Find expired holds
  const expiredHolds = await db
    .collection(COLLECTIONS.SLOT_HOLDS)
    .find({ expiresAt: { $lt: now } })
    .toArray()

  for (const hold of expiredHolds) {
    // Release the slot
    await db.collection(COLLECTIONS.TIME_SLOTS).updateOne(
      {
        _id: hold.slotId,
        status: "held",
        heldBy: hold.patientId,
      },
      {
        $set: {
          status: "available",
          updatedAt: now,
        },
        $unset: {
          heldBy: "",
          heldUntil: "",
        },
      },
    )

    // Remove the hold
    await db.collection(COLLECTIONS.SLOT_HOLDS).deleteOne({ _id: hold._id })
  }
}

// Get all doctors
export async function getDoctors(): Promise<Doctor[]> {
  const { db } = await connectToDatabase()
  const doctors = await db.collection(COLLECTIONS.DOCTORS).find({}).toArray()
  return doctors as unknown as Doctor[]
}

// Get doctor by ID
export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  const { db } = await connectToDatabase()
  const doctor = await db.collection(COLLECTIONS.DOCTORS).findOne({ _id: doctorId })
  return doctor as unknown as Doctor | null
}

// Get available slots for a doctor on a specific date
export async function getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  await cleanupExpiredHolds()
  const { db } = await connectToDatabase()

  const slots = await db.collection(COLLECTIONS.TIME_SLOTS).find({ doctorId, date }).sort({ startTime: 1 }).toArray()

  return slots as unknown as TimeSlot[]
}

// Hold a slot with mutex mechanism
export async function holdSlot(slotId: string, patientId: string): Promise<SlotHold | null> {
  await cleanupExpiredHolds()
  const { db } = await connectToDatabase()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS)

  // Atomic update - only succeeds if slot is available
  const result = await db.collection(COLLECTIONS.TIME_SLOTS).findOneAndUpdate(
    {
      _id: slotId,
      status: "available",
    },
    {
      $set: {
        status: "held",
        heldBy: patientId,
        heldUntil: expiresAt,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  )

  if (!result) {
    return null
  }

  const slot = result as unknown as TimeSlot

  // Create hold record
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

  await db.collection(COLLECTIONS.SLOT_HOLDS).insertOne({
    _id: hold.id,
    ...hold,
  })

  return hold
}

// Release a held slot
export async function releaseSlot(holdId: string, patientId: string): Promise<boolean> {
  const { db } = await connectToDatabase()

  const hold = await db.collection(COLLECTIONS.SLOT_HOLDS).findOne({
    _id: holdId,
    patientId,
  })

  if (!hold) {
    return false
  }

  // Release the slot
  await db.collection(COLLECTIONS.TIME_SLOTS).updateOne(
    {
      _id: hold.slotId,
      status: "held",
      heldBy: patientId,
    },
    {
      $set: {
        status: "available",
        updatedAt: new Date(),
      },
      $unset: {
        heldBy: "",
        heldUntil: "",
      },
    },
  )

  // Delete the hold
  await db.collection(COLLECTIONS.SLOT_HOLDS).deleteOne({ _id: holdId })

  return true
}

// Confirm booking - atomic operation to prevent race conditions
export async function confirmBooking(
  holdId: string,
  patientId: string,
  patientData: { name: string; email: string; phone: string },
  reason: string,
): Promise<Appointment | null> {
  await cleanupExpiredHolds()
  const { db } = await connectToDatabase()

  // Get the hold
  const hold = await db.collection(COLLECTIONS.SLOT_HOLDS).findOne({
    _id: holdId,
    patientId,
  })

  if (!hold) {
    return null
  }

  // Check if hold is still valid
  if (new Date(hold.expiresAt) < new Date()) {
    await db.collection(COLLECTIONS.SLOT_HOLDS).deleteOne({ _id: holdId })
    return null
  }

  const now = new Date()

  // Atomic update - book the slot only if it's still held by this patient
  const slotResult = await db.collection(COLLECTIONS.TIME_SLOTS).findOneAndUpdate(
    {
      _id: hold.slotId,
      status: "held",
      heldBy: patientId,
    },
    {
      $set: {
        status: "booked",
        updatedAt: now,
      },
      $unset: {
        heldBy: "",
        heldUntil: "",
      },
    },
    { returnDocument: "after" },
  )

  if (!slotResult) {
    return null
  }

  // Create or update patient
  await db.collection(COLLECTIONS.PATIENTS).updateOne(
    { _id: patientId },
    {
      $set: {
        name: patientData.name,
        email: patientData.email,
        phone: patientData.phone,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: patientId,
        googleCalendarConnected: false,
        createdAt: now,
      },
    },
    { upsert: true },
  )

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
    createdAt: now,
    updatedAt: now,
  }

  await db.collection(COLLECTIONS.APPOINTMENTS).insertOne({
    _id: appointment.id,
    ...appointment,
  })

  // Delete the hold
  await db.collection(COLLECTIONS.SLOT_HOLDS).deleteOne({ _id: holdId })

  return appointment
}

// Get appointment by ID
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  const { db } = await connectToDatabase()
  const appointment = await db.collection(COLLECTIONS.APPOINTMENTS).findOne({ _id: appointmentId })
  return appointment as unknown as Appointment | null
}

// Get patient appointments
export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  const { db } = await connectToDatabase()
  const appointments = await db
    .collection(COLLECTIONS.APPOINTMENTS)
    .find({ patientId })
    .sort({ date: 1, startTime: 1 })
    .toArray()
  return appointments as unknown as Appointment[]
}

// Get hold time remaining in seconds
export async function getHoldTimeRemaining(holdId: string): Promise<number> {
  const { db } = await connectToDatabase()
  const hold = await db.collection(COLLECTIONS.SLOT_HOLDS).findOne({ _id: holdId })

  if (!hold) return 0

  const remaining = new Date(hold.expiresAt).getTime() - Date.now()
  return Math.max(0, Math.floor(remaining / 1000))
}

// Update appointment with Google Calendar event ID
export async function updateAppointmentGoogleEvent(appointmentId: string, googleEventId: string): Promise<boolean> {
  const { db } = await connectToDatabase()

  const result = await db.collection(COLLECTIONS.APPOINTMENTS).updateOne(
    { _id: appointmentId },
    {
      $set: {
        googleEventId,
        updatedAt: new Date(),
      },
    },
  )

  return result.modifiedCount > 0
}

// Get patient by ID
export async function getPatient(patientId: string): Promise<Patient | null> {
  const { db } = await connectToDatabase()
  const patient = await db.collection(COLLECTIONS.PATIENTS).findOne({ _id: patientId })
  return patient as unknown as Patient | null
}

// Update patient Google Calendar tokens
export async function updatePatientGoogleTokens(
  patientId: string,
  accessToken: string,
  refreshToken: string,
): Promise<boolean> {
  const { db } = await connectToDatabase()

  const result = await db.collection(COLLECTIONS.PATIENTS).updateOne(
    { _id: patientId },
    {
      $set: {
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleCalendarConnected: true,
        updatedAt: new Date(),
      },
    },
  )

  return result.modifiedCount > 0
}
