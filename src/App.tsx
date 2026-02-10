import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Candidate } from "./types";
import { extractText } from "./utils/extractText";
import { parseResume, matchJD } from "./utils/parseResume";
import { getAllCandidates, saveCandidate, deleteCandidate, saveAllCandidates } from "./utils/db";

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jdText, setJdText] = useState("");
  const [jdApplied, setJdApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<"candidates" | "jd">("candidates");
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

        const { name, email, phone, skills, experience } = parseResume(text);
        const candidate: Candidate = {
          id: uuidv4(),
          name: name || file.name.replace(/\.[^.]+$/, ""),
          email,
          phone,
          skills,
          experience,
          content: text,
        };

        // If JD is applied, calculate match score
        if (jdApplied && jdText.trim()) {
          const match = matchJD(text, skills, jdText);
          candidate.matchScore = match.score;
          candidate.matchedSkills = match.matchedSkills;
          candidate.missingSkills = match.missingSkills;
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
      };
    });

    // Sort by match score descending
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
    return true;
  });

  // Sort by match score if JD applied
  const sortedFiltered = jdApplied
    ? [...filtered].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : filtered;

  const selected = candidates.find((c) => c.id === selectedId) || null;

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

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium" style={{ animation: "slideIn 0.3s ease-out" }}>
          {toast}
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

          <div className="space-y-4 flex-1">
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

            {/* JD Status */}
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
            {jdApplied && <p className="text-xs text-green-500 mt-1">Ranked by JD match %</p>}
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
            <span className="text-2xl">🔥</span>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">ATS MONSTER RECRUITER</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Tab Buttons */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button onClick={() => setActiveTab("candidates")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "candidates" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
                👥 Candidates
              </button>
              <button onClick={() => setActiveTab("jd")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === "jd" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
                📋 Job Description
              </button>
            </div>

            {/* Upload Button - BULK */}
            <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm cursor-pointer transition-all ${uploading ? "bg-gray-700 text-gray-400 cursor-wait" : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"}`}>
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

        {/* Upload Progress Bar */}
        {uploading && uploadProgress.total > 0 && (
          <div className="px-6 py-2 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{uploadProgress.current}/{uploadProgress.total} files</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === "jd" ? (
            /* ===== JD TAB ===== */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <span>📋</span> Job Description
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Paste your Job Description below. We'll match & rank all candidates based on their skills and experience.</p>
                  <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-3"></div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Paste Job Description Here:</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder={`Example:\n\nWe are looking for a Senior Full Stack Developer with 5+ years of experience in React, Node.js, Python, and AWS. The ideal candidate should have experience with databases like PostgreSQL and MongoDB, containerization with Docker, and CI/CD pipelines...\n\nPaste your full JD here...`}
                    rows={15}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={applyJDMatching}
                    disabled={!jdText.trim() || candidates.length === 0}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                      !jdText.trim() || candidates.length === 0
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                    }`}
                  >
                    🎯 Match & Rank Candidates ({candidates.length})
                  </button>

                  {jdApplied && (
                    <button onClick={clearJD} className="px-5 py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all flex items-center gap-2">
                      🧹 Clear Matching
                    </button>
                  )}
                </div>

                {candidates.length === 0 && (
                  <p className="text-yellow-500/70 text-sm mt-4">⚠️ Upload some resumes first, then apply JD matching</p>
                )}

                {jdApplied && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span>🏆</span> Top Ranked Candidates
                    </h3>
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
                              <p className="text-xs text-gray-500 truncate">{c.email || "No email"} {c.experience && `• ${c.experience}`}</p>
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
              {/* ===== LEFT - Candidate List ===== */}
              <div className="w-full sm:w-[420px] flex-shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Candidates ({sortedFiltered.length})
                  </h2>
                  {jdApplied && (
                    <span className="text-xs text-green-400 font-medium">🎯 Ranked</span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
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
                        onClick={() => setSelectedId(c.id)}
                      >
                        {/* Rank Number */}
                        {jdApplied && (
                          <div className="text-xs font-bold text-gray-600 w-5 text-center flex-shrink-0">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                          </div>
                        )}

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.email || "No email"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {c.experience && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">{c.experience}</span>
                            )}
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        {jdApplied && c.matchScore !== undefined && (
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${getScoreColor(c.matchScore)}`}>
                            {c.matchScore}%
                          </div>
                        )}

                        {/* Delete */}
                        {deleteMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                            className="p-2 hover:bg-red-600/20 rounded-lg text-red-400 hover:text-red-300 transition flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ===== RIGHT - Detail Panel ===== */}
              <div className="flex-1 overflow-y-auto hidden sm:block">
                {selected ? (
                  <div className="p-6 max-w-3xl">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-white mb-1">Candidate Details</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
                    </div>

                    {/* Match Score Card - if JD applied */}
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

                        {/* Matched Skills */}
                        {selected.matchedSkills && selected.matchedSkills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">✅ Matched Skills ({selected.matchedSkills.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selected.matchedSkills.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-xs font-medium border border-green-500/20">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {selected.missingSkills && selected.missingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">❌ Missing Skills ({selected.missingSkills.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selected.missingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 rounded-md text-xs font-medium border border-red-500/20">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <InfoCard icon="👤" label="Name" value={selected.name} />
                      <InfoCard icon="📧" label="Email" value={selected.email || "N/A"} />
                      <InfoCard icon="📱" label="Phone" value={selected.phone || "N/A"} />
                      <InfoCard icon="💼" label="Experience" value={selected.experience || "N/A"} />
                    </div>

                    {/* Skills */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span>🛠️</span> Skills
                      </h3>
                      {selected.skills ? (
                        <div className="flex flex-wrap gap-2">
                          {selected.skills.split(",").map((s, i) => {
                            const isMatched = selected.matchedSkills?.includes(s.trim().toLowerCase());
                            return (
                              <span
                                key={i}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                                  jdApplied && isMatched
                                    ? "bg-green-500/15 text-green-400 border-green-500/20"
                                    : jdApplied && !isMatched
                                    ? "bg-gray-800 text-gray-400 border-gray-700"
                                    : "bg-orange-500/15 text-orange-400 border-orange-500/20"
                                }`}
                              >
                                {jdApplied && isMatched && "✅ "}{s.trim()}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No skills detected</p>
                      )}
                    </div>

                    <div className="border-t border-gray-800 my-6"></div>

                    {/* Resume Preview */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span>📄</span> Resume Preview
                      </h3>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-h-[600px] overflow-y-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{selected.content}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-6xl mb-4 opacity-30">📋</div>
                    <p className="text-lg font-medium">Select a candidate</p>
                    <p className="text-sm mt-1">Click on a candidate from the list to view details</p>
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

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-white font-semibold text-sm truncate" title={value}>{value}</p>
    </div>
  );
}
