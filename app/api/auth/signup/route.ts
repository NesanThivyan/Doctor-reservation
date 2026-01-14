import { NextResponse } from "next/server"
import { connectToDatabase, COLLECTIONS } from "@/lib/mongodb"
import { randomBytes, scryptSync } from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const existing = await db.collection(COLLECTIONS.PATIENTS).findOne({ email })
    if (existing) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 409 })
    }

    const salt = randomBytes(16).toString("hex")
    const hashed = scryptSync(password, salt, 64).toString("hex")

    const id = `patient-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const now = new Date()

    const patient = {
      _id: id,
      name,
      email,
      passwordHash: hashed,
      passwordSalt: salt,
      googleCalendarConnected: false,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection(COLLECTIONS.PATIENTS).insertOne(patient as any)

    return NextResponse.json({ success: true, user: { id, name, email } })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
