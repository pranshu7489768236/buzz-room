import { education } from "@/lib/content"
import { SectionHeading } from "@/components/section-heading"

export function Education() {
  return (
    <section aria-labelledby="education-heading">
      <SectionHeading>
        <span id="education-heading">Education</span>
      </SectionHeading>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {education.map((item) => (
          <li
            key={`${item.school}-${item.period}`}
            className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <div>
              <p className="font-medium">{item.degree}</p>
              <p className="text-sm text-[var(--color-muted)]">{item.school}</p>
            </div>
            <p className="text-sm tabular-nums text-[var(--color-muted)]">
              {item.period}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
