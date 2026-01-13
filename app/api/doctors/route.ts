import { NextResponse } from "next/server"
import { getDoctors, initializeDatabase } from "@/lib/db-models"
import { mockDoctors } from "@/lib/mock-data"

export async function GET() {
  try {
    await initializeDatabase()
    const doctors = await getDoctors()

    // Return from DB if available, otherwise return mock data
    if (doctors.length > 0) {
      return NextResponse.json({ success: true, data: doctors })
    }

    return NextResponse.json({ success: true, data: mockDoctors })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    // Fallback to mock data on error
    return NextResponse.json({ success: true, data: mockDoctors })
  }
}
