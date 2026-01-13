import { type NextRequest, NextResponse } from "next/server"
import { getAvailableSlots, initializeDatabase } from "@/lib/db-models"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const doctorId = searchParams.get("doctorId")
  const date = searchParams.get("date")

  if (!doctorId || !date) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters: doctorId and date" },
      { status: 400 },
    )
  }

  try {
    await initializeDatabase()
    const slots = await getAvailableSlots(doctorId, date)
    return NextResponse.json({ success: true, data: slots })
  } catch (error) {
    console.error("Error fetching slots:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch available slots" }, { status: 500 })
  }
}
