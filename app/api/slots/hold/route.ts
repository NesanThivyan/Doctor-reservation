import { type NextRequest, NextResponse } from "next/server"
import { holdSlot, initializeDatabase } from "@/lib/db-models"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slotId, patientId } = body

    if (!slotId || !patientId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: slotId and patientId" },
        { status: 400 },
      )
    }

    await initializeDatabase()
    const hold = await holdSlot(slotId, patientId)

    if (!hold) {
      return NextResponse.json(
        { success: false, error: "Slot is no longer available. Please select another slot." },
        { status: 409 },
      )
    }

    return NextResponse.json({ success: true, data: hold })
  } catch (error) {
    console.error("Error holding slot:", error)
    return NextResponse.json({ success: false, error: "Failed to hold slot" }, { status: 500 })
  }
}
