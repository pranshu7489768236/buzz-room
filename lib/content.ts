/**
 * Everything on the site is driven by the data in this one file.
 * Edit the values below to update your site — no need to touch the components.
 */

export const profile = {
  name: "Pranshu",
  role: "Backend Software Engineer",
  location: "Bangalore, India",
  // A short, plain intro about what you do.
  intro:
    "Backend Software Engineer with around 5 years of experience building reliable, high-throughput services. Currently at Infosys. I work mostly with Java and Spring Boot, event streaming with Kafka, and data stores like PostgreSQL and Redis — running on Kubernetes and AWS.",
  // TODO: replace with your real email address.
  email: "you@example.com",
  github: "https://github.com/pranshu7489768236",
}

/** Grouped tech stack. Add, remove, or rename groups and items freely. */
export const skillGroups: { title: string; items: string[] }[] = [
  { title: "Languages", items: ["Java"] },
  { title: "Frameworks", items: ["Spring Boot"] },
  { title: "Messaging & APIs", items: ["Kafka", "gRPC"] },
  { title: "Data", items: ["PostgreSQL", "Redis"] },
  { title: "Infrastructure", items: ["Kubernetes", "AWS"] },
]

/**
 * Work experience. Keep it high-level.
 * NOTE: The years below are placeholders — update them to your real dates.
 * Only companies/roles you mentioned are listed; add earlier roles as needed.
 */
export const experience: {
  company: string
  role: string
  period: string
}[] = [
  {
    company: "Infosys",
    role: "Backend Software Engineer",
    period: "20XX – Present",
  },
  {
    company: "Paytm",
    role: "Backend Software Engineer",
    period: "20XX – 20XX",
  },
  {
    company: "Earlier roles",
    role: "Backend Software Engineer",
    period: "20XX – 20XX",
  },
]

/** Placeholder projects — swap these out for real ones when you're ready. */
export const projects: {
  title: string
  description: string
  tags: string[]
  link?: string
}[] = [
  {
    title: "Project One",
    description:
      "A short description of what this project does, the problem it solves, and your role in building it.",
    tags: ["Java", "Spring Boot", "PostgreSQL"],
  },
  {
    title: "Project Two",
    description:
      "A short description of what this project does, the problem it solves, and your role in building it.",
    tags: ["Kafka", "Redis", "gRPC"],
  },
  {
    title: "Project Three",
    description:
      "A short description of what this project does, the problem it solves, and your role in building it.",
    tags: ["Kubernetes", "AWS"],
  },
]
