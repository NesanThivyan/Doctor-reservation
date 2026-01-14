import { NextResponse } from "next/server"
import { connectToDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { appointmentId, patientId } = body

    if (!appointmentId || !patientId) {
      return NextResponse.json(
        { success: false, error: "Missing appointmentId or patientId" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Find the appointment
    const appointment = await db.collection(COLLECTIONS.APPOINTMENTS).findOne({ _id: appointmentId })

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    // Verify the appointment belongs to the user
    if (appointment.patientId !== patientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to cancel this appointment" },
        { status: 403 },
      )
    }

    // Check if appointment is already completed or cancelled
    if (appointment.status === "completed" || appointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: `Cannot cancel a ${appointment.status} appointment` },
        { status: 409 },
      )
    }

    // Update appointment status to cancelled
    const result = await db.collection(COLLECTIONS.APPOINTMENTS).updateOne(
      { _id: appointmentId },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to cancel appointment" }, { status: 500 })
    }

    // Release the slot back to available
    const timeSlot = await db.collection(COLLECTIONS.TIME_SLOTS).findOne({ _id: appointment.timeSlotId })

    if (timeSlot) {
      await db.collection(COLLECTIONS.TIME_SLOTS).updateOne(
        { _id: appointment.timeSlotId },
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
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        appointmentId,
        status: "cancelled",
      },
    })
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return NextResponse.json({ success: false, error: "Failed to cancel appointment" }, { status: 500 })
  }
}
