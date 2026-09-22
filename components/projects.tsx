import { projects } from "@/lib/content"
import { SectionHeading } from "@/components/section-heading"

export function Projects() {
  return (
    <section aria-labelledby="projects-heading">
      <SectionHeading>
        <span id="projects-heading">Projects</span>
      </SectionHeading>
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <article
            key={project.title}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-medium">{project.title}</h3>
              {project.link ? (
                <a
                  href={project.link}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {project.description}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
