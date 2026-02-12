import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Candidate } from "./types";
import { extractText } from "./utils/extractText";
import { parseResume, matchJD, parseJD } from "./utils/parseResume";
import { getAllCandidates, saveCandidate, deleteCandidate, saveAllCandidates } from "./utils/db";

// Format resume text into sections
function formatResumeContent(text: string) {
  if (!text) return [];

  const lines = text.split("\n");
  const sections: { type: "heading" | "subheading" | "bullet" | "text" | "empty"; content: string }[] = [];

  const headingKeywords = [
    "education", "experience", "work experience", "professional experience",
    "skills", "technical skills", "core competencies", "projects", "certifications", "certification",
    "summary", "objective", "profile", "professional profile", "about", "contact", "achievements",
    "awards", "publications", "references", "languages", "interests",
    "hobbies", "volunteer", "training", "courses", "professional summary",
    "work history", "employment", "employment history", "qualifications", "key skills",
    "areas of expertise", "technologies", "tools", "personal information",
    "personal details", "career objective", "career summary",
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      sections.push({ type: "empty", content: "" });
      continue;
    }

    const lower = trimmed.toLowerCase().replace(/[:\-_|#*]/g, "").trim();

    const isHeading = headingKeywords.some(kw => {
      return lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw);
    });

    const isAllCaps = trimmed.length > 3 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && /[A-Z]{3,}/.test(trimmed);

    if (isHeading || isAllCaps) {
      sections.push({ type: "heading", content: trimmed });
    } else if (/^[\u2022\u2023\u25E6\u2043\u2219●○■□▪▸►•\-\*\>]\s/.test(trimmed) || /^\d+[\.\\)]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[\u2022\u2023\u25E6\u2043\u2219●○■□▪▸►•\-\*\>]\s*/, "").replace(/^\d+[\.\\)]\s*/, "");
      sections.push({ type: "bullet", content });
    } else if (trimmed.length < 65 && !trimmed.includes(". ") && /^[A-Z]/.test(trimmed) && !/[@]/.test(trimmed)) {
      sections.push({ type: "subheading", content: trimmed });
    } else {
      sections.push({ type: "text", content: trimmed });
    }
  }

  return sections;
}

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jdText, setJdText] = useState("");
  const [jdApplied, setJdApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<"candidates" | "jd">("candidates");
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractMinScore, setExtractMinScore] = useState(0);
  const [showRawResume, setShowRawResume] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCandidates(getAllCandidates());
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // BULK UPLOAD
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      try {
        const text = await extractText(file);
        if (!text.trim()) {
          failCount++;
          continue;
        }

        const { name, title, email, phone, skills, experience, location } = parseResume(text);
        const candidate: Candidate = {
          id: uuidv4(),
          name: name || file.name.replace(/\.[^.]+$/, ""),
          title,
          email,
          phone,
          skills,
          experience,
          location,
          content: text,
        };

        if (jdApplied && jdText.trim()) {
          const match = matchJD(text, skills, jdText);
          candidate.matchScore = match.score;
          candidate.matchedSkills = match.matchedSkills;
          candidate.missingSkills = match.missingSkills;
          candidate.matchedPreferred = match.matchedPreferred;
          candidate.missingPreferred = match.missingPreferred;
        }

        saveCandidate(candidate);
        successCount++;
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        failCount++;
      }
    }

    setCandidates(getAllCandidates());

    if (failCount === 0) {
      setToast(`✅ ${successCount} resume(s) uploaded successfully!`);
    } else {
      setToast(`✅ ${successCount} uploaded, ⚠️ ${failCount} failed`);
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = "";
  }, [jdApplied, jdText]);

  const handleDelete = useCallback((id: string) => {
    deleteCandidate(id);
    setCandidates(getAllCandidates());
    setSelectedId((prev) => (prev === id ? null : prev));
    setToast("🗑️ Candidate deleted");
  }, []);

  // APPLY JD MATCHING
  const applyJDMatching = useCallback(() => {
    if (!jdText.trim()) {
      setToast("⚠️ Please paste a Job Description first");
      return;
    }

    const allCandidates = getAllCandidates();
    const updated = allCandidates.map((c) => {
      const match = matchJD(c.content, c.skills, jdText);
      return {
        ...c,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        matchedPreferred: match.matchedPreferred,
        missingPreferred: match.missingPreferred,
      };
    });

    updated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    saveAllCandidates(updated);
    setCandidates(updated);
    setJdApplied(true);
    setActiveTab("candidates");
    setToast(`🎯 JD matching applied! ${updated.length} candidates ranked`);
  }, [jdText]);

  // CLEAR JD
  const clearJD = useCallback(() => {
    const allCandidates = getAllCandidates().map((c) => ({
      ...c,
      matchScore: undefined,
      matchedSkills: undefined,
      missingSkills: undefined,
      matchedPreferred: undefined,
      missingPreferred: undefined,
    }));
    saveAllCandidates(allCandidates);
    setCandidates(allCandidates);
    setJdText("");
    setJdApplied(false);
    setToast("🧹 JD matching cleared");
  }, []);

  // Filter candidates
  const filtered = candidates.filter((c) => {
    if (nameFilter && !c.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (emailFilter && !c.email.toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (skillFilter && !c.skills.toLowerCase().includes(skillFilter.toLowerCase())) return false;
    if (locationFilter && !(c.location || "").toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (titleFilter && !(c.title || "").toLowerCase().includes(titleFilter.toLowerCase())) return false;
    return true;
  });

  const sortedFiltered = jdApplied
    ? [...filtered].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : filtered;

  const selected = candidates.find((c) => c.id === selectedId) || null;

  // Extract candidates
  const getExtractCandidates = useCallback(() => {
    if (!jdApplied) return sortedFiltered;
    return sortedFiltered.filter(c => (c.matchScore || 0) >= extractMinScore);
  }, [jdApplied, sortedFiltered, extractMinScore]);

  const copyExtractedToClipboard = useCallback(() => {
    const extractCands = getExtractCandidates();
    if (extractCands.length === 0) { setToast("⚠️ No candidates to extract"); return; }
    let text = "Name\tTitle\tEmail\tPhone\tLocation\tExperience\tSkills";
    if (jdApplied) text += "\tMatch %";
    text += "\n";
    extractCands.forEach(c => {
      text += `${c.name}\t${c.title || "N/A"}\t${c.email || "N/A"}\t${c.phone || "N/A"}\t${c.location || "N/A"}\t${c.experience || "N/A"}\t${c.skills || "N/A"}`;
      if (jdApplied) text += `\t${c.matchScore || 0}%`;
      text += "\n";
    });
    navigator.clipboard.writeText(text).then(() => {
      setToast(`📋 ${extractCands.length} candidates copied!`);
      setShowExtractModal(false);
    }).catch(() => { downloadExtracted(); });
  }, [getExtractCandidates, jdApplied]);

  const copyEmailsOnly = useCallback(() => {
    const extractCands = getExtractCandidates();
    const emails = extractCands.filter(c => c.email).map(c => c.email).join(", ");
    if (!emails) { setToast("⚠️ No emails found"); return; }
    navigator.clipboard.writeText(emails).then(() => {
      setToast(`📧 ${extractCands.filter(c => c.email).length} emails copied!`);
      setShowExtractModal(false);
    });
  }, [getExtractCandidates]);

  const copyPhonesOnly = useCallback(() => {
    const extractCands = getExtractCandidates();
    const phones = extractCands.filter(c => c.phone).map(c => c.phone).join(", ");
    if (!phones) { setToast("⚠️ No phone numbers found"); return; }
    navigator.clipboard.writeText(phones).then(() => {
      setToast(`📱 ${extractCands.filter(c => c.phone).length} phone numbers copied!`);
      setShowExtractModal(false);
    });
  }, [getExtractCandidates]);

  const downloadExtracted = useCallback(() => {
    const extractCands = getExtractCandidates();
    if (extractCands.length === 0) { setToast("⚠️ No candidates to extract"); return; }
    let csv = "Name,Title,Email,Phone,Location,Experience,Skills";
    if (jdApplied) csv += ",Match %";
    csv += "\n";
    extractCands.forEach(c => {
      csv += `"${c.name}","${c.title || ""}","${c.email || ""}","${c.phone || ""}","${c.location || ""}","${c.experience || ""}","${c.skills || ""}"`;
      if (jdApplied) csv += `,"${c.matchScore || 0}%"`;
      csv += "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates_extract_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`📥 CSV downloaded with ${extractCands.length} candidates!`);
    setShowExtractModal(false);
  }, [getExtractCandidates, jdApplied]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (score >= 50) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    if (score >= 25) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    return "text-red-400 bg-red-500/20 border-red-500/30";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 75) return "from-green-500 to-emerald-400";
    if (score >= 50) return "from-yellow-500 to-amber-400";
    if (score >= 25) return "from-orange-500 to-amber-500";
    return "from-red-500 to-rose-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent Match 🔥";
    if (score >= 70) return "Strong Match 💪";
    if (score >= 50) return "Good Match 👍";
    if (score >= 30) return "Partial Match 🤔";
    return "Low Match ❌";
  };

  const extractCandidatesCount = getExtractCandidates().length;
  const resumeSections = selected ? formatResumeContent(selected.content) : [];

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slideIn">
          {toast}
        </div>
      )}

      {/* Extract Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowExtractModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-slideIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📤</span> Extract Candidate Data
              </h3>
              <button onClick={() => setShowExtractModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition">✕</button>
            </div>

            {jdApplied && (
              <div className="mb-5 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Minimum Match Score: <span className="text-orange-400">{extractMinScore}%</span>
                </label>
                <input type="range" min={0} max={100} step={5} value={extractMinScore} onChange={e => setExtractMinScore(Number(e.target.value))} className="w-full accent-orange-500" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  🎯 <span className="text-white font-medium">{extractCandidatesCount}</span> candidates matched (≥{extractMinScore}%)
                </p>
              </div>
            )}

            <div className="mb-5 bg-gray-800/50 rounded-xl p-4 border border-gray-700 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Preview ({extractCandidatesCount} candidates)</p>
              {getExtractCandidates().slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-700/50 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{c.title || "No title"} • {c.email || "No email"}</p>
                  </div>
                  {jdApplied && c.matchScore !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScoreColor(c.matchScore)}`}>{c.matchScore}%</span>
                  )}
                </div>
              ))}
              {extractCandidatesCount > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">...and {extractCandidatesCount - 5} more</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyEmailsOnly} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition">
                <span>📧</span> Copy Emails
              </button>
              <button onClick={copyPhonesOnly} className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold transition">
                <span>📱</span> Copy Phones
              </button>
              <button onClick={copyExtractedToClipboard} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold transition">
                <span>📋</span> Copy All Data
              </button>
              <button onClick={downloadExtracted} className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-bold transition">
                <span>📥</span> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden`}>
        <div className="w-72 p-5 h-full flex flex-col">
          <h2 className="text-lg font-bold text-orange-400 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Candidate Name</label>
              <input type="text" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Search by name..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Email</label>
              <input type="text" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="Search by email..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Skills</label>
              <input type="text" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} placeholder="e.g. python, react..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">📍 Location</label>
              <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="e.g. San Francisco, TX..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">💼 Job Title</label>
              <input type="text" value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} placeholder="e.g. Data Engineer, Analyst..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" checked={deleteMode} onChange={(e) => setDeleteMode(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-red-600 transition"></div>
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition">Delete Mode</span>
              </label>
            </div>

            {jdApplied && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span>🎯</span> JD Matching Active
                </div>
                <p className="text-xs text-gray-400 mt-1">Candidates ranked by JD match</p>
                <button onClick={clearJD} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">Clear JD Matching</button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">{candidates.length} total candidates</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">SmartHire AI</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button onClick={() => { setActiveTab("candidates"); setMobileShowDetail(false); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "candidates" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
                👥 Candidates
              </button>
              <button onClick={() => setActiveTab("jd")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "jd" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
                📋 Job Description
              </button>
            </div>

            {sortedFiltered.length > 0 && (
              <button onClick={() => setShowExtractModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all">
                <span>📤</span> Extract
              </button>
            )}

            <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm cursor-pointer transition-all ${uploading ? "bg-gray-700 text-gray-400 cursor-wait" : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25"}`}>
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {uploadProgress.current}/{uploadProgress.total}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Bulk Upload
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
        </header>

        {/* Upload Progress */}
        {uploading && uploadProgress.total > 0 && (
          <div className="px-6 py-2 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{uploadProgress.current}/{uploadProgress.total}</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {activeTab === "jd" ? (
            /* JD TAB */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <span>📋</span> Job Description
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Paste your JD below. We'll match & rank candidates based on required skills, preferred skills, and job title.</p>
                  <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-3"></div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Paste Job Description Here:</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder={`Example:\n\nJob Title: Senior Data Engineer\n\nRequired Skills:\n- Python, SQL, Azure Data Factory\n- Spark, Databricks, ETL\n- 5+ years experience\n\nPreferred Skills:\n- Kafka, Airflow\n- AWS or GCP experience`}
                    rows={15}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none font-mono"
                  />
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-5">
                  <p className="text-xs text-gray-400 mb-2">💡 <strong className="text-gray-300">Tip:</strong> For best matching results, include sections like:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Job Title", "Required Skills", "Preferred Skills", "Responsibilities", "Qualifications"].map(s => (
                      <span key={s} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{s}</span>
                    ))}
                  </div>
                </div>

                {/* JD Analysis Preview */}
                {jdText.trim() && (() => {
                  const analysis = parseJD(jdText);
                  return (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔍</span> JD Analysis Preview
                      </h3>

                      {analysis.jdTitle && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Detected Job Title</p>
                          <p className="text-sm font-bold text-orange-400">{analysis.jdTitle}</p>
                        </div>
                      )}

                      {analysis.requiredSkills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            📋 Required Skills ({analysis.requiredSkills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.requiredSkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 bg-red-500/15 text-red-300 rounded-lg text-xs font-medium border border-red-500/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.preferredSkills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            ⭐ Preferred Skills ({analysis.preferredSkills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.preferredSkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-500/15 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.requiredSkills.length === 0 && analysis.allJdSkills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            🛠️ Detected Skills ({analysis.allJdSkills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.allJdSkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 bg-orange-500/15 text-orange-300 rounded-lg text-xs font-medium border border-orange-500/20">
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-yellow-500/70 mt-2">⚠️ No "Required" / "Preferred" sections found. All skills treated as required.</p>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400">
                          <strong className="text-gray-300">Scoring:</strong> Title Match (30%) + Required Skills (45%) + Preferred Skills (15%) + Keywords (10%)
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={applyJDMatching}
                    disabled={!jdText.trim() || candidates.length === 0}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                      !jdText.trim() || candidates.length === 0
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
                    }`}
                  >
                    🎯 Match & Rank Candidates ({candidates.length})
                  </button>

                  {jdApplied && (
                    <>
                      <button onClick={clearJD} className="px-5 py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all flex items-center gap-2">
                        🧹 Clear Matching
                      </button>
                      <button onClick={() => setShowExtractModal(true)} className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all flex items-center gap-2">
                        📤 Extract Contacts
                      </button>
                    </>
                  )}
                </div>

                {candidates.length === 0 && (
                  <p className="text-yellow-500/70 text-sm mt-4">⚠️ Upload some resumes first, then apply JD matching</p>
                )}

                {jdApplied && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🏆</span> Top Ranked Candidates
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {[...candidates]
                        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                        .slice(0, 10)
                        .map((c, idx) => (
                          <div key={c.id} className="flex items-center gap-4 bg-gray-800/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition cursor-pointer" onClick={() => { setSelectedId(c.id); setActiveTab("candidates"); }}>
                            <div className="text-2xl font-bold text-gray-600 w-8 text-center">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                              <p className="text-xs text-orange-400 truncate font-medium">{c.title || "No title"}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {c.email || "No email"} {c.location && `• 📍 ${c.location}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${getScoreBarColor(c.matchScore || 0)} rounded-full`} style={{ width: `${c.matchScore || 0}%` }} />
                              </div>
                              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(c.matchScore || 0)}`}>
                                {c.matchScore || 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* LEFT - Candidate List */}
              <div className={`${mobileShowDetail ? "hidden sm:flex" : "flex"} w-full sm:w-[420px] flex-shrink-0 border-r border-gray-800 flex-col overflow-hidden`}>
                <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Candidates ({sortedFiltered.length})
                  </h2>
                  {jdApplied && <span className="text-xs text-green-400 font-medium">🎯 Ranked</span>}
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {sortedFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
                      <div className="text-5xl mb-4 opacity-30">📂</div>
                      <p className="text-sm text-center">No candidates found.<br />Upload resumes to get started.</p>
                    </div>
                  ) : (
                    sortedFiltered.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 px-4 py-3 border-b border-gray-800/50 cursor-pointer transition-all hover:bg-gray-800/70 ${selectedId === c.id ? "bg-gray-800 border-l-2 border-l-orange-500" : ""}`}
                        onClick={() => { setSelectedId(c.id); setMobileShowDetail(true); }}
                      >
                        {jdApplied && (
                          <div className="text-xs font-bold text-gray-600 w-5 text-center flex-shrink-0">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                          </div>
                        )}

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                          {c.title && <p className="text-xs text-orange-400 font-medium truncate">{c.title}</p>}
                          <p className="text-xs text-gray-500 truncate">{c.email || "No email"}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {c.experience && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">{c.experience}</span>
                            )}
                            {c.location && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">📍 {c.location}</span>
                            )}
                          </div>
                        </div>

                        {jdApplied && c.matchScore !== undefined && (
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${getScoreColor(c.matchScore)}`}>
                            {c.matchScore}%
                          </div>
                        )}

                        {deleteMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                            className="p-2 hover:bg-red-600/20 rounded-lg text-red-400 hover:text-red-300 transition flex-shrink-0"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT - Detail Panel - FULLY SCROLLABLE */}
              <div className={`${mobileShowDetail ? "flex" : "hidden sm:flex"} flex-1 flex-col min-w-0 min-h-0`}>
                {selected ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 pb-16">
                      {/* Back button mobile */}
                      <button onClick={() => setMobileShowDetail(false)} className="sm:hidden mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                        ← Back to list
                      </button>

                      {/* Header */}
                      <div className="flex items-start justify-between mb-6 gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">Candidate Details</h2>
                          <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
                        </div>
                        <button
                          onClick={() => {
                            const data = `Name: ${selected.name}\nTitle: ${selected.title || "N/A"}\nEmail: ${selected.email || "N/A"}\nPhone: ${selected.phone || "N/A"}\nLocation: ${selected.location || "N/A"}\nExperience: ${selected.experience || "N/A"}\nSkills: ${selected.skills || "N/A"}`;
                            navigator.clipboard.writeText(data).then(() => setToast("📋 Details copied!"));
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition flex-shrink-0"
                        >
                          📋 Copy
                        </button>
                      </div>

                      {/* Match Score */}
                      {jdApplied && selected.matchScore !== undefined && (
                        <div className={`mb-6 p-5 rounded-xl border ${getScoreColor(selected.matchScore)}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold">JD Match Score</h3>
                              <p className="text-sm opacity-80">{getScoreLabel(selected.matchScore)}</p>
                            </div>
                            <div className="text-4xl font-black">{selected.matchScore}%</div>
                          </div>
                          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden mb-4">
                            <div className={`h-full bg-gradient-to-r ${getScoreBarColor(selected.matchScore)} rounded-full transition-all duration-500`} style={{ width: `${selected.matchScore}%` }} />
                          </div>

                          {/* REQUIRED SKILLS */}
                          <div className="mb-4">
                            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-300">📋 Required Skills</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selected.matchedSkills && selected.matchedSkills.length > 0 && (
                                <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-green-400">✅ Matched ({selected.matchedSkills.length})</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selected.matchedSkills.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-xs font-medium border border-green-500/20">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selected.missingSkills && selected.missingSkills.length > 0 && (
                                <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-red-400">❌ Missing ({selected.missingSkills.length})</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selected.missingSkills.map((s, i) => (
                                      <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 rounded-md text-xs font-medium border border-red-500/20">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* PREFERRED SKILLS */}
                          {((selected.matchedPreferred && selected.matchedPreferred.length > 0) || (selected.missingPreferred && selected.missingPreferred.length > 0)) && (
                            <div className="mb-3">
                              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-300">⭐ Preferred Skills</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selected.matchedPreferred && selected.matchedPreferred.length > 0 && (
                                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-blue-400">✅ Has ({selected.matchedPreferred.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selected.matchedPreferred.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs font-medium border border-blue-500/20">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selected.missingPreferred && selected.missingPreferred.length > 0 && (
                                  <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-yellow-400">⚠️ Missing ({selected.missingPreferred.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selected.missingPreferred.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-md text-xs font-medium border border-yellow-500/20">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quick Extract */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3 opacity-70">📤 Quick Contact</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {selected.email && (
                                <button onClick={() => { navigator.clipboard.writeText(selected.email); setToast(`📧 Email copied!`); }}
                                  className="flex items-center gap-2 px-3 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg text-xs font-medium transition truncate">
                                  <span>📧</span><span className="truncate">{selected.email}</span>
                                </button>
                              )}
                              {selected.phone && (
                                <button onClick={() => { navigator.clipboard.writeText(selected.phone); setToast(`📱 Phone copied!`); }}
                                  className="flex items-center gap-2 px-3 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-xs font-medium transition truncate">
                                  <span>📱</span><span className="truncate">{selected.phone}</span>
                                </button>
                              )}
                              {selected.email && (
                                <a href={`mailto:${selected.email}?subject=Job Opportunity&body=Hi ${selected.name},%0D%0A%0D%0AWe have an exciting opportunity for you.%0D%0A%0D%0ARegards`}
                                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600/30 hover:bg-green-600/50 border border-green-500/30 rounded-lg text-xs font-medium transition">
                                  <span>✉️</span> Send Email
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <InfoCard icon="👤" label="Name" value={selected.name} />
                        <InfoCard icon="💼" label="Job Title" value={selected.title || "Not detected"} />
                        <InfoCard icon="📧" label="Email" value={selected.email || "N/A"} copyable={!!selected.email} onCopy={() => { navigator.clipboard.writeText(selected.email); setToast("📧 Copied!"); }} />
                        <InfoCard icon="📱" label="Phone" value={selected.phone || "N/A"} copyable={!!selected.phone} onCopy={() => { navigator.clipboard.writeText(selected.phone); setToast("📱 Copied!"); }} />
                        <InfoCard icon="🏢" label="Experience" value={selected.experience || "N/A"} />
                        <InfoCard icon="📍" label="Location" value={selected.location || "N/A"} />
                        {selected.email && !jdApplied && (
                          <a href={`mailto:${selected.email}?subject=Job Opportunity&body=Hi ${selected.name},%0D%0A%0D%0AWe have an exciting opportunity for you.%0D%0A%0D%0ARegards`}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-600 transition flex items-center gap-3 group">
                            <span className="text-lg">✉️</span>
                            <div>
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide block">Quick Action</span>
                              <span className="text-green-400 font-semibold text-sm group-hover:text-green-300">Send Email →</span>
                            </div>
                          </a>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span>🛠️</span> Skills
                        </h3>
                        {selected.skills ? (
                          <div className="flex flex-wrap gap-2">
                            {selected.skills.split(",").map((s, i) => {
                              const trimSkill = s.trim().toLowerCase();
                              const isMatched = jdApplied && selected.matchedSkills?.includes(trimSkill);
                              return (
                                <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                                  isMatched
                                    ? "bg-green-500/15 text-green-400 border-green-500/20"
                                    : "bg-orange-500/15 text-orange-400 border-orange-500/20"
                                }`}>
                                  {isMatched && "✅ "}{s.trim()}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No skills detected</p>
                        )}
                      </div>

                      <div className="border-t border-gray-800 my-6"></div>

                      {/* Resume Preview - IMPROVED */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>📄</span> Resume Preview
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowRawResume(!showRawResume)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${showRawResume ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"}`}
                            >
                              {showRawResume ? "📝 Formatted" : "📃 Raw Text"}
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(selected.content); setToast("📄 Resume copied!"); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>

                        {showRawResume ? (
                          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed break-words">
                              {selected.content}
                            </pre>
                          </div>
                        ) : (
                          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            {/* Resume Header Card */}
                            <div className="bg-gradient-to-r from-orange-600/20 via-gray-800 to-gray-900 p-6 border-b border-gray-700">
                              <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-orange-500/20">
                                  {selected.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xl font-bold text-white">{selected.name}</h4>
                                  {selected.title && (
                                    <p className="text-sm text-orange-400 font-semibold mt-0.5">{selected.title}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                                    {selected.email && (
                                      <span className="text-xs text-blue-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                        {selected.email}
                                      </span>
                                    )}
                                    {selected.phone && (
                                      <span className="text-xs text-purple-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                        {selected.phone}
                                      </span>
                                    )}
                                    {selected.location && (
                                      <span className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        📍 {selected.location}
                                      </span>
                                    )}
                                    {selected.experience && (
                                      <span className="text-xs text-amber-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                        {selected.experience}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Resume Body */}
                            <div className="p-6">
                              {resumeSections.map((section, i) => {
                                if (section.type === "empty") {
                                  return <div key={i} className="h-4" />;
                                }
                                if (section.type === "heading") {
                                  return (
                                    <div key={i} className="mt-6 mb-3 first:mt-0">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                                        <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest">
                                          {section.content.replace(/[:\-_|#*]/g, "").trim()}
                                        </h4>
                                      </div>
                                      <div className="ml-5 mt-1 h-px bg-gradient-to-r from-orange-500/40 to-transparent"></div>
                                    </div>
                                  );
                                }
                                if (section.type === "subheading") {
                                  return (
                                    <div key={i} className="mt-3 mb-1 ml-5">
                                      <h5 className="text-sm font-semibold text-gray-200">
                                        {section.content}
                                      </h5>
                                    </div>
                                  );
                                }
                                if (section.type === "bullet") {
                                  return (
                                    <div key={i} className="flex items-start gap-3 ml-5 py-1">
                                      <span className="text-orange-500 mt-1 text-xs flex-shrink-0">▸</span>
                                      <p className="text-sm text-gray-300 leading-relaxed">
                                        {section.content}
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <p key={i} className="text-sm text-gray-400 leading-relaxed ml-5 py-0.5">
                                    {section.content}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-6xl mb-4 opacity-30">📋</div>
                    <p className="text-lg font-medium">Select a candidate</p>
                    <p className="text-sm mt-1">Click on a candidate to view details</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, copyable, onCopy }: { icon: string; label: string; value: string; copyable?: boolean; onCopy?: () => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition group relative">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-white font-semibold text-sm truncate flex-1" title={value}>{value}</p>
        {copyable && onCopy && (
          <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white" title="Copy">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
