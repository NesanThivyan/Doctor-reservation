import { MongoClient, type Db } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://srithivyanesan2002_db_user:1iejISeZJL21Fx4z@cluster0.o3p3uc4.mongodb.net/medibook?retryWrites=true&w=majority"

const MONGODB_DB = process.env.MONGODB_DB || "medibook"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI, options)

  await client.connect()
  const db = client.db(MONGODB_DB)

  cachedClient = client
  cachedDb = db

  console.log("Connected to MongoDB successfully")

  return { client, db }
}

// Collection names
export const COLLECTIONS = {
  DOCTORS: "doctors",
  PATIENTS: "patients",
  TIME_SLOTS: "timeSlots",
  APPOINTMENTS: "appointments",
  SLOT_HOLDS: "slotHolds",
} as const

export async function checkConnection(): Promise<boolean> {
  try {
    const { client } = await connectToDatabase()
    await client.db().admin().ping()
    return true
  } catch (error) {
    console.error("MongoDB connection check failed:", error)
    return false
  }
}
