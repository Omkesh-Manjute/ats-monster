import type { Candidate } from "../types";

// Extract meaningful keywords from JD text
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  
  // Remove common stop words
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "just", "don", "now", "and", "but", "or", "if", "while", "about",
    "up", "it", "its", "they", "them", "their", "this", "that", "these",
    "those", "am", "we", "you", "he", "she", "his", "her", "my", "your",
    "our", "what", "which", "who", "whom", "any", "also", "etc", "able",
    "must", "work", "working", "experience", "role", "position", "job",
    "candidate", "looking", "required", "requirements", "responsibilities",
    "company", "team", "strong", "good", "well", "year", "years", "plus",
  ]);

  // Extract words (2+ chars)
  const words = lower.match(/[a-z][a-z0-9#+.]*[a-z0-9+#]|[a-z]/g) || [];
  
  // Filter stop words and short words
  const keywords = words.filter(w => w.length >= 2 && !stopWords.has(w));
  
  // Also extract multi-word tech terms
  const multiWordTerms = [
    "machine learning", "deep learning", "data science", "data engineering",
    "data analyst", "data warehouse", "power bi", "rest api", "web development",
    "full stack", "front end", "back end", "ci cd", "version control",
    "natural language processing", "computer vision", "cloud computing",
    "project management", "agile methodology", "software development",
    "problem solving", "team player", "communication skills",
    "artificial intelligence", "business intelligence", "quality assurance",
    "unit testing", "integration testing", "micro services", "object oriented",
    "design patterns", "system design", "distributed systems",
  ];

  const foundMulti = multiWordTerms.filter(term => lower.includes(term));
  
  // Deduplicate
  const uniqueKeywords = [...new Set([...keywords, ...foundMulti])];
  
  return uniqueKeywords;
}

export interface MatchResult {
  candidate: Candidate;
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  totalJdKeywords: number;
}

export function matchCandidatesWithJD(
  candidates: Candidate[],
  jdText: string
): MatchResult[] {
  if (!jdText.trim()) return [];

  const jdKeywords = extractKeywords(jdText);
  
  if (jdKeywords.length === 0) return [];

  const results: MatchResult[] = candidates.map((candidate) => {
    const candidateText = (
      candidate.content + " " + candidate.skills
    ).toLowerCase();

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const keyword of jdKeywords) {
      if (candidateText.includes(keyword)) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }

    // Unique matched
    const uniqueMatched = [...new Set(matchedKeywords)];
    const uniqueMissing = [...new Set(missingKeywords)];
    const uniqueTotal = [...new Set(jdKeywords)];

    const matchPercentage = Math.round(
      (uniqueMatched.length / uniqueTotal.length) * 100
    );

    return {
      candidate,
      matchPercentage,
      matchedKeywords: uniqueMatched,
      missingKeywords: uniqueMissing,
      totalJdKeywords: uniqueTotal.length,
    };
  });

  // Sort by match percentage descending
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return results;
}
