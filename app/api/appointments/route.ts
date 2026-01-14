import { type NextRequest, NextResponse } from "next/server"
import { confirmBooking, getDoctorById, initializeDatabase } from "@/lib/db-models"
import { mockDoctors } from "@/lib/mock-data"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { holdId, patientId, patientData, reason, addToGoogleCalendar } = body

    if (!holdId || !patientId || !patientData) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    await initializeDatabase()

    const appointment = await confirmBooking(holdId, patientId, patientData, reason || "")

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Failed to confirm booking. The hold may have expired or is invalid." },
        { status: 409 },
      )
    }

    // If Google Calendar integration is requested, generate OAuth URL
    let googleAuthUrl: string | undefined
    if (addToGoogleCalendar && GOOGLE_CLIENT_ID) {
      const state = JSON.stringify({
        appointmentId: appointment.id,
        patientId,
      })

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
        access_type: "offline",
        prompt: "consent",
        state: Buffer.from(state).toString("base64"),
      })

      googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    }

    let doctor = await getDoctorById(appointment.doctorId)
    if (!doctor) {
      doctor = mockDoctors.find((d) => d.id === appointment.doctorId) || null
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment,
        doctor,
        googleAuthUrl,
      },
      message: "Appointment booked successfully",
    })
  } catch (error) {
    console.error("Error confirming appointment:", error)
    return NextResponse.json({ success: false, error: "Failed to confirm appointment" }, { status: 500 })
  }
}
