export const SKILL_LIST = [
  "python", "sql", "azure", "aws", "java", "react", "etl", "data", "spark",
  "javascript", "typescript", "node", "nodejs", "docker", "kubernetes", "html",
  "css", "mongodb", "postgresql", "mysql", "git", "linux", "c++", "c#", "ruby",
  "php", "swift", "kotlin", "flutter", "django", "flask", "fastapi",
  "tensorflow", "pytorch", "machine learning", "deep learning", "nlp",
  "tableau", "power bi", "excel", "angular", "vue", "nextjs", "express",
  "graphql", "rest api", "redis", "kafka", "hadoop", "airflow", "snowflake",
  "databricks", "gcp", "terraform", "jenkins", "ci/cd", "agile", "scrum",
  "jira", "figma", "sketch", "photoshop", "illustrator", "sass", "tailwind",
  "bootstrap", "material ui", "redux", "zustand", "webpack", "vite",
  "spring boot", "hibernate", ".net", "go", "golang", "rust", "scala",
  "r", "matlab", "sas", "spss", "pandas", "numpy", "scikit-learn",
  "opencv", "computer vision", "natural language processing", "bert", "gpt",
  "llm", "langchain", "rag", "vector database", "pinecone", "chromadb",
  "selenium", "cypress", "jest", "mocha", "pytest", "unittest",
  "microservices", "serverless", "lambda", "s3", "ec2", "rds",
  "dynamodb", "firebase", "supabase", "vercel", "netlify", "heroku",
  "digital ocean", "nginx", "apache", "load balancing", "caching",
  "oauth", "jwt", "authentication", "authorization", "security",
  "blockchain", "solidity", "web3", "ethereum", "smart contracts",
  "ios", "android", "react native", "xamarin", "unity", "unreal",
  "three.js", "d3.js", "chart.js", "matplotlib", "seaborn", "plotly",
  "power automate", "sharepoint", "salesforce", "sap", "oracle",
  "data warehouse", "data lake", "data pipeline", "data modeling",
  "business intelligence", "data analytics", "data science",
  "statistics", "probability", "linear algebra", "calculus",
  "communication", "leadership", "teamwork", "problem solving",
  "critical thinking", "project management", "time management",
];

export function parseResume(text: string) {
  // NAME - first non-empty line, max 60 chars
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const name = lines.length > 0 ? lines[0].substring(0, 60).trim() : "Unknown";

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

  // SKILLS keyword scan
  const lowerText = text.toLowerCase();
  const skills = SKILL_LIST.filter((s) => {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerText);
  }).join(", ");

  return { name, email, phone, skills, experience };
}

export function matchJD(candidateText: string, candidateSkills: string, jdText: string): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const jdLower = jdText.toLowerCase();
  const candidateLower = candidateText.toLowerCase();

  // Extract skills from JD
  const jdSkills = SKILL_LIST.filter((s) => {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(jdLower);
  });

  if (jdSkills.length === 0) {
    // Fallback: keyword matching
    const jdWords = jdLower.split(/\W+/).filter(w => w.length > 3);
    const uniqueJdWords = [...new Set(jdWords)];
    if (uniqueJdWords.length === 0) return { score: 0, matchedSkills: [], missingSkills: [] };

    const matched = uniqueJdWords.filter(w => candidateLower.includes(w));
    const score = Math.round((matched.length / uniqueJdWords.length) * 100);
    return { score: Math.min(score, 100), matchedSkills: matched, missingSkills: uniqueJdWords.filter(w => !candidateLower.includes(w)) };
  }

  // Extract candidate skills
  const candSkillsArr = candidateSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  const matchedSkills = jdSkills.filter(s => candSkillsArr.includes(s.toLowerCase()));
  const missingSkills = jdSkills.filter(s => !candSkillsArr.includes(s.toLowerCase()));

  // Score calculation: skills match (70%) + keyword overlap (30%)
  const skillScore = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) : 0;

  // Keyword overlap from JD in resume
  const jdKeywords = jdLower.split(/\W+/).filter(w => w.length > 4);
  const uniqueKeywords = [...new Set(jdKeywords)];
  const keywordMatches = uniqueKeywords.filter(w => candidateLower.includes(w));
  const keywordScore = uniqueKeywords.length > 0 ? (keywordMatches.length / uniqueKeywords.length) : 0;

  const totalScore = Math.round((skillScore * 0.7 + keywordScore * 0.3) * 100);

  return {
    score: Math.min(totalScore, 100),
    matchedSkills,
    missingSkills,
  };
}
