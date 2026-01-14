import { NextResponse } from "next/server"
import { connectToDatabase, COLLECTIONS } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Missing patientId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch all appointments for the user
    const appointments = await db
      .collection(COLLECTIONS.APPOINTMENTS)
      .find({ patientId })
      .sort({ date: -1 })
      .toArray()

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No appointments found",
      })
    }

    // Enrich appointments with doctor details
    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt: any) => {
        let doctor: any = await db.collection(COLLECTIONS.DOCTORS).findOne({ _id: apt.doctorId })

        // If not found in DB, try mock data
        if (!doctor) {
          const { mockDoctors } = await import("@/lib/mock-data")
          doctor = mockDoctors.find((d) => d.id === apt.doctorId) || null
        }

        return {
          ...apt,
          doctor,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: enrichedAppointments,
    })
  } catch (error) {
    console.error("Error fetching user appointments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch appointments" }, { status: 500 })
  }
}
