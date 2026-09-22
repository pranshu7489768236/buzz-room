export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
      {children}
    </h2>
  )
}
