import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Users, HeartPulse, Microscope } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Patient-Centered Care",
    description: "We put patients first, ensuring personalized attention and care tailored to individual needs.",
  },
  {
    icon: HeartPulse,
    title: "Expert Medical Team",
    description: "Our doctors are board-certified specialists with years of experience in their respective fields.",
  },
  {
    icon: Microscope,
    title: "Advanced Technology",
    description: "State-of-the-art medical equipment and digital health tools for accurate diagnosis and treatment.",
  },
]

const highlights = [
  "Easy online appointment booking",
  "Google Calendar integration",
  "No double-booking guaranteed",
  "Real-time availability updates",
  "Instant confirmation",
  "Appointment reminders",
]

export function AboutSection() {
  return (
    <section id="about" className="bg-muted/30 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span className="text-sm font-medium text-primary">About MediBook</span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Your Health, Our Priority
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              MediBook is a modern healthcare platform designed to simplify the way you access medical care. We connect
              patients with qualified healthcare professionals, making it easy to book appointments and manage your
              health journey.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <img
              src="/modern-medical-clinic-reception-healthcare-facilit.jpg"
              alt="Medical facility"
              className="rounded-2xl object-cover w-full shadow-xl"
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card transition-shadow hover:shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
