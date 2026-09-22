import { profile } from "@/lib/content"
import { SectionHeading } from "@/components/section-heading"

export function Contact() {
  return (
    <section aria-labelledby="contact-heading">
      <SectionHeading>
        <span id="contact-heading">Contact</span>
      </SectionHeading>
      <p className="text-[var(--color-muted)]">
        {"Feel free to reach out — I'm happy to talk backend systems, "}
        {"open roles, or interesting problems."}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <a
          href={`mailto:${profile.email}`}
          className="text-[var(--color-accent)] hover:underline"
        >
          {profile.email}
        </a>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-accent)] hover:underline"
        >
          GitHub
        </a>
      </div>
    </section>
  )
}
