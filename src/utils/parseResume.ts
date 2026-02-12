export const SKILL_LIST = [
  "python", "sql", "azure", "aws", "java", "react", "etl", "spark",
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
  "azure data factory", "azure synapse", "azure devops", "azure functions",
  "aws glue", "aws redshift", "aws emr", "aws sagemaker",
  "google bigquery", "google cloud", "looker", "dbt",
  "informatica", "talend", "ssis", "ssrs", "ssas",
  "pyspark", "hive", "presto", "athena", "cosmos db",
  "neo4j", "cassandra", "elasticsearch", "kibana", "grafana",
  "splunk", "datadog", "new relic", "prometheus",
  "ansible", "puppet", "chef", "vagrant", "packer",
  "istio", "helm", "argocd", "tekton", "gitlab ci",
  "github actions", "circleci", "travis ci", "bamboo",
  "confluence", "trello", "asana", "monday", "notion",
  "soap", "xml", "json", "yaml", "protobuf", "grpc",
  "rabbitmq", "activemq", "celery", "sidekiq",
  "stripe", "twilio", "sendgrid", "auth0", "okta",
  "adobe xd", "invision", "zeplin",
  "rollup", "parcel", "esbuild", "turbopack",
  "storybook", "chromatic", "percy", "playwright", "puppeteer",
  "gatling", "jmeter", "locust", "k6",
  "sonarqube", "fortify", "checkmarx", "snyk", "veracode",
];

// =================== LOCATION DETECTION (US ONLY - STRICT) ===================

// Indian cities blacklist - NEVER match these
const INDIAN_CITIES = new Set([
  "agra", "ahmedabad", "allahabad", "amritsar", "aurangabad", "bangalore", "bengaluru",
  "bhopal", "bhubaneswar", "chandigarh", "chennai", "coimbatore", "dehradun", "delhi",
  "new delhi", "faridabad", "gandhinagar", "ghaziabad", "greater noida", "guntur",
  "gurgaon", "gurugram", "guwahati", "gwalior", "haridwar", "hubli", "hyderabad",
  "indore", "jabalpur", "jaipur", "jamshedpur", "jodhpur", "kanpur", "kochi",
  "kolhapur", "kolkata", "kozhikode", "lucknow", "ludhiana", "madurai", "mangalore",
  "meerut", "mohali", "mumbai", "mysore", "mysuru", "nagpur", "nashik", "navi mumbai",
  "noida", "panaji", "panchkula", "patna", "pondicherry", "puducherry", "pune",
  "raipur", "rajkot", "ranchi", "rishikesh", "salem", "shimla", "siliguri", "srinagar",
  "surat", "thane", "thiruvananthapuram", "tiruchirappalli", "tirunelveli", "tirupati",
  "trivandrum", "udaipur", "vadodara", "varanasi", "vasai", "vijayawada",
  "visakhapatnam", "warangal", "zirakpur",
]);

// Indian state/context keywords
const INDIA_KEYWORDS = [
  "india", "indian", "bharat", "maharashtra", "karnataka", "tamil nadu", "tamilnadu",
  "telangana", "andhra pradesh", "uttar pradesh", "rajasthan", "gujarat", "west bengal",
  "madhya pradesh", "punjab", "haryana", "kerala", "bihar", "odisha", "chhattisgarh",
  "jharkhand", "assam", "himachal pradesh", "uttarakhand", "goa",
];

// US cities - comprehensive list
const US_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco",
  "Seattle", "Denver", "Nashville", "Oklahoma City", "El Paso", "Washington DC",
  "Boston", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore",
  "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Mesa", "Sacramento",
  "Atlanta", "Kansas City", "Colorado Springs", "Omaha", "Raleigh", "Miami",
  "Virginia Beach", "Long Beach", "Oakland", "Minneapolis", "Tulsa", "Tampa",
  "Arlington", "New Orleans", "Cleveland", "Pittsburgh", "Detroit",
  "St. Louis", "Saint Louis", "Cincinnati", "Orlando", "Salt Lake City",
  "Irvine", "Plano", "Jersey City", "Silicon Valley", "Bay Area",
  "San Mateo", "Palo Alto", "Mountain View", "Sunnyvale", "Cupertino",
  "Redmond", "Bellevue", "Santa Clara", "Fremont", "Pasadena", "Tempe",
  "Scottsdale", "Boulder", "Ann Arbor", "Madison", "Durham", "Chapel Hill",
  "Cambridge", "Somerville", "Hoboken", "Stamford", "White Plains",
  "Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island",
  "Reston", "Tysons", "McLean", "Herndon", "Fairfax", "Ashburn",
  "Princeton", "Morristown", "Edison", "Parsippany",
  "Irving", "Frisco", "Richardson", "McKinney", "Denton",
  "Chandler", "Gilbert", "Glendale", "Peoria",
  "Roseville", "Folsom", "Santa Monica", "Burbank", "Torrance",
  "Redwood City", "Foster City", "Milpitas", "Campbell", "Los Gatos",
  "Alpharetta", "Marietta", "Duluth", "Decatur", "Sandy Springs",
  "Cary", "Morrisville", "Research Triangle",
  "Belmont", "Kirkland", "Bothell", "Tacoma", "Everett",
  "Naperville", "Schaumburg", "Evanston", "Waukegan",
  "Troy", "Warren", "Dearborn", "Livonia",
  "Overland Park", "Lenexa", "Leawood",
  "Reno", "Henderson", "Sparks",
  "Newport Beach", "Costa Mesa", "Huntington Beach", "Anaheim",
  "Boca Raton", "Fort Lauderdale", "West Palm Beach", "Coral Gables",
  "Bethesda", "Rockville", "Silver Spring", "Columbia",
  "Wilmington", "Newark",
  "Hartford", "New Haven", "Bridgeport",
  "Providence", "Warwick",
  "Burlington", "Montpelier",
  "Santa Fe", "Rio Rancho",
  "Boise", "Nampa",
  "Anchorage", "Fairbanks",
  "Honolulu", "Maui",
];

const US_CITIES_LOWER = US_CITIES.map(c => c.toLowerCase());

const US_STATE_MAP: Record<string, string> = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
  "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
  "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
  "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
  "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
  "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
  "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
  "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
  "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "Washington DC",
};

const US_STATE_NAMES = Object.values(US_STATE_MAP);

// Ambiguous state codes that could match non-US contexts
const AMBIGUOUS_CODES = new Set(["IN", "OR", "AS", "ME", "HI", "ID", "OK", "DE", "GA"]);

function isKnownUSCity(city: string): boolean {
  const cityLower = city.toLowerCase().trim();
  return US_CITIES_LOWER.some(uc => uc === cityLower);
}

function hasIndiaContext(text: string): boolean {
  const lower = text.toLowerCase();
  return INDIA_KEYWORDS.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lower);
  });
}

function detectLocation(text: string): string {
  const textLower = text.toLowerCase();
  const isIndiaResume = hasIndiaContext(text);

  // STEP 1: Look for "City, STATE_ABBR" pattern
  // e.g. "San Francisco, CA" or "Austin, TX"
  const cityStatePattern = /\b([A-Z][A-Za-z\s.'-]{1,28}),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/g;
  const stateMatches = [...text.matchAll(cityStatePattern)];

  for (const m of stateMatches) {
    const city = m[1].trim();
    const state = m[2].toUpperCase();
    const cityLower = city.toLowerCase();

    // REJECT if city is a known Indian city
    if (INDIAN_CITIES.has(cityLower)) continue;

    // For AMBIGUOUS state codes (IN, OR, GA, etc.), ONLY accept if city is a known US city
    if (AMBIGUOUS_CODES.has(state)) {
      if (isKnownUSCity(city)) {
        return `${city}, ${state}`;
      }
      // Skip ambiguous matches where city is unknown
      continue;
    }

    // For non-ambiguous state codes, accept if city looks reasonable
    if (city.length >= 2 && city.length <= 30) {
      return `${city}, ${state}`;
    }
  }

  // STEP 2: Look for "City, Full State Name" (e.g. "Dallas, Texas")
  for (const stateName of US_STATE_NAMES) {
    const pattern = new RegExp(`\\b([A-Z][A-Za-z\\s.'-]{1,25}),\\s*${stateName}\\b`, 'i');
    const match = text.match(pattern);
    if (match) {
      const city = match[1].trim();
      if (city.length >= 2 && !INDIAN_CITIES.has(city.toLowerCase())) {
        return `${city}, ${stateName}`;
      }
    }
  }

  // STEP 3: Look for US ZIP code context "City, ST 12345"
  const zipPattern = /\b([A-Z][A-Za-z\s.'-]{1,25}),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/;
  const zipMatch = text.match(zipPattern);
  if (zipMatch) {
    const city = zipMatch[1].trim();
    const state = zipMatch[2];
    if (US_STATE_MAP[state] && !INDIAN_CITIES.has(city.toLowerCase())) {
      return `${city}, ${state}`;
    }
  }

  // STEP 4: Explicit "Location: xxx" label
  const labelPattern = /(?:location|address|based\s+in|located\s+in|city)[:\s]+([^\n,|•]{2,40})/i;
  const labelMatch = text.match(labelPattern);
  if (labelMatch) {
    const loc = labelMatch[1].trim();
    const locLower = loc.toLowerCase();
    // Only accept if NOT an Indian city and looks valid
    if (
      !INDIAN_CITIES.has(locLower) &&
      !INDIA_KEYWORDS.some(k => locLower.includes(k)) &&
      loc.length >= 2 && loc.length <= 40 &&
      !/[0-9]{4,}/.test(loc) &&
      !loc.includes("@")
    ) {
      return loc;
    }
  }

  // STEP 5: Search for known US city names in FIRST 10 LINES only
  // This is most reliable - resume header usually has location
  const headerLines = text.split("\n").slice(0, 10).join(" ");
  for (const city of US_CITIES) {
    const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(headerLines)) {
      // Double check it's not in an Indian context in those lines
      const headerLower = headerLines.toLowerCase();
      if (!INDIA_KEYWORDS.some(k => headerLower.includes(k))) {
        return city;
      }
    }
  }

  // STEP 6: Search FULL text for known US city names
  // But ONLY if the resume doesn't have India context
  if (!isIndiaResume) {
    for (const city of US_CITIES) {
      const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(textLower)) {
        return city;
      }
    }
  }

  // STEP 7: Remote/WFH/Hybrid
  const remotePattern = /\b(remote|work from home|wfh|hybrid|fully remote|telecommute)\b/i;
  const remoteMatch = text.match(remotePattern);
  if (remoteMatch) {
    return "Remote";
  }

  // STEP 8: Country mention (only USA/US, skip India)
  if (!isIndiaResume) {
    const usMatch = text.match(/\b(United States|USA|U\.S\.A\.?)\b/i);
    if (usMatch) return "USA";
  }

  return "";
}

// =================== JOB TITLE DETECTION ===================

const JOB_TITLE_PATTERNS: string[] = [
  "software engineer", "software developer", "senior software engineer", "staff software engineer",
  "principal software engineer", "lead software engineer", "full stack developer", "fullstack developer",
  "frontend developer", "front end developer", "front-end developer", "backend developer", "back end developer",
  "back-end developer", "web developer", "mobile developer", "ios developer", "android developer",
  "application developer", "systems engineer", "platform engineer", "site reliability engineer",
  "sre", "devops engineer", "cloud engineer", "infrastructure engineer", "embedded engineer",
  "firmware engineer", "qa engineer", "test engineer", "sdet", "automation engineer",
  "release engineer", "build engineer", "solutions engineer", "integration engineer",
  "data engineer", "data scientist", "data analyst", "senior data engineer", "lead data engineer",
  "azure data engineer", "aws data engineer", "gcp data engineer", "cloud data engineer",
  "big data engineer", "etl developer", "bi developer", "bi analyst", "bi engineer",
  "business intelligence developer", "business intelligence analyst",
  "analytics engineer", "data architect", "database administrator", "dba",
  "machine learning engineer", "ml engineer", "ai engineer", "deep learning engineer",
  "nlp engineer", "computer vision engineer", "research scientist", "applied scientist",
  "software architect", "solution architect", "solutions architect", "enterprise architect",
  "technical architect", "cloud architect", "data architect", "system architect",
  "engineering manager", "engineering director", "vp of engineering", "vp engineering",
  "chief technology officer", "cto", "chief data officer", "cdo",
  "technical lead", "tech lead", "team lead", "development lead",
  "principal engineer", "distinguished engineer", "fellow engineer",
  "business analyst", "senior business analyst", "lead business analyst",
  "business systems analyst", "systems analyst", "business system analyst",
  "requirements analyst", "functional analyst", "process analyst",
  "business analysis consultant", "business system analysis consultant",
  "project manager", "senior project manager", "program manager", "portfolio manager",
  "product manager", "senior product manager", "product owner", "scrum master",
  "agile coach", "delivery manager", "engagement manager",
  "technical program manager", "technical project manager",
  "ux designer", "ui designer", "ui/ux designer", "ux/ui designer",
  "product designer", "visual designer", "interaction designer",
  "graphic designer", "web designer", "creative director",
  "ux researcher", "design lead",
  "cloud administrator", "cloud consultant", "azure administrator",
  "aws administrator", "system administrator", "network engineer",
  "network administrator", "security engineer", "cybersecurity analyst",
  "information security analyst", "security architect",
  "consultant", "senior consultant", "managing consultant", "principal consultant",
  "technology consultant", "it consultant", "management consultant",
  "strategy consultant", "functional consultant", "technical consultant",
  "it manager", "it director", "it analyst", "it specialist",
  "help desk analyst", "support engineer", "technical support",
  "recruiter", "technical recruiter", "hr manager", "hr analyst",
  "marketing manager", "sales manager", "account manager",
  "financial analyst", "accountant", "controller",
  "operations manager", "supply chain analyst",
];

const SORTED_TITLES = [...JOB_TITLE_PATTERNS].sort((a, b) => b.length - a.length);

function detectJobTitle(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Strategy 1: Look for explicit title labels
  for (const line of lines.slice(0, 30)) {
    const labelMatch = line.match(/^(?:title|role|designation|position|job\s*title|current\s*role|current\s*title|professional\s*title)\s*[:\-|]\s*(.+)/i);
    if (labelMatch) {
      const candidate = labelMatch[1].trim();
      if (candidate.length > 2 && candidate.length < 80) {
        return candidate;
      }
    }
  }

  // Strategy 2: Check first 8 lines for known job title patterns
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().replace(/[^a-z0-9\s\/\-\.]/g, '').trim();

    if (!lineLower) continue;
    if (lineLower.includes("@")) continue;
    if (/^\+?\d[\d\s\-\(\)]{7,}$/.test(line.trim())) continue;
    if (/^\d{5}/.test(line.trim())) continue;
    if (lineLower.length > 100) continue;

    for (const title of SORTED_TITLES) {
      const titleRegex = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i');
      if (titleRegex.test(lineLower)) {
        if (line.trim().length <= 70) {
          return line.trim();
        }
        return titleCase(title);
      }
    }
  }

  // Strategy 3: Check second line for title-like keywords
  if (lines.length > 1) {
    const secondLine = lines[1];
    const secondLineLower = secondLine.toLowerCase().trim();

    if (
      secondLine.length > 3 &&
      secondLine.length < 70 &&
      !secondLineLower.includes("@") &&
      !/^\+?\d[\d\s\-\(\)]{7,}$/.test(secondLine.trim()) &&
      !/^(phone|email|address|location|linkedin|github|http|www)/i.test(secondLineLower)
    ) {
      const titleKeywords = /\b(engineer|developer|analyst|manager|architect|designer|consultant|scientist|lead|director|administrator|specialist|coordinator|officer|intern|trainee|associate|senior|junior|staff|principal|vp|head)\b/i;
      if (titleKeywords.test(secondLineLower)) {
        return secondLine.trim().substring(0, 70);
      }
    }
  }

  // Strategy 4: Search deeper but only match clean title occurrences
  for (const title of SORTED_TITLES) {
    const titleRegex = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i');
    const fullLower = text.toLowerCase();
    const match = fullLower.match(titleRegex);
    if (match) {
      const idx = match.index || 0;
      const lineStart = fullLower.lastIndexOf("\n", idx);
      const lineEnd = fullLower.indexOf("\n", idx);
      const fullLine = text.substring(lineStart + 1, lineEnd === -1 ? text.length : lineEnd).trim();

      // Only accept if the line is short (looks like a title, not a sentence)
      if (fullLine.length <= 80) {
        return titleCase(title);
      }
    }
  }

  return "";
}

function titleCase(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// =================== RESUME PARSER ===================

export function parseResume(text: string) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const name = lines.length > 0 ? lines[0].substring(0, 60).trim() : "Unknown";

  const title = detectJobTitle(text);

  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  const phonePatterns = [
    /\+1[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /\+?\d{1,3}[\s.-]?\d{3,5}[\s.-]?\d{3,5}[\s.-]?\d{0,5}/,
    /\+?\d[\d\s-]{8,}/,
  ];
  let phone = "";
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phone = match[0].trim();
      break;
    }
  }

  const expMatch = text.toLowerCase().match(/(\d+\+?\s?years?)/);
  const experience = expMatch ? expMatch[0] : "";

  const location = detectLocation(text);

  const lowerText = text.toLowerCase();
  const skills = SKILL_LIST.filter((s) => {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerText);
  }).join(", ");

  return { name, title, email, phone, skills, experience, location };
}

// =================== JD MATCHING (STRICT - SKILLS FOCUSED) ===================

// Words to COMPLETELY IGNORE during matching
const STOP_WORDS = new Set([
  "data", "team", "work", "good", "experience", "years", "ability", "strong",
  "knowledge", "understanding", "working", "development", "system", "systems",
  "management", "process", "business", "support", "service", "services",
  "application", "applications", "design", "build", "create", "develop",
  "implement", "maintain", "manage", "lead", "drive", "ensure", "provide",
  "deliver", "include", "including", "using", "used", "well", "best",
  "high", "level", "based", "related", "required", "preferred", "plus",
  "must", "have", "with", "from", "this", "that", "will", "should",
  "about", "their", "they", "been", "being", "some", "other", "which",
  "would", "could", "also", "into", "over", "such", "than", "then",
  "them", "these", "those", "very", "just", "only", "like", "make",
  "made", "more", "most", "need", "want", "help", "take", "come",
  "role", "position", "candidate", "looking", "seeking", "hiring",
  "responsibilities", "qualifications", "requirements", "description",
  "opportunity", "join", "company", "organization", "environment",
  "tools", "technologies", "across", "within", "between", "through",
  "skills", "skill", "technical", "hands", "practice", "practices",
  "collaborate", "collaboration", "communication", "communicate",
  "analytical", "analysis", "analyze", "problem", "solving", "solution",
  "responsible", "ability", "proven", "track", "record", "excellent",
  "proficiency", "proficient", "familiarity", "familiar", "exposure",
  "solid", "deep", "expert", "expertise", "minimum", "maximum",
  "bachelor", "master", "degree", "certification", "certified",
  "equivalent", "education", "qualification",
]);

// Extract skills from text using our SKILL_LIST
function extractSkillsFromText(t: string): string[] {
  const lower = t.toLowerCase();
  return SKILL_LIST.filter((s) => {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lower);
  });
}

// Parse JD into structured sections
function parseJD(jdText: string): {
  jdTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  allJdSkills: string[];
} {
  const jdTitle = detectJobTitle(jdText);
  const lines = jdText.split(/\n/);

  let inRequired = false;
  let inPreferred = false;
  let requiredText = "";
  let preferredText = "";

  const requiredHeaders = /\b(required\s*(skills|qualifications|experience)?|must\s+have|requirements|mandatory|essential|minimum\s+qualifications|basic\s+qualifications|key\s+skills|core\s+skills)\b/i;
  const preferredHeaders = /\b(preferred\s*(skills|qualifications)?|nice\s+to\s+have|good\s+to\s+have|desired|bonus|additional\s*(skills|qualifications)?|plus|preferred\s+qualifications|added\s+advantage)\b/i;
  const sectionBreak = /^(?:#{1,3}\s|[A-Z][A-Z\s]{3,}:?\s*$|.*:\s*$)/;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line is a required section header
    if (requiredHeaders.test(trimmed) && trimmed.length < 80) {
      inRequired = true;
      inPreferred = false;
      // Also include this line's content after the header
      const afterHeader = trimmed.replace(requiredHeaders, '').replace(/^[:\s-]+/, '').trim();
      if (afterHeader) requiredText += " " + afterHeader;
      continue;
    }

    // Check if line is a preferred section header
    if (preferredHeaders.test(trimmed) && trimmed.length < 80) {
      inPreferred = true;
      inRequired = false;
      const afterHeader = trimmed.replace(preferredHeaders, '').replace(/^[:\s-]+/, '').trim();
      if (afterHeader) preferredText += " " + afterHeader;
      continue;
    }

    // If we hit another section header, stop collecting
    if (
      trimmed.length > 0 && trimmed.length < 60 &&
      sectionBreak.test(trimmed) &&
      !requiredHeaders.test(trimmed) &&
      !preferredHeaders.test(trimmed)
    ) {
      inRequired = false;
      inPreferred = false;
    }

    if (inRequired) requiredText += " " + trimmed;
    if (inPreferred) preferredText += " " + trimmed;
  }

  // Extract skills from each section
  let requiredSkills = extractSkillsFromText(requiredText);
  let preferredSkills = extractSkillsFromText(preferredText);
  const allJdSkills = extractSkillsFromText(jdText);

  // If no structured sections found, ALL skills are "required"
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    requiredSkills = allJdSkills;
  }

  // Remove duplicates - required takes priority
  preferredSkills = preferredSkills.filter(s => !requiredSkills.includes(s));

  return { jdTitle, requiredSkills, preferredSkills, allJdSkills };
}

export { parseJD };

export function matchJD(candidateText: string, candidateSkills: string, jdText: string): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedPreferred: string[];
  missingPreferred: string[];
} {
  if (!jdText.trim()) return { score: 0, matchedSkills: [], missingSkills: [], matchedPreferred: [], missingPreferred: [] };

  const { jdTitle, requiredSkills, preferredSkills } = parseJD(jdText);

  // Candidate's extracted skills
  const candidateSkillsArr = candidateSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const candidateTitle = detectJobTitle(candidateText).toLowerCase();

  // ---- TITLE MATCH (30% weight) ----
  let titleScore = 0;
  if (jdTitle) {
    const jdTitleLower = jdTitle.toLowerCase();

    if (candidateTitle) {
      // Exact or containment match
      if (candidateTitle.includes(jdTitleLower) || jdTitleLower.includes(candidateTitle)) {
        titleScore = 1.0;
      } else {
        // Word overlap
        const jdTitleWords = jdTitleLower.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        const candTitleWords = candidateTitle.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

        if (jdTitleWords.length > 0 && candTitleWords.length > 0) {
          const matchedWords = jdTitleWords.filter(w => candTitleWords.includes(w));
          titleScore = matchedWords.length / jdTitleWords.length;

          // Core role mismatch penalty
          const coreRoles = ["engineer", "developer", "analyst", "manager", "architect", "designer", "scientist", "administrator", "consultant", "director", "lead"];
          const jdCore = jdTitleWords.filter(w => coreRoles.includes(w));
          const candCore = candTitleWords.filter(w => coreRoles.includes(w));

          if (jdCore.length > 0 && candCore.length > 0) {
            const coreMatch = jdCore.some(w => candCore.includes(w));
            if (!coreMatch) {
              titleScore *= 0.15; // 85% penalty for completely wrong role
            }
          }
        }
      }
    } else {
      // No candidate title - check if JD title words appear in resume
      const jdTitleRegex = new RegExp(`\\b${jdTitleLower.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i');
      if (jdTitleRegex.test(candidateText.toLowerCase())) {
        titleScore = 0.5;
      }
    }
  }

  // ---- REQUIRED SKILLS MATCH (45% weight - MOST IMPORTANT) ----
  const matchedRequired = requiredSkills.filter(s => candidateSkillsArr.includes(s.toLowerCase()));
  const missingRequired = requiredSkills.filter(s => !candidateSkillsArr.includes(s.toLowerCase()));
  const requiredScore = requiredSkills.length > 0
    ? matchedRequired.length / requiredSkills.length
    : 0;

  // ---- PREFERRED SKILLS MATCH (15% weight) ----
  const matchedPref = preferredSkills.filter(s => candidateSkillsArr.includes(s.toLowerCase()));
  const missingPref = preferredSkills.filter(s => !candidateSkillsArr.includes(s.toLowerCase()));
  const preferredScore = preferredSkills.length > 0
    ? matchedPref.length / preferredSkills.length
    : 0;

  // ---- KEYWORD OVERLAP (10% weight) - only meaningful words ----
  const jdKeywords = jdText.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4 && !STOP_WORDS.has(w));
  const uniqueKeywords = [...new Set(jdKeywords)];
  const candidateLower = candidateText.toLowerCase();
  const keywordMatches = uniqueKeywords.filter(w => candidateLower.includes(w));
  const keywordScore = uniqueKeywords.length > 0
    ? keywordMatches.length / uniqueKeywords.length
    : 0;

  // ---- FINAL SCORE CALCULATION ----
  let totalScore: number;

  if (jdTitle) {
    totalScore = (titleScore * 0.30) + (requiredScore * 0.45) + (preferredScore * 0.15) + (keywordScore * 0.10);
  } else {
    totalScore = (requiredScore * 0.55) + (preferredScore * 0.25) + (keywordScore * 0.20);
  }

  // STRICT CAP: If title completely doesn't match, cap at 35%
  if (jdTitle && titleScore < 0.1 && totalScore > 0.35) {
    totalScore = 0.35;
  }

  // If ZERO required skills match, cap at 25%
  if (requiredSkills.length > 0 && matchedRequired.length === 0 && totalScore > 0.25) {
    totalScore = 0.25;
  }

  // If BOTH title and required skills are bad, cap at 15%
  if (jdTitle && titleScore < 0.1 && requiredSkills.length > 0 && matchedRequired.length <= 1 && totalScore > 0.15) {
    totalScore = 0.15;
  }

  const finalScore = Math.min(Math.round(totalScore * 100), 100);

  return {
    score: finalScore,
    matchedSkills: matchedRequired,
    missingSkills: missingRequired,
    matchedPreferred: matchedPref,
    missingPreferred: missingPref,
  };
}
