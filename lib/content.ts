/**
 * Everything on the site is driven by the data in this one file.
 * Edit the values below to update your site — no need to touch the components.
 */

export const profile = {
  name: "Pranshu Sen",
  role: "Java Backend Developer",
  location: "Bangalore, India",
  // A short, plain intro about what you do.
  intro:
    "Java Backend Developer with close to 5 years of experience designing and optimizing backend services and RESTful APIs with Java and Spring Boot. I work across microservices architecture, event streaming with Kafka, cloud-native development on AWS, and SQL/NoSQL data stores like PostgreSQL, MongoDB, and Redis. Currently at Infosys, delivering for Vanguard.",
  email: "pranshumca@gmail.com",
  github: "https://github.com/pranshu7489768236",
  linkedin: "https://linkedin.com/in/pranshu-sen-37a63a196",
}

/** Grouped tech stack. Add, remove, or rename groups and items freely. */
export const skillGroups: { title: string; items: string[] }[] = [
  { title: "Languages", items: ["Java 8/11", "SQL"] },
  { title: "Frameworks", items: ["Spring Boot", "Spring MVC", "Spring Security"] },
  { title: "APIs & Microservices", items: ["RESTful APIs", "Microservices", "JSON"] },
  { title: "Messaging & Rules", items: ["Apache Kafka", "Drools Rules Engine"] },
  { title: "Databases", items: ["PostgreSQL", "MongoDB", "Redis"] },
  { title: "Cloud & DevOps", items: ["AWS", "Docker", "GitHub Actions", "Bamboo", "SonarQube", "Wiz"] },
  { title: "Testing", items: ["JUnit", "Mockito", "Postman"] },
  { title: "Version Control", items: ["Git", "GitHub"] },
]

/**
 * Work experience. Keep it high-level.
 * Sourced from your resume — update dates or details as your roles change.
 */
export const experience: {
  company: string
  role: string
  period: string
  note?: string
}[] = [
  {
    company: "Infosys",
    role: "Java Backend Developer",
    period: "Jul 2025 – Present",
    note: "Client: Vanguard",
  },
  {
    company: "Atos",
    role: "Java Backend Developer",
    period: "Jun 2022 – Jul 2025",
  },
  {
    company: "NJ Group",
    role: "Java Backend Developer",
    period: "Jan 2022 – Jun 2022",
  },
]

/** Projects sourced from your resume. Add or edit as needed. */
export const projects: {
  title: string
  description: string
  tags: string[]
  link?: string
}[] = [
  {
    title: "Vanguard Vulnerability Remediation",
    description:
      "Enterprise security remediation across Java Spring Boot microservices — diagnosing and resolving CVEs, upgrading dependencies, and maintaining CI/CD quality gates for a major US financial services firm.",
    tags: ["Java", "Spring Boot", "AWS", "GitHub Actions", "SonarQube"],
  },
  {
    title: "Vulnerability Management System",
    description:
      "Backend security platform to identify, prioritize, and remediate vulnerabilities across enterprise IT environments, with automated risk scoring and event-driven microservices.",
    tags: ["Spring Boot", "Kafka", "Drools", "Redis", "PostgreSQL", "MongoDB"],
  },
  {
    title: "Investment Portfolio Management Platform",
    description:
      "Web-based investment platform enabling financial advisors to manage client portfolios, investment data, and financial reports, secured with Spring Security and JWT.",
    tags: ["Java", "Spring Boot", "Spring Security", "PostgreSQL", "MongoDB"],
  },
]

/** Education, sourced from your resume. */
export const education: {
  degree: string
  school: string
  period: string
}[] = [
  {
    degree: "Master of Computer Applications (MCA)",
    school: "RKDF College, Bhopal",
    period: "Jul 2019 – Jul 2021",
  },
]
