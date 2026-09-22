import { skillGroups } from "@/lib/content"
import { SectionHeading } from "@/components/section-heading"

export function Skills() {
  return (
    <section aria-labelledby="skills-heading">
      <SectionHeading>
        <span id="skills-heading">Tech Stack</span>
      </SectionHeading>
      <dl className="flex flex-col gap-5">
        {skillGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <dt className="w-40 shrink-0 text-sm text-[var(--color-muted)]">
              {group.title}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-sm"
                >
                  {item}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
