"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, DollarSign } from "lucide-react"
import { mockDoctors } from "@/lib/mock-data"
import Link from "next/link"

export function DoctorsSection() {
  return (
    <section id="doctors" className="bg-background py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="text-sm font-medium text-primary">Our Medical Team</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Meet Our Expert Doctors
          </h2>
          <p className="text-lg text-muted-foreground">
            Our team of experienced healthcare professionals is dedicated to providing you with the best care possible.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockDoctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="group overflow-hidden border-border/50 transition-all hover:shadow-lg hover:border-primary/30"
            >
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={doctor.avatar || "/placeholder.svg?height=300&width=400&query=doctor professional portrait"}
                    alt={doctor.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {doctor.specialization}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.qualification}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>4.9</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{doctor.experience} years</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${doctor.consultationFee}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{doctor.bio}</p>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0">
                <Button asChild className="w-full">
                  <Link href={`#booking?doctor=${doctor.id}`}>Book Appointment</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
