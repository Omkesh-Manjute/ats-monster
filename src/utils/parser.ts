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
  "scrum", "jira", "figma", "photoshop", ".net", "spring", "microservices",
  "ci/cd", "jenkins", "terraform", "ansible", "devops", "snowflake",
  "databricks", "airflow", "dbt", "pandas", "numpy", "scikit-learn",
  "nlp", "computer vision", "opencv", "selenium", "cypress", "jest",
  "webpack", "nextjs", "next.js", "express", "fastapi", "celery",
  "rabbitmq", "elasticsearch", "dynamodb", "s3", "lambda", "gcp",
  "google cloud", "firebase", "supabase", "tailwind", "bootstrap",
  "sass", "less", "redux", "zustand", "svelte", "nuxt"
];

// US States + abbreviations
const US_STATES: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
  "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
  "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
  "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
  "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
  "wisconsin": "WI", "wyoming": "WY"
};

const US_STATE_ABBREVS = Object.values(US_STATES);

const US_CITIES = [
  "new york", "new york city", "nyc", "los angeles", "chicago", "houston",
  "phoenix", "philadelphia", "san antonio", "san diego", "dallas", "san jose",
  "austin", "jacksonville", "fort worth", "columbus", "charlotte", "indianapolis",
  "san francisco", "seattle", "denver", "washington", "nashville", "oklahoma city",
  "el paso", "boston", "portland", "las vegas", "memphis", "louisville",
  "baltimore", "milwaukee", "albuquerque", "tucson", "fresno", "mesa",
  "sacramento", "atlanta", "kansas city", "omaha", "colorado springs",
  "raleigh", "long beach", "virginia beach", "miami", "oakland", "minneapolis",
  "tampa", "tulsa", "arlington", "aurora", "bakersfield", "anaheim",
  "honolulu", "santa ana", "riverside", "corpus christi", "lexington",
  "pittsburgh", "st louis", "st. louis", "saint louis", "cincinnati",
  "anchorage", "henderson", "greensboro", "plano", "newark", "lincoln",
  "orlando", "irvine", "toledo", "jersey city", "chula vista", "durham",
  "st. petersburg", "saint paul", "laredo", "chandler", "madison",
  "lubbock", "scottsdale", "reno", "gilbert", "glendale", "irving",
  "sunnyvale", "north las vegas", "fremont", "chesapeake", "norfolk",
  "boise", "richmond", "san bernardino", "spokane", "birmingham",
  "rochester", "modesto", "des moines", "montgomery", "tacoma",
  "shreveport", "fayetteville", "moreno valley", "fontana", "akron",
  "yonkers", "worcester", "little rock", "augusta", "amarillo",
  "huntsville", "salt lake city", "tallahassee", "grand rapids",
  "overland park", "knoxville", "brownsville", "newport news",
  "santa clarita", "providence", "garden grove", "chattanooga",
  "oceanside", "jackson", "fort lauderdale", "santa rosa", "rancho cucamonga",
  "port st. lucie", "tempe", "ontario", "vancouver", "cape coral",
  "sioux falls", "springfield", "peoria", "pembroke pines", "elk grove",
  "salem", "corona", "eugene", "mckinney", "fort collins", "cary",
  "hayward", "sterling heights", "frisco", "pasadena", "mesquite",
  "roseville", "surprise", "denton", "midland", "murfreesboro",
  "clarksville", "columbia", "naperville", "bellevue", "savannah",
  "bridgeport", "west valley city", "olathe", "dayton", "waco",
  "stamford", "hartford", "new haven", "concord",
  "palo alto", "mountain view", "menlo park", "cupertino", "redwood city",
  "santa clara", "milpitas", "campbell", "saratoga", "los gatos",
  "boulder", "ann arbor", "cambridge", "somerville", "hoboken",
  "jersey city", "brooklyn", "manhattan", "queens",
];

const WORLD_CITIES = [
  "london", "berlin", "paris", "amsterdam", "toronto", "vancouver",
  "sydney", "melbourne", "singapore", "dubai", "tokyo", "remote",
  "munich", "zurich", "stockholm", "copenhagen", "dublin", "madrid",
  "barcelona", "lisbon", "rome", "milan", "vienna", "prague",
  "warsaw", "budapest", "brussels", "oslo", "helsinki",
  "montreal", "calgary", "ottawa", "winnipeg",
  "brisbane", "perth", "auckland", "wellington",
  "hong kong", "shanghai", "beijing", "seoul", "taipei",
  "bangkok", "jakarta", "manila", "ho chi minh",
  "tel aviv", "cape town", "nairobi", "lagos",
  "sao paulo", "mexico city", "buenos aires", "bogota", "lima",
  "abu dhabi", "doha", "riyadh", "muscat", "cairo",
];

const INDIAN_CITIES = [
  "mumbai", "delhi", "new delhi", "bangalore", "bengaluru", "hyderabad",
  "chennai", "kolkata", "pune", "ahmedabad", "jaipur", "lucknow",
  "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam",
  "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "faridabad",
  "meerut", "rajkot", "varanasi", "srinagar", "aurangabad", "dhanbad",
  "amritsar", "navi mumbai", "allahabad", "prayagraj", "ranchi",
  "coimbatore", "jabalpur", "gwalior", "vijayawada", "jodhpur",
  "madurai", "raipur", "kochi", "chandigarh", "mysore", "mysuru",
  "gurgaon", "gurugram", "noida", "greater noida", "dehradun", "patna",
  "thiruvananthapuram", "surat", "mangalore", "mangaluru", "trivandrum",
  "ernakulam", "tiruchirappalli", "trichy", "guntur", "warangal",
  "tirupati", "salem", "bareilly", "moradabad", "gorakhpur",
  "bikaner", "udaipur", "bhilai", "jamshedpur", "cuttack",
  "bhubaneswar", "hubli", "dharwad", "belgaum", "belagavi",
  "kolhapur", "sangli", "solapur", "nanded", "latur", "akola",
];

function hasWordMatch(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

function hasUSIndicators(text: string): boolean {
  for (const abbrev of US_STATE_ABBREVS) {
    const pattern = new RegExp(`[,\\s]${abbrev}\\b`, "g");
    if (pattern.test(text)) return true;
  }
  if (/\b\d{5}(-\d{4})?\b/.test(text)) return true;
  if (/\(\d{3}\)\s*\d{3}[-.\s]\d{4}/.test(text)) return true;
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(text)) return true;
  if (/\bunited\s+states\b/i.test(text) || /\bU\.?S\.?A\.?\b/.test(text)) return true;
  const lower = text.toLowerCase();
  for (const state of Object.keys(US_STATES)) {
    if (hasWordMatch(lower, state)) return true;
  }
  return false;
}

function hasIndianIndicators(text: string): boolean {
  if (/\bindia\b/i.test(text)) return true;
  if (/\+91/.test(text)) return true;
  if (/\b[1-9]\d{5}\b/.test(text)) return true;
  return false;
}

function extractLocation(text: string): string {
  const locPatterns = [
    /(?:location|city|address|based in|residing in|current location|lives in|living in|hometown|residence)\s*[:\-–]\s*([^\n,]{2,50})/i,
    /(?:address)\s*[:\-–]\s*([^\n]{2,80})/i,
  ];
  for (const pattern of locPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().replace(/[|•·]/g, "").trim();
    }
  }

  const cityStatePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})\b/g;
  let csMatch;
  while ((csMatch = cityStatePattern.exec(text)) !== null) {
    if (US_STATE_ABBREVS.includes(csMatch[2])) {
      return `${csMatch[1]}, ${csMatch[2]}`;
    }
  }

  for (const [stateName, stateAbbr] of Object.entries(US_STATES)) {
    const pattern = new RegExp(`([A-Z][a-z]+(?:\\s[A-Z][a-z]+)?),\\s*${stateName}`, "i");
    const m = text.match(pattern);
    if (m) return `${m[1]}, ${stateAbbr}`;
  }

  const isUS = hasUSIndicators(text);
  const isIndia = hasIndianIndicators(text);

  if (isUS || !isIndia) {
    for (const city of US_CITIES) {
      if (hasWordMatch(text, city)) {
        const titleCase = city.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        const cityIdx = text.toLowerCase().indexOf(city);
        const nearby = text.substring(cityIdx, cityIdx + city.length + 20);
        const stateMatch = nearby.match(/,\s*([A-Z]{2})\b/);
        if (stateMatch && US_STATE_ABBREVS.includes(stateMatch[1])) {
          return `${titleCase}, ${stateMatch[1]}`;
        }
        return titleCase;
      }
    }
  }

  for (const city of WORLD_CITIES) {
    if (hasWordMatch(text, city)) {
      return city.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  if (isIndia) {
    for (const city of INDIAN_CITIES) {
      if (hasWordMatch(text, city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
  }

  if (isUS) {
    for (const [stateName, abbr] of Object.entries(US_STATES)) {
      if (hasWordMatch(text, stateName)) {
        return `${stateName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}, ${abbr}`;
      }
    }
  }

  if (/\bremote\b/i.test(text)) return "Remote";

  return "";
}

// ===================== TITLE / ROLE EXTRACTION =====================
// STRICT approach: Only match from a generated list of known titles
// Never use loose keyword matching that picks up random sentences

const CORE_ROLES = [
  "developer", "engineer", "architect", "manager", "analyst",
  "designer", "consultant", "administrator", "specialist", "coordinator",
  "director", "scientist", "researcher", "programmer", "tester",
  "technician", "supervisor", "strategist", "planner", "auditor",
  "recruiter", "accountant", "writer", "editor", "instructor",
  "trainer", "advisor", "lead", "head", "officer", "intern",
];

const TITLE_DOMAINS = [
  "software", "web", "mobile", "ios", "android",
  "frontend", "front-end", "front end",
  "backend", "back-end", "back end",
  "full stack", "fullstack", "full-stack",
  "data", "database", "cloud", "devops",
  "infrastructure", "network", "security", "cyber", "cybersecurity",
  "platform", "systems", "system", "application", "applications",
  "solutions", "enterprise", "integration",
  "machine learning", "ml", "ai",
  "bi", "business intelligence", "business", "business system", "business systems",
  "analytics", "etl",
  "qa", "quality assurance", "quality", "test", "testing", "automation",
  "ui", "ux", "ui/ux", "product", "graphic", "visual",
  "technical", "technology", "information", "it",
  "project", "program", "delivery", "release", "build", "support",
  "site reliability", "embedded", "firmware", "hardware", "electrical",
  "mechanical", "civil", "chemical",
  "marketing", "digital", "content", "seo",
  "financial", "finance", "accounting", "operations", "supply chain",
  "hr", "human resources", "talent", "people",
  "salesforce", "sap", "oracle", "sharepoint", "erp", "crm",
  "java", "python", "react", ".net", "dotnet", "php", "ruby",
  "golang", "node", "nodejs", "angular", "vue", "swift", "kotlin",
  "blockchain", "aws", "azure", "gcp", "google cloud",
  "spark", "hadoop", "kafka", "snowflake", "databricks", "airflow",
  "scrum", "agile",
];

const TITLE_QUALIFIERS = [
  "senior", "junior", "lead", "principal", "staff", "chief",
  "associate", "assistant", "deputy", "executive", "sr", "jr",
];

function buildKnownTitles(): string[] {
  const titles = new Set<string>();

  // Specific hardcoded titles
  const specific = [
    "scrum master", "product owner", "technical lead", "tech lead", "team lead",
    "engineering manager", "it manager", "it director", "vp of engineering",
    "director of engineering", "chief technology officer",
    "site reliability engineer", "database administrator",
    "pre-sales engineer", "solution engineer",
    "postdoctoral researcher", "research scientist", "research engineer",
    "digital marketing", "content writer", "technical writer",
    "hr generalist", "account manager", "delivery manager",
    "functional consultant", "management consultant",
    "erp consultant", "sap consultant", "it consultant",
    "business system analyst", "business systems analyst",
    "business system analysis consultant",
    "smart contract developer", "helpdesk",
    "release manager", "change manager", "incident manager",
    "data warehouse engineer", "data warehouse architect",
    "big data engineer", "big data developer",
    "full stack engineer", "fullstack engineer",
  ];
  specific.forEach(t => titles.add(t));

  // Generate: [qualifier?] + [domain?] + core_role
  for (const role of CORE_ROLES) {
    for (const domain of TITLE_DOMAINS) {
      const combo = `${domain} ${role}`;
      titles.add(combo);
      for (const qual of TITLE_QUALIFIERS) {
        titles.add(`${qual} ${combo}`);
      }
    }
    for (const qual of TITLE_QUALIFIERS) {
      titles.add(`${qual} ${role}`);
    }
    // Don't add bare core roles (like just "lead", "head") — too generic
  }

  // Sort longest first so we match "senior azure data engineer" before "data engineer"
  return [...titles].sort((a, b) => b.length - a.length);
}

const ALL_KNOWN_TITLES = buildKnownTitles();

/**
 * Find the best matching known title in a given text.
 * Uses strict word boundary matching.
 * Only returns titles with 2+ words to avoid false positives.
 */
function findKnownTitle(text: string, allowSingleWord = false): string | null {
  const cleaned = text.toLowerCase()
    .replace(/[|•·,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const title of ALL_KNOWN_TITLES) {
    // Skip single-word titles unless explicitly allowed
    if (!allowSingleWord && !title.includes(" ")) continue;

    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(cleaned)) {
      return title;
    }
  }
  return null;
}

function toTitleCase(str: string): string {
  return str.split(" ").map(w => {
    if (w.length <= 3 && w === w.toUpperCase()) return w;
    if (w === "ui/ux" || w === "ux/ui") return w.toUpperCase();
    if (w.startsWith(".")) return w;
    if (["of", "and", "the", "in", "for", "at"].includes(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

function extractTitle(text: string, name: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // ===== Strategy 1: Explicit label — "Title:", "Role:", "Designation:" =====
  const labelPatterns = [
    /(?:title|role|designation|position|job\s*title|current\s*role|current\s*title|current\s*position|professional\s*title)\s*[:\-–|]\s*(.{3,80})/i,
  ];
  for (const pattern of labelPatterns) {
    const m = text.match(pattern);
    if (m) {
      let val = m[1].trim();
      // Remove "Description:" and after
      val = val.replace(/\s*description\s*:.*$/i, "").trim();
      val = val.replace(/[|•·,;\-–—:]+$/, "").trim();
      const found = findKnownTitle(val, true);
      if (found) return toTitleCase(found);
      // Even if not in our list, if short and clean, use it
      if (val.length >= 3 && val.length <= 55 && val.split(/\s+/).length <= 6) {
        return toTitleCase(val);
      }
    }
  }

  // ===== Strategy 2: Lines 2-8 (right after name) — ONLY match KNOWN titles =====
  for (let i = 1; i < Math.min(lines.length, 9); i++) {
    const line = lines[i];

    // Skip contact info
    if (/^[+\d(\s\-]/.test(line) && /\d{5,}/.test(line.replace(/[\s\-()]/g, ""))) continue;
    if (/@/.test(line)) continue;
    if (/^https?:\/\//i.test(line) || /linkedin|github/i.test(line)) continue;
    if (/^(address|phone|email|contact|mobile|tel|location|city)/i.test(line)) continue;
    if (line.toLowerCase().trim() === name.toLowerCase().trim()) continue;

    // Line must be short enough to be a title (max 8 words, 70 chars)
    const words = line.trim().split(/\s+/);
    if (words.length > 8 || line.trim().length > 70) continue;

    // ONLY accept if a KNOWN title is found
    const found = findKnownTitle(line);
    if (found) return toTitleCase(found);
  }

  // ===== Strategy 3: Summary/Profile section =====
  const summaryPatterns = [
    /(?:professional\s*summary|summary|profile|objective|career\s*objective|about\s*me|overview)\s*[:\-–\n]\s*(.{10,300})/i,
  ];
  for (const pattern of summaryPatterns) {
    const m = text.match(pattern);
    if (m) {
      const found = findKnownTitle(m[1]);
      if (found) return toTitleCase(found);
    }
  }

  // ===== Strategy 4: "Experienced/Skilled <ROLE>" pattern =====
  const descPatterns = [
    /(?:experienced|skilled|certified|accomplished|seasoned|dedicated|passionate|motivated|results[- ]driven|detail[- ]oriented)\s+([\w\s/.#+-]{2,40}(?:developer|engineer|architect|manager|analyst|designer|consultant|scientist|specialist|administrator|coordinator|lead))\b/i,
  ];
  for (const dp of descPatterns) {
    const m = text.match(dp);
    if (m) {
      const found = findKnownTitle(m[0]);
      if (found) return toTitleCase(found);
    }
  }

  // ===== Strategy 5: Full text scan — ONLY known 2+ word titles =====
  const found = findKnownTitle(text);
  if (found) return toTitleCase(found);

  return "";
}

export function parseResume(text: string, fileName: string): Candidate {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  let name = (lines[0] || "Unknown").substring(0, 60).trim();

  name = name.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "").trim();
  name = name.replace(/\+?\d[\d\s-]{8,}/g, "").trim();
  name = name.replace(/https?:\/\/\S+/g, "").trim();
  name = name.replace(/[|•·,]/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length < 2) name = "Unknown Candidate";

  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  const phonePatterns = [
    /\+?1?\s*\(?\d{3}\)?\s*[-.\s]?\d{3}\s*[-.\s]?\d{4}/,
    /\+91\s*[-.\s]?\d{5}\s*[-.\s]?\d{5}/,
    /\+?\d[\d\s-]{8,15}/,
  ];
  let phone = "";
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) { phone = match[0].trim(); break; }
  }

  const expMatch = text.toLowerCase().match(/(\d+\+?\s?years?)/);
  const experience = expMatch ? expMatch[0] : "";

  const lowerText = text.toLowerCase();
  const foundSkills: string[] = [];
  for (const skill of SKILL_LIST) {
    if (skill.includes(" ") || skill.includes(".") || skill.includes("/") || skill.includes("+") || skill.includes("#")) {
      if (lowerText.includes(skill)) foundSkills.push(skill);
    } else {
      if (hasWordMatch(text, skill)) foundSkills.push(skill);
    }
  }
  const skills = foundSkills.join(", ");

  const location = extractLocation(text);
  const title = extractTitle(text, name);

  return {
    id: uuidv4(),
    name,
    title,
    email,
    phone,
    skills,
    experience,
    location,
    content: text,
    fileName,
    uploadedAt: new Date().toISOString(),
  };
}
