import { profile } from "@/lib/content"

export function Hero() {
  return (
    <header className="flex flex-col gap-4">
      <p className="text-sm font-medium tracking-wide text-[var(--color-accent)]">
        {profile.location}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {profile.name}
      </h1>
      <p className="text-lg text-[var(--color-muted)]">{profile.role}</p>
      <p className="max-w-prose text-pretty leading-relaxed text-[var(--color-foreground)]/90">
        {profile.intro}
      </p>
    </header>
  )
}
