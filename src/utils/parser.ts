import type { Candidate } from "../types";
import { v4 as uuidv4 } from "uuid";

const SKILL_LIST = [
  "python", "sql", "azure", "aws", "java", "react", "etl", "data",
  "spark", "javascript", "typescript", "node", "mongodb", "docker",
  "kubernetes", "git", "html", "css", "angular", "vue", "django",
  "flask", "tensorflow", "pytorch", "machine learning", "deep learning",
  "tableau", "power bi", "excel", "c++", "c#", "rust", "go", "swift",
  "kotlin", "php", "ruby", "scala", "hadoop", "kafka", "redis",
  "postgresql", "mysql", "graphql", "rest api", "linux", "agile",
  "scrum", "jira", "figma", "photoshop"
];

export function parseResume(text: string, fileName: string): Candidate {
  // NAME - first non-empty line, capped at 60 chars
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const name = (lines[0] || "Unknown").substring(0, 60).trim();

  // EMAIL
  const emailMatch = text.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : "";

  // PHONE
  const phoneMatch = text.match(/\+?\d[\d\s-]{8,}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : "";

  // EXPERIENCE
  const expMatch = text.toLowerCase().match(/(\d+\+?\s?years?)/);
  const experience = expMatch ? expMatch[0] : "";

  // SKILLS
  const lowerText = text.toLowerCase();
  const skills = SKILL_LIST.filter((s) => lowerText.includes(s)).join(", ");

  return {
    id: uuidv4(),
    name,
    email,
    phone,
    skills,
    experience,
    content: text,
    fileName,
    uploadedAt: new Date().toISOString(),
  };
}
