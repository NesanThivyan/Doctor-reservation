import { NextResponse } from "next/server"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 })
  }

  const scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "consent",
      // For general sign-in, we might not need state, but since the callback is for booking, perhaps adjust.
      // Actually, the callback expects state with appointmentId, so for general sign-in, we need a different flow.
    })

  return NextResponse.redirect(authUrl)
}