import { type NextRequest, NextResponse } from "next/server"
import { releaseSlot } from "@/lib/db-models"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { holdId, patientId } = body

    if (!holdId || !patientId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: holdId and patientId" },
        { status: 400 },
      )
    }

    const released = await releaseSlot(holdId, patientId)

    return NextResponse.json({
      success: true,
      data: { released },
      message: released ? "Slot released successfully" : "Slot was already released or not found",
    })
  } catch (error) {
    console.error("Error releasing slot:", error)
    return NextResponse.json({ success: false, error: "Failed to release slot" }, { status: 500 })
  }
}
