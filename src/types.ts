export interface Candidate {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  location: string;
  content: string;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchedPreferred?: string[];
  missingPreferred?: string[];
}
