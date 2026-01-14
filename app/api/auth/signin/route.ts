import { NextResponse } from "next/server"
import { connectToDatabase, COLLECTIONS } from "@/lib/mongodb"
import { scryptSync } from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection(COLLECTIONS.PATIENTS).findOne({ email })
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const hashed = scryptSync(password, user.passwordSalt, 64).toString("hex")

    if (hashed !== user.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // NOTE: For a real app, return a session token or set a secure cookie here
    return NextResponse.json({ success: true, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
