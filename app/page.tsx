import { Hero } from "@/components/hero"
import { Skills } from "@/components/skills"
import { Experience } from "@/components/experience"
import { Projects } from "@/components/projects"
import { Contact } from "@/components/contact"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-24 px-6 py-20 sm:py-28">
      <Hero />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
      <SiteFooter />
    </main>
  )
}
