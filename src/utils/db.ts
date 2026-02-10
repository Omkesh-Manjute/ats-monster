import type { Candidate } from "../types";

const DB_KEY = "ats_candidates";

export function getAllCandidates(): Candidate[] {
  const data = localStorage.getItem(DB_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as Candidate[];
  } catch {
    return [];
  }
}

export function saveCandidate(candidate: Candidate): void {
  const candidates = getAllCandidates();
  candidates.push(candidate);
  localStorage.setItem(DB_KEY, JSON.stringify(candidates));
}

export function saveAllCandidates(candidates: Candidate[]): void {
  localStorage.setItem(DB_KEY, JSON.stringify(candidates));
}

export function deleteCandidate(id: string): void {
  const candidates = getAllCandidates().filter((c) => c.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(candidates));
}

export function clearAllCandidates(): void {
  localStorage.removeItem(DB_KEY);
}
