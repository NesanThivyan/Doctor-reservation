import { NextResponse } from "next/server"

// This endpoint is deprecated - calendar integration has been removed
export async function GET() {
  return NextResponse.redirect(new URL("/?error=calendar-integration-disabled", "/"))
}

