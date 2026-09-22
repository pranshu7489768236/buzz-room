import { experience } from "@/lib/content"
import { SectionHeading } from "@/components/section-heading"

export function Experience() {
  return (
    <section aria-labelledby="experience-heading">
      <SectionHeading>
        <span id="experience-heading">Experience</span>
      </SectionHeading>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {experience.map((job) => (
          <li
            key={`${job.company}-${job.period}`}
            className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <div>
              <p className="font-medium">{job.company}</p>
              <p className="text-sm text-[var(--color-muted)]">{job.role}</p>
            </div>
            <p className="text-sm tabular-nums text-[var(--color-muted)]">
              {job.period}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
