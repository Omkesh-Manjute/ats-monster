import type { Candidate } from "../types";

const STORAGE_KEY = "ats_candidates";

export function loadCandidates(): Candidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Candidate[];
  } catch {
    return [];
  }
}

export function saveCandidates(candidates: Candidate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

export function addCandidate(candidate: Candidate): Candidate[] {
  const all = loadCandidates();
  all.unshift(candidate);
  saveCandidates(all);
  return all;
}

export function deleteCandidate(id: string): Candidate[] {
  const all = loadCandidates().filter((c) => c.id !== id);
  saveCandidates(all);
  return all;
}
