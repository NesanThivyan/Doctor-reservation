"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { mockDoctors } from "@/lib/mock-data"
import type { Doctor, TimeSlot } from "@/lib/types"
import { Clock, CalendarIcon, CheckCircle, Loader2, Timer } from "lucide-react"
import { format, addDays, isBefore, startOfDay } from "date-fns"

type BookingStep = "select-doctor" | "select-slot" | "confirm"

interface HoldInfo {
  holdId: string
  expiresAt: Date
  slot: TimeSlot
}

export function BookingSection() {
  const [step, setStep] = useState<BookingStep>("select-doctor")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [holdInfo, setHoldInfo] = useState<HoldInfo | null>(null)
  const [holdTimeRemaining, setHoldTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    reason: "",
    addToGoogleCalendar: false,
  })

  // Generate a patient ID (in production, this would come from auth)
  const [patientId] = useState(() => `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDoctor, selectedDate])

  // Hold timer countdown
  useEffect(() => {
    if (!holdInfo) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdInfo.expiresAt.getTime() - Date.now()) / 1000))
      setHoldTimeRemaining(remaining)

      if (remaining === 0) {
        // Hold expired
        toast.error("Your slot hold has expired. Please select a new slot.")
        setHoldInfo(null)
        setSelectedSlot(null)
        setStep("select-slot")
        fetchAvailableSlots()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [holdInfo])

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return

    setIsLoading(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(`/api/slots?doctorId=${selectedDoctor.id}&date=${dateStr}`)
      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.data)
      } else {
        toast.error(data.error || "Failed to fetch available slots")
      }
    } catch (error) {
      toast.error("Failed to fetch available slots")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = mockDoctors.find((d) => d.id === doctorId)
    if (doctor) {
      setSelectedDoctor(doctor)
      setSelectedSlot(null)
      setHoldInfo(null)
      setStep("select-slot")
    }
  }

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (slot.status !== "available") {
      toast.error("This slot is no longer available")
      return
    }

    setIsHolding(true)
    try {
      const response = await fetch("/api/slots/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, patientId }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedSlot(slot)
        setHoldInfo({
          holdId: data.data.id,
          expiresAt: new Date(data.data.expiresAt),
          slot,
        })
        setHoldTimeRemaining(Math.floor((new Date(data.data.expiresAt).getTime() - Date.now()) / 1000))
        setStep("confirm")
        toast.success("Slot held for 5 minutes. Please complete your booking.")
      } else {
        toast.error(data.error || "Failed to hold slot")
        fetchAvailableSlots() // Refresh slots
      }
    } catch (error) {
      toast.error("Failed to hold slot")
    } finally {
      setIsHolding(false)
    }
  }

  const handleReleaseSlot = async () => {
    if (!holdInfo) return

    try {
      await fetch("/api/slots/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdId: holdInfo.holdId, patientId }),
      })
    } catch (error) {
      console.error("Failed to release slot:", error)
    }

    setHoldInfo(null)
    setSelectedSlot(null)
    setStep("select-slot")
    fetchAvailableSlots()
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!holdInfo || !selectedDoctor) return

    // Validate form
    if (!formData.patientName.trim() || !formData.patientEmail.trim() || !formData.patientPhone.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsConfirming(true)
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdId: holdInfo.holdId,
          patientId,
          patientData: {
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone,
          },
          reason: formData.reason,
          addToGoogleCalendar: formData.addToGoogleCalendar,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment booked successfully!")

        // If Google Calendar integration requested, redirect to OAuth
        if (formData.addToGoogleCalendar && data.data.googleAuthUrl) {
          window.location.href = data.data.googleAuthUrl
          return
        }

        // Reset form
        resetBooking()
      } else {
        toast.error(data.error || "Failed to book appointment")
        if (data.error?.includes("expired") || data.error?.includes("invalid")) {
          setHoldInfo(null)
          setSelectedSlot(null)
          setStep("select-slot")
          fetchAvailableSlots()
        }
      }
    } catch (error) {
      toast.error("Failed to book appointment")
    } finally {
      setIsConfirming(false)
    }
  }

  const resetBooking = () => {
    setStep("select-doctor")
    setSelectedDoctor(null)
    setSelectedSlot(null)
    setHoldInfo(null)
    setFormData({
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      reason: "",
      addToGoogleCalendar: false,
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <section id="booking" className="bg-muted/30 py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center space-y-4 mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="text-sm font-medium text-primary">Book Your Visit</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Schedule an Appointment
          </h2>
          <p className="text-lg text-muted-foreground">
            Select your preferred doctor, date, and time slot. We ensure no double bookings with our secure hold system.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center gap-4">
            {[
              { key: "select-doctor", label: "Select Doctor" },
              { key: "select-slot", label: "Choose Time" },
              { key: "confirm", label: "Confirm" },
            ].map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    step === s.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : index < ["select-doctor", "select-slot", "confirm"].indexOf(step)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {index < ["select-doctor", "select-slot", "confirm"].indexOf(step) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 hidden text-sm font-medium sm:block">{s.label}</span>
                {index < 2 && <div className="mx-4 h-px w-12 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Step 1: Select Doctor */}
          {step === "select-doctor" && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Doctor</CardTitle>
                <CardDescription>Choose the healthcare professional you'd like to see</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor.id)}
                      className="flex items-start gap-4 rounded-lg border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <img
                        src={doctor.avatar || "/placeholder.svg?height=80&width=80&query=doctor portrait"}
                        alt={doctor.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-foreground">{doctor.name}</h4>
                        <p className="text-sm text-primary">{doctor.specialization}</p>
                        <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{doctor.slotDuration} min sessions</span>
                          <span>•</span>
                          <span>${doctor.consultationFee}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Slot */}
          {step === "select-slot" && selectedDoctor && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Date & Time</CardTitle>
                    <CardDescription>
                      Booking with {selectedDoctor.name} - {selectedDoctor.specialization}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep("select-doctor")}>
                    Change Doctor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Calendar */}
                  <div>
                    <Label className="mb-3 block">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) =>
                        isBefore(date, startOfDay(new Date())) ||
                        !selectedDoctor.availableDays.includes(date.toLocaleDateString("en-US", { weekday: "long" }))
                      }
                      className="rounded-md border"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Available days: {selectedDoctor.availableDays.join(", ")}
                    </p>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <Label className="mb-3 block">
                      Available Time Slots {selectedDate && `- ${format(selectedDate, "MMMM d, yyyy")}`}
                    </Label>

                    {isLoading ? (
                      <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="flex h-64 flex-col items-center justify-center text-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">No available slots for this date</p>
                        <p className="text-sm text-muted-foreground">Please select a different date</p>
                      </div>
                    ) : (
                      <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={slot.status === "available" ? "outline" : "ghost"}
                            size="sm"
                            disabled={slot.status !== "available" || isHolding}
                            onClick={() => handleSlotSelect(slot)}
                            className={`${
                              slot.status === "booked"
                                ? "opacity-40 line-through"
                                : slot.status === "held"
                                  ? "opacity-60 bg-yellow-50 border-yellow-200"
                                  : "hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            {isHolding && selectedSlot?.id === slot.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              slot.startTime
                            )}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded border border-border bg-background" />
                        <span className="text-muted-foreground">Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-yellow-100 border border-yellow-200" />
                        <span className="text-muted-foreground">Held</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-muted line-through" />
                        <span className="text-muted-foreground">Booked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm Booking */}
          {step === "confirm" && selectedDoctor && selectedSlot && holdInfo && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Confirm Your Appointment</CardTitle>
                    <CardDescription>Please fill in your details to complete the booking</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-warning" />
                    <Badge
                      variant="outline"
                      className={holdTimeRemaining < 60 ? "border-destructive text-destructive" : ""}
                    >
                      Hold expires in {formatTime(holdTimeRemaining)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Appointment Summary */}
                <div className="mb-6 rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Appointment Summary</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doctor:</span>
                      <span className="font-medium text-foreground">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Specialization:</span>
                      <span className="text-foreground">{selectedDoctor.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="text-foreground">{format(new Date(selectedSlot.date), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="text-foreground">
                        {selectedSlot.startTime} - {selectedSlot.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium text-primary">${selectedDoctor.consultationFee}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="patientName">Full Name *</Label>
                      <Input
                        id="patientName"
                        placeholder="John Doe"
                        value={formData.patientName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientEmail">Email Address *</Label>
                      <Input
                        id="patientEmail"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.patientEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, patientEmail: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Phone Number *</Label>
                    <Input
                      id="patientPhone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, patientPhone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Textarea
                      id="reason"
                      placeholder="Briefly describe your symptoms or reason for the appointment..."
                      value={formData.reason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                    <Checkbox
                      id="googleCalendar"
                      checked={formData.addToGoogleCalendar}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, addToGoogleCalendar: checked === true }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="googleCalendar" className="cursor-pointer">
                        Add to Google Calendar
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        We'll create a calendar event with a reminder for your appointment
                      </p>
                    </div>
                    <img src="/google-calendar-icon.png" alt="Google Calendar" className="h-6 w-6" />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={handleReleaseSlot} disabled={isConfirming}>
                      Cancel & Release Slot
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isConfirming}>
                      {isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
