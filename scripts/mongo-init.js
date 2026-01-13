// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

const db = db.getSiblingDB("medibook")

// Create collections with schema validation

// Doctors collection
db.createCollection("doctors", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "specialization", "qualification", "consultationFee"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        specialization: { bsonType: "string" },
        qualification: { bsonType: "string" },
        experience: { bsonType: "int" },
        avatar: { bsonType: "string" },
        bio: { bsonType: "string" },
        consultationFee: { bsonType: "number" },
        availableDays: { bsonType: "array" },
        workingHours: {
          bsonType: "object",
          properties: {
            start: { bsonType: "string" },
            end: { bsonType: "string" },
          },
        },
        slotDuration: { bsonType: "int" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Patients collection
db.createCollection("patients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "phone"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        phone: { bsonType: "string" },
        dateOfBirth: { bsonType: "date" },
        gender: { enum: ["male", "female", "other", null] },
        address: { bsonType: "string" },
        medicalHistory: { bsonType: "string" },
        googleCalendarConnected: { bsonType: "bool" },
        googleAccessToken: { bsonType: "string" },
        googleRefreshToken: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Time slots collection
db.createCollection("timeslots", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["doctorId", "date", "startTime", "endTime", "status"],
      properties: {
        doctorId: { bsonType: "objectId" },
        date: { bsonType: "string" },
        startTime: { bsonType: "string" },
        endTime: { bsonType: "string" },
        status: { enum: ["available", "held", "booked"] },
        heldBy: { bsonType: "objectId" },
        heldUntil: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Appointments collection
db.createCollection("appointments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["patientId", "doctorId", "timeSlotId", "date", "startTime", "endTime", "status"],
      properties: {
        patientId: { bsonType: "objectId" },
        doctorId: { bsonType: "objectId" },
        timeSlotId: { bsonType: "objectId" },
        date: { bsonType: "string" },
        startTime: { bsonType: "string" },
        endTime: { bsonType: "string" },
        status: { enum: ["scheduled", "completed", "cancelled", "no-show"] },
        reason: { bsonType: "string" },
        notes: { bsonType: "string" },
        googleEventId: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Slot holds collection (for mutex mechanism)
db.createCollection("slotholds", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["slotId", "patientId", "doctorId", "expiresAt"],
      properties: {
        slotId: { bsonType: "objectId" },
        patientId: { bsonType: "objectId" },
        doctorId: { bsonType: "objectId" },
        date: { bsonType: "string" },
        startTime: { bsonType: "string" },
        endTime: { bsonType: "string" },
        expiresAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
      },
    },
  },
})

// Create indexes
db.doctors.createIndex({ email: 1 }, { unique: true })
db.patients.createIndex({ email: 1 }, { unique: true })
db.timeslots.createIndex({ doctorId: 1, date: 1 })
db.timeslots.createIndex({ status: 1 })
db.timeslots.createIndex({ heldUntil: 1 }, { expireAfterSeconds: 0 }) // TTL index for auto-cleanup
db.appointments.createIndex({ patientId: 1 })
db.appointments.createIndex({ doctorId: 1 })
db.appointments.createIndex({ date: 1, startTime: 1 })
db.slotholds.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index for auto-cleanup
db.slotholds.createIndex({ slotId: 1 }, { unique: true })

// Seed initial doctor data
db.doctors.insertMany([
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@medibook.com",
    specialization: "Cardiologist",
    qualification: "MD, FACC",
    experience: 15,
    bio: "Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience in treating heart conditions.",
    consultationFee: 150,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "09:00", end: "17:00" },
    slotDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@medibook.com",
    specialization: "Dermatologist",
    qualification: "MD, FAAD",
    experience: 12,
    bio: "Dr. Michael Chen is an experienced dermatologist specializing in medical and cosmetic dermatology.",
    consultationFee: 120,
    availableDays: ["Monday", "Wednesday", "Friday"],
    workingHours: { start: "10:00", end: "18:00" },
    slotDuration: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@medibook.com",
    specialization: "Pediatrician",
    qualification: "MD, FAAP",
    experience: 10,
    bio: "Dr. Emily Rodriguez is a compassionate pediatrician dedicated to providing comprehensive care for children.",
    consultationFee: 100,
    availableDays: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    workingHours: { start: "08:00", end: "16:00" },
    slotDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

print("MediBook database initialized successfully!")
