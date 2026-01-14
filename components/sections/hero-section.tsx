import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Shield, Clock, Award } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 lg:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span className="text-sm font-medium text-primary">Trusted by 10,000+ patients</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Healthcare Made
              <span className="block text-primary">Simple & Accessible</span>
            </h1>

            <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
              Book appointments with top-rated doctors in minutes. No waiting rooms, no hassle. Your health journey
              starts here with our seamless booking experience.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="#booking">
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#about">Learn More</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">50+</p>
                <p className="text-sm text-muted-foreground">Expert Doctors</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">10k+</p>
                <p className="text-sm text-muted-foreground">Happy Patients</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">15+</p>
                <p className="text-sm text-muted-foreground">Specializations</p>
              </div>
            </div>
          </div>

          {/* Hero Image/Card */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              <img
                src="/modern-healthcare-medical-doctors-team-professiona.jpg"
                alt="Healthcare professionals"
                className="rounded-2xl object-cover w-full h-full shadow-2xl"
              />

              {/* Floating Cards */}
              <div className="absolute -left-8 top-1/4 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Verified Doctors</p>
                    <p className="text-xs text-muted-foreground">100% Certified</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Quick Booking</p>
                    <p className="text-xs text-muted-foreground">Book in 2 mins</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 left-1/4 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Top Rated</p>
                    <p className="text-xs text-muted-foreground">4.9 Star Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
