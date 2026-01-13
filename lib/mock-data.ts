import type { Doctor, TimeSlot } from "./types"

export const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@medibook.com",
    specialization: "Cardiologist",
    qualification: "MD, FACC",
    experience: 15,
    avatar: "/female-doctor-stethoscope.png",
    bio: "Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience in treating heart conditions. She specializes in preventive cardiology and heart failure management.",
    consultationFee: 150,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: { start: "09:00", end: "17:00" },
    slotDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "doc-2",
    name: "Dr. Michael Chen",
    email: "michael.chen@medibook.com",
    specialization: "Dermatologist",
    qualification: "MD, FAAD",
    experience: 12,
    avatar: "/male-doctor-asian-professional.jpg",
    bio: "Dr. Michael Chen is an experienced dermatologist specializing in medical and cosmetic dermatology. He treats various skin conditions including acne, eczema, and skin cancer.",
    consultationFee: 120,
    availableDays: ["Monday", "Wednesday", "Friday"],
    workingHours: { start: "10:00", end: "18:00" },
    slotDuration: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "doc-3",
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@medibook.com",
    specialization: "Pediatrician",
    qualification: "MD, FAAP",
    experience: 10,
    avatar: "/female-doctor-smiling-pediatrician.jpg",
    bio: "Dr. Emily Rodriguez is a compassionate pediatrician dedicated to providing comprehensive care for children from birth through adolescence. She believes in building lasting relationships with families.",
    consultationFee: 100,
    availableDays: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    workingHours: { start: "08:00", end: "16:00" },
    slotDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "doc-4",
    name: "Dr. James Wilson",
    email: "james.wilson@medibook.com",
    specialization: "Orthopedic Surgeon",
    qualification: "MD, FAAOS",
    experience: 20,
    avatar: "/male-doctor-senior-orthopedic.jpg",
    bio: "Dr. James Wilson is a highly skilled orthopedic surgeon specializing in joint replacement and sports medicine. He has performed over 5,000 successful surgeries throughout his career.",
    consultationFee: 200,
    availableDays: ["Monday", "Tuesday", "Thursday"],
    workingHours: { start: "09:00", end: "15:00" },
    slotDuration: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "doc-5",
    name: "Dr. Lisa Patel",
    email: "lisa.patel@medibook.com",
    specialization: "General Physician",
    qualification: "MD, ABFM",
    experience: 8,
    avatar: "/female-doctor-indian-professional.jpg",
    bio: "Dr. Lisa Patel is a dedicated general physician focused on preventive medicine and chronic disease management. She provides personalized care for patients of all ages.",
    consultationFee: 80,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "08:00", end: "20:00" },
    slotDuration: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Generate time slots for a doctor on a specific date
export function generateTimeSlots(doctor: Doctor, date: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" })

  if (!doctor.availableDays.includes(dayOfWeek)) {
    return slots
  }

  const [startHour, startMinute] = doctor.workingHours.start.split(":").map(Number)
  const [endHour, endMinute] = doctor.workingHours.end.split(":").map(Number)

  let currentHour = startHour
  let currentMinute = startMinute
  let slotIndex = 0

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const startTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

    // Calculate end time
    let endTimeMinute = currentMinute + doctor.slotDuration
    let endTimeHour = currentHour
    while (endTimeMinute >= 60) {
      endTimeMinute -= 60
      endTimeHour++
    }

    if (endTimeHour > endHour || (endTimeHour === endHour && endTimeMinute > endMinute)) {
      break
    }

    const endTime = `${endTimeHour.toString().padStart(2, "0")}:${endTimeMinute.toString().padStart(2, "0")}`

    // Randomly mark some slots as booked for demo purposes
    const isBooked = Math.random() < 0.2

    slots.push({
      id: `slot-${doctor.id}-${date}-${slotIndex}`,
      doctorId: doctor.id,
      date,
      startTime,
      endTime,
      status: isBooked ? "booked" : "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    currentMinute = endTimeMinute
    currentHour = endTimeHour
    slotIndex++
  }

  return slots
}
