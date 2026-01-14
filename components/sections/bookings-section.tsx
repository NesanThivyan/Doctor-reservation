"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/use-auth"
import { toast } from "sonner"
import { Calendar, Clock, User, FileText, Loader2, AlertCircle, X } from "lucide-react"
import { format, parseISO } from "date-fns"

interface Appointment {
  _id: string
  patientId: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  reason: string
  doctor?: any
}

export function BookingsSection() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchUserAppointments()
    }
  }, [user?.id])

  const fetchUserAppointments = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/appointments/user?patientId=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data || [])
      } else {
        toast.error(data.error || "Failed to fetch appointments")
      }
    } catch (error) {
      toast.error("Failed to fetch appointments")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !user?.id) return

    setIsCancelling(true)
    try {
      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment._id,
          patientId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment cancelled successfully")
        // Update the appointments list
        setAppointments((prev) =>
          prev.map((apt) =>
            apt._id === selectedAppointment._id ? { ...apt, status: "cancelled" } : apt,
          ),
        )
        setSelectedAppointment(null)
        setShowCancelConfirm(false)
      } else {
        toast.error(data.error || "Failed to cancel appointment")
      }
    } catch (error) {
      toast.error("Failed to cancel appointment")
    } finally {
      setIsCancelling(false)
    }
  }

  if (!user) {
    return (
      <section id="bookings" className="bg-background py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view bookings</h2>
            <p className="text-muted-foreground">Sign in to your account to see your appointment history</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="bookings" className="bg-background py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2">My Bookings</h2>
          <p className="text-muted-foreground">View and manage your appointment bookings</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No bookings yet</p>
              <p className="text-muted-foreground">You haven't booked any appointments yet. Start by booking an appointment!</p>
              <Button asChild className="mt-4">
                <a href="#booking">Book an Appointment</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card
                key={appointment._id}
                className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setSelectedAppointment(appointment)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {appointment.doctor?.name || "Doctor"}
                        </h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(parseISO(appointment.date), "MMMM d, yyyy")} • {appointment.startTime}-
                            {appointment.endTime}
                          </span>
                        </div>
                        {appointment.doctor?.specialization && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{appointment.doctor.specialization}</span>
                          </div>
                        )}
                        {appointment.reason && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{appointment.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Appointment Details Modal/Card */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Appointment Details</CardTitle>
                    <CardDescription>Complete information about your booking</CardDescription>
                  </div>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Doctor Info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Doctor</h4>
                  <p className="text-lg font-semibold text-foreground">{selectedAppointment.doctor?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.doctor?.specialization}</p>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Date</h4>
                    <p className="text-foreground font-medium">
                      {format(parseISO(selectedAppointment.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Time</h4>
                    <p className="text-foreground font-medium">
                      {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} py-2 px-3`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Badge>
                </div>

                {/* Reason */}
                {selectedAppointment.reason && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Reason for Visit</h4>
                    <p className="text-foreground">{selectedAppointment.reason}</p>
                  </div>
                )}

                {/* Consultation Fee */}
                {selectedAppointment.doctor?.consultationFee && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Consultation Fee</h4>
                    <p className="text-lg font-semibold text-primary">${selectedAppointment.doctor.consultationFee}</p>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedAppointment.status === "scheduled" && !showCancelConfirm && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedAppointment(null)}>
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Appointment
                      </Button>
                    </>
                  )}

                  {selectedAppointment.status === "scheduled" && showCancelConfirm && (
                    <>
                      <div className="w-full space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Are you sure you want to cancel this appointment?
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isCancelling}
                          >
                            No, Keep It
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleCancelAppointment}
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Yes, Cancel
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedAppointment.status !== "scheduled" && (
                    <Button className="flex-1" onClick={() => setSelectedAppointment(null)}>
                      Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
