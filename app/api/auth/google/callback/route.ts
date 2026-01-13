import { type NextRequest, NextResponse } from "next/server"
import { getAppointment, updateAppointmentGoogleEvent, updatePatientGoogleTokens, getDoctorById } from "@/lib/db-models"
import { mockDoctors } from "@/lib/mock-data"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const error = searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/?booking=error", request.url))
  }

  try {
    // Decode state
    const state = JSON.parse(Buffer.from(stateParam, "base64").toString())
    const { appointmentId, patientId } = state

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth credentials not configured")
      return NextResponse.redirect(new URL("/?booking=success&calendar=not-configured", request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      console.error("Failed to get access token:", tokens)
      return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
    }

    if (tokens.refresh_token) {
      await updatePatientGoogleTokens(patientId, tokens.access_token, tokens.refresh_token)
    }

    const appointment = await getAppointment(appointmentId)
    if (!appointment) {
      return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
    }

    let doctor = await getDoctorById(appointment.doctorId)
    if (!doctor) {
      doctor = mockDoctors.find((d) => d.id === appointment.doctorId) || null
    }

    if (!doctor) {
      return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
    }

    // Create Google Calendar event
    const event = {
      summary: `Doctor Appointment with ${doctor.name}`,
      description: `Appointment with ${doctor.name} (${doctor.specialization})\n\nReason: ${appointment.reason || "General consultation"}\n\nFee: $${doctor.consultationFee}`,
      start: {
        dateTime: `${appointment.date}T${appointment.startTime}:00`,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: `${appointment.date}T${appointment.endTime}:00`,
        timeZone: "America/New_York",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    }

    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    const calendarEvent = await calendarResponse.json()

    if (calendarEvent.id) {
      await updateAppointmentGoogleEvent(appointmentId, calendarEvent.id)
      return NextResponse.redirect(new URL("/?booking=success&calendar=added", request.url))
    } else {
      console.error("Failed to create calendar event:", calendarEvent)
      return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
    }
  } catch (error) {
    console.error("Error in Google OAuth callback:", error)
    return NextResponse.redirect(new URL("/?booking=success&calendar=error", request.url))
  }
}
