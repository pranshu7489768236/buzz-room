import { profile } from "@/lib/content"

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted)]">
      <p>
        {"© "}
        {new Date().getFullYear()} {profile.name}
      </p>
    </footer>
  )
}
