import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { AboutSection } from "@/components/sections/about-section"
import { DoctorsSection } from "@/components/sections/doctors-section"
import { BookingSection } from "@/components/sections/booking-section"
import { ContactSection } from "@/components/sections/contact-section"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <DoctorsSection />
        <BookingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
