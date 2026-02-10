export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  content: string;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}
