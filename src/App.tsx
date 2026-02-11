import { useState, useCallback, useRef, useEffect } from "react";
import type { Candidate } from "./types";
import { loadCandidates, addCandidates, deleteCandidate } from "./utils/storage";
import { extractText } from "./utils/fileExtractor";
import { parseResume } from "./utils/parser";
import { matchCandidatesWithJD, type MatchResult } from "./utils/jdMatcher";

type Tab = "candidates" | "jd";

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("candidates");
  const [jdText, setJdText] = useState("");
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [jdApplied, setJdApplied] = useState(false);
  const [extractedIds, setExtractedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadMsg) {
      const t = setTimeout(() => setUploadMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [uploadMsg]);

  useEffect(() => {
    if (copiedField) {
      const t = setTimeout(() => setCopiedField(null), 2000);
      return () => clearTimeout(t);
    }
  }, [copiedField]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
    });
  }, []);

  // Handle multiple files (BULK UPLOAD)
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["pdf", "docx", "txt"].includes(ext || "");
    });

    if (validFiles.length === 0) {
      setUploadMsg("❌ Koi valid file nahi mili! PDF, DOCX ya TXT upload karo.");
      return;
    }

    setUploading(true);
    setUploadMsg("");
    setUploadProgress({ current: 0, total: validFiles.length });

    const newCandidates: Candidate[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });
      try {
        const text = await extractText(file);
        if (!text.trim()) {
          errors.push(file.name);
          continue;
        }
        const candidate = parseResume(text, file.name);
        newCandidates.push(candidate);
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
        errors.push(file.name);
      }
    }

    if (newCandidates.length > 0) {
      const updated = addCandidates(newCandidates);
      setCandidates(updated);
      setSelectedId(newCandidates[0].id);
    }

    let msg = "";
    if (newCandidates.length > 0) {
      msg += `✅ ${newCandidates.length} resume${newCandidates.length > 1 ? "s" : ""} uploaded successfully!`;
    }
    if (errors.length > 0) {
      msg += ` ❌ ${errors.length} failed: ${errors.join(", ")}`;
    }
    setUploadMsg(msg);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (jdApplied && jdText.trim()) {
      const allCandidates = [...newCandidates, ...candidates];
      const results = matchCandidatesWithJD(allCandidates, jdText);
      setMatchResults(results);
    }
  }, [candidates, jdApplied, jdText]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = deleteCandidate(id);
      setCandidates(updated);
      setSelectedId((prev) => (prev === id ? null : prev));
      if (jdApplied) {
        setMatchResults((prev) => prev.filter((r) => r.candidate.id !== id));
      }
    },
    [jdApplied]
  );

  const handleJDMatch = useCallback(() => {
    if (!jdText.trim()) {
      setUploadMsg("❌ JD paste karo pehle!");
      return;
    }
    const results = matchCandidatesWithJD(candidates, jdText);
    setMatchResults(results);
    setJdApplied(true);
    setExtractedIds(new Set());
    setActiveTab("candidates");
  }, [candidates, jdText]);

  const handleClearJD = useCallback(() => {
    setJdText("");
    setMatchResults([]);
    setJdApplied(false);
    setExtractedIds(new Set());
  }, []);

  const toggleExtract = useCallback((id: string) => {
    setExtractedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const extractAll = useCallback(() => {
    const ids = new Set(displayCandidates.map(c => c.id));
    setExtractedIds(ids);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, nameFilter, emailFilter, skillFilter, locationFilter, jdApplied, matchResults]);

  const collapseAll = useCallback(() => {
    setExtractedIds(new Set());
  }, []);

  // Filtered candidates
  const filtered = candidates.filter((c) => {
    if (nameFilter && !c.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (emailFilter && !c.email.toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (skillFilter && !c.skills.toLowerCase().includes(skillFilter.toLowerCase())) return false;
    if (locationFilter && !(c.location || "").toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  // Get match result for a candidate
  const getMatchResult = (id: string): MatchResult | undefined => {
    return matchResults.find((r) => r.candidate.id === id);
  };

  // Sort by JD match if applied
  const displayCandidates = jdApplied
    ? [...filtered].sort((a, b) => {
        const matchA = getMatchResult(a.id)?.matchPercentage || 0;
        const matchB = getMatchResult(b.id)?.matchPercentage || 0;
        return matchB - matchA;
      })
    : filtered;

  const selected = candidates.find((c) => c.id === selectedId) || null;
  const selectedMatch = selectedId ? getMatchResult(selectedId) : undefined;

  // Get all unique locations for dropdown hint
  const allLocations = [...new Set(candidates.map(c => c.location).filter(Boolean))];

  // Build bulk extract data
  const extractedCandidates = displayCandidates.filter(c => extractedIds.has(c.id));

  const buildBulkEmailText = () => {
    return extractedCandidates
      .filter(c => c.email)
      .map(c => {
        const match = getMatchResult(c.id);
        return `${c.name} | ${c.email} | ${c.phone || "N/A"} | ${c.location || "N/A"}${match ? ` | ${match.matchPercentage}% match` : ""}`;
      })
      .join("\n");
  };

  const buildEmailList = () => {
    return extractedCandidates
      .filter(c => c.email)
      .map(c => c.email)
      .join(", ");
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden`}
      >
        <div className="w-72 p-4 h-full flex flex-col">
          <h2 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Candidate Name</label>
              <input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search name..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Search email..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Skills</label>
              <input
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="python, react..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"
              />
            </div>

            {/* LOCATION FILTER */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">📍 Location</label>
              <input
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Mumbai, Delhi, Remote..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"
                list="location-suggestions"
              />
              {allLocations.length > 0 && (
                <datalist id="location-suggestions">
                  {allLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              )}
              {allLocations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {allLocations.slice(0, 5).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocationFilter(loc)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        locationFilter === loc
                          ? "bg-orange-500/30 text-orange-400 border-orange-500/50"
                          : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"
                      }`}
                    >
                      📍 {loc}
                    </button>
                  ))}
                  {locationFilter && (
                    <button
                      onClick={() => setLocationFilter("")}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  deleteMode ? "bg-red-600" : "bg-gray-700"
                }`}
                onClick={() => setDeleteMode(!deleteMode)}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                    deleteMode ? "left-5.5" : "left-0.5"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-200">Delete Mode</span>
            </label>
          </div>

          {/* JD Match Status */}
          {jdApplied && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 text-sm font-bold">✅ JD Applied</span>
                </div>
                <p className="text-xs text-green-400/70">
                  Candidates ranked by JD match %
                </p>
                <button
                  onClick={handleClearJD}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear JD Filter
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-600 text-center">
              {candidates.length} total candidates
              {locationFilter && ` • ${displayCandidates.length} in "${locationFilter}"`}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-black">
            <span className="text-blue-500">🚀</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              SmartHire AI
            </span>
          </h1>

          {/* TAB BUTTONS */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "candidates"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              👥 Candidates
            </button>
            <button
              onClick={() => setActiveTab("jd")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "jd"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              📋 Job Description
              {jdApplied && <span className="ml-1 text-green-400">●</span>}
            </button>
          </div>
        </header>

        {/* JD TAB */}
        {activeTab === "jd" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-purple-400">📋 Job Description Paste Karo</h2>
                {jdApplied && (
                  <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full border border-green-800">
                    Active
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-4">
                JD paste karo neeche — phir "Match Candidates" click karo. Sab candidates ko JD ke hisaab se rank kar dega with % match! 🚀
              </p>

              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder={`Yahan Job Description paste karo...\n\nExample:\nWe are looking for a Senior Python Developer with 5+ years of experience in Python, Django, REST APIs, AWS, Docker, and PostgreSQL. The candidate should have experience with agile methodology, CI/CD pipelines, and microservices architecture...`}
                className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600 resize-none font-mono"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleJDMatch}
                  disabled={!jdText.trim() || candidates.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  🎯 Match Candidates ({candidates.length})
                </button>

                {jdApplied && (
                  <button
                    onClick={handleClearJD}
                    className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors text-red-400"
                  >
                    🗑️ Clear JD
                  </button>
                )}

                {candidates.length === 0 && (
                  <p className="text-xs text-yellow-500 self-center">
                    ⚠️ Pehle kuch resumes upload karo!
                  </p>
                )}
              </div>

              {/* Quick Stats after JD match */}
              {jdApplied && matchResults.length > 0 && (
                <div className="mt-6 grid grid-cols-4 gap-3">
                  <StatCard label="Total Matched" value={matchResults.length.toString()} icon="👥" color="blue" />
                  <StatCard label="90%+ Match" value={matchResults.filter((r) => r.matchPercentage >= 90).length.toString()} icon="🏆" color="green" />
                  <StatCard label="70-89% Match" value={matchResults.filter((r) => r.matchPercentage >= 70 && r.matchPercentage < 90).length.toString()} icon="⭐" color="yellow" />
                  <StatCard label="Below 70%" value={matchResults.filter((r) => r.matchPercentage < 70).length.toString()} icon="📊" color="red" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANDIDATES TAB */}
        {activeTab === "candidates" && (
          <>
            {/* UPLOAD AREA - BULK */}
            <div className="px-6 py-4 flex-shrink-0">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFiles(files);
                    e.target.value = "";
                  }}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-orange-400">
                      Parsing resumes... ({uploadProgress.current}/{uploadProgress.total})
                    </span>
                    <div className="w-40 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      <span className="text-orange-400 font-semibold">Click to upload</span> ya drag & drop karo
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      📂 <strong>BULK UPLOAD</strong> — Multiple files select karo ek saath! (PDF, DOCX, TXT)
                    </p>
                  </div>
                )}
              </div>
              {uploadMsg && (
                <div
                  className={`mt-2 text-sm text-center py-2 rounded-lg ${
                    uploadMsg.includes("✅")
                      ? "bg-green-900/30 text-green-400"
                      : "bg-red-900/30 text-red-400"
                  }`}
                >
                  {uploadMsg}
                </div>
              )}
            </div>

            {/* EXTRACT BAR - shows when JD is applied */}
            {jdApplied && displayCandidates.length > 0 && (
              <div className="px-6 pb-2 flex-shrink-0">
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800/50 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-sm text-purple-300 font-semibold">📧 Extract Contacts:</span>
                  <button
                    onClick={extractAll}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold transition-colors"
                  >
                    Extract All ({displayCandidates.length})
                  </button>
                  {extractedIds.size > 0 && (
                    <>
                      <button
                        onClick={collapseAll}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors"
                      >
                        Collapse All
                      </button>
                      <button
                        onClick={() => {
                          const emails = buildEmailList();
                          copyToClipboard(emails, "all-emails");
                        }}
                        className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        {copiedField === "all-emails" ? "✅ Copied!" : "📋 Copy All Emails"}
                      </button>
                      <button
                        onClick={() => {
                          const emails = buildEmailList();
                          window.open(`mailto:${emails}`, "_blank");
                        }}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        ✉️ Mail All
                      </button>
                      <span className="text-xs text-gray-500 ml-auto">
                        {extractedIds.size} selected
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-4">
              {/* LEFT - CANDIDATE LIST */}
              <div className="w-[480px] flex-shrink-0 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-3 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between">
                  <h2 className="font-bold text-sm text-gray-300">
                    Candidates ({displayCandidates.length})
                  </h2>
                  {jdApplied && (
                    <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full">
                      Ranked by JD
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {displayCandidates.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm">Koi candidate nahi mila</p>
                      <p className="text-xs mt-1">Resume upload karo ya filter change karo</p>
                    </div>
                  ) : (
                    displayCandidates.map((c, idx) => {
                      const match = getMatchResult(c.id);
                      const isExtracted = extractedIds.has(c.id);
                      return (
                        <div key={c.id}>
                          <div
                            className={`flex items-center gap-2 p-3 border-b border-gray-800/50 cursor-pointer transition-all group ${
                              selectedId === c.id
                                ? "bg-orange-500/10 border-l-2 border-l-orange-500"
                                : "hover:bg-gray-800/50 border-l-2 border-l-transparent"
                            }`}
                            onClick={() => setSelectedId(c.id)}
                          >
                            {/* Rank number if JD applied */}
                            {jdApplied && (
                              <div className="w-6 text-center flex-shrink-0">
                                <span className={`text-xs font-bold ${idx < 3 ? "text-yellow-400" : "text-gray-600"}`}>
                                  #{idx + 1}
                                </span>
                              </div>
                            )}

                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                match && match.matchPercentage >= 80
                                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                  : match && match.matchPercentage >= 50
                                  ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                                  : "bg-gradient-to-br from-orange-500 to-red-600"
                              }`}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{c.name}</p>
                              {c.title && (
                                <p className="text-xs text-purple-400 truncate font-medium">{c.title}</p>
                              )}
                              <p className="text-xs text-gray-500 truncate">{c.email || "No email"}</p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {c.experience && (
                                  <span className="inline-block text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                                    {c.experience}
                                  </span>
                                )}
                                {c.location && (
                                  <span className="inline-block text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                    📍 {c.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Match Percentage Badge */}
                            {jdApplied && match && (
                              <div className="flex-shrink-0">
                                <MatchBadge percentage={match.matchPercentage} />
                              </div>
                            )}

                            {/* Extract toggle button */}
                            {jdApplied && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExtract(c.id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                  isExtracted
                                    ? "bg-purple-600 text-white"
                                    : "hover:bg-gray-700 text-gray-500 hover:text-purple-400"
                                }`}
                                title="Extract contact details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            )}

                            {deleteMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(c.id);
                                }}
                                className="p-1.5 hover:bg-red-600 rounded-lg transition-colors text-red-400 hover:text-white flex-shrink-0"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* EXTRACT CONTACT CARD - shows below candidate when extracted */}
                          {isExtracted && (
                            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-purple-800/30 px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 space-y-2">
                                  {/* Email Row */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 w-12">EMAIL</span>
                                    <span className="text-xs text-green-400 font-mono flex-1 truncate">
                                      {c.email || "N/A"}
                                    </span>
                                    {c.email && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(c.email, `email-${c.id}`);
                                          }}
                                          className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                                        >
                                          {copiedField === `email-${c.id}` ? "✅" : "📋 Copy"}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`mailto:${c.email}`, "_blank");
                                          }}
                                          className="text-[10px] px-2 py-0.5 bg-blue-800 hover:bg-blue-700 rounded text-blue-300 hover:text-white transition-colors"
                                        >
                                          ✉️ Mail
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Phone Row */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 w-12">PHONE</span>
                                    <span className="text-xs text-yellow-400 font-mono flex-1 truncate">
                                      {c.phone || "N/A"}
                                    </span>
                                    {c.phone && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(c.phone, `phone-${c.id}`);
                                          }}
                                          className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                                        >
                                          {copiedField === `phone-${c.id}` ? "✅" : "📋 Copy"}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`tel:${c.phone.replace(/\s/g, "")}`, "_blank");
                                          }}
                                          className="text-[10px] px-2 py-0.5 bg-green-800 hover:bg-green-700 rounded text-green-300 hover:text-white transition-colors"
                                        >
                                          📞 Call
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Location Row */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 w-12">LOC</span>
                                    <span className="text-xs text-blue-400 font-mono flex-1 truncate">
                                      📍 {c.location || "N/A"}
                                    </span>
                                  </div>

                                  {/* Match % Row */}
                                  {match && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-500 w-12">MATCH</span>
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-20 bg-gray-800 rounded-full h-1.5">
                                          <div
                                            className={`h-1.5 rounded-full ${
                                              match.matchPercentage >= 80
                                                ? "bg-green-500"
                                                : match.matchPercentage >= 50
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                            }`}
                                            style={{ width: `${match.matchPercentage}%` }}
                                          />
                                        </div>
                                        <span className={`text-xs font-bold ${
                                          match.matchPercentage >= 80
                                            ? "text-green-400"
                                            : match.matchPercentage >= 50
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                        }`}>
                                          {match.matchPercentage}%
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Copy All Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const allInfo = `Name: ${c.name}\nEmail: ${c.email || "N/A"}\nPhone: ${c.phone || "N/A"}\nLocation: ${c.location || "N/A"}\nExperience: ${c.experience || "N/A"}\nSkills: ${c.skills || "N/A"}${match ? `\nJD Match: ${match.matchPercentage}%` : ""}`;
                                    copyToClipboard(allInfo, `all-${c.id}`);
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex-shrink-0 ${
                                    copiedField === `all-${c.id}`
                                      ? "bg-green-700 text-white"
                                      : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {copiedField === `all-${c.id}` ? "✅ Copied!" : "📋 Copy\nAll"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* BULK EXTRACT SUMMARY - at bottom of list */}
                {extractedCandidates.length > 0 && (
                  <div className="border-t border-purple-800/50 bg-purple-900/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-300">
                        📧 Extracted: {extractedCandidates.length} candidates
                      </span>
                      <button
                        onClick={() => {
                          const data = buildBulkEmailText();
                          copyToClipboard(data, "bulk-data");
                        }}
                        className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
                          copiedField === "bulk-data"
                            ? "bg-green-700 text-white"
                            : "bg-purple-700 hover:bg-purple-600 text-white"
                        }`}
                      >
                        {copiedField === "bulk-data" ? "✅ Copied All Data!" : "📋 Copy All Data"}
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-500 max-h-16 overflow-y-auto space-y-0.5">
                      {extractedCandidates.slice(0, 10).map((c) => (
                        <div key={c.id} className="truncate">
                          {c.name} — {c.email || "no email"} — {c.phone || "no phone"}
                        </div>
                      ))}
                      {extractedCandidates.length > 10 && (
                        <div className="text-purple-400">+{extractedCandidates.length - 10} more...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT - DETAIL PANEL */}
              <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                {selected ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                          {selected.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold truncate">{selected.name}</h2>
                          {selected.title && (
                            <p className="text-sm text-purple-400 font-semibold">{selected.title}</p>
                          )}
                          <p className="text-xs text-gray-400">{selected.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-600">
                              Uploaded: {new Date(selected.uploadedAt).toLocaleString()}
                            </p>
                            {selected.location && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                📍 {selected.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Big Match Badge */}
                        {jdApplied && selectedMatch && (
                          <div className="flex-shrink-0 text-center">
                            <div
                              className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-lg ${
                                selectedMatch.matchPercentage >= 80
                                  ? "bg-green-900/40 text-green-400 border border-green-700"
                                  : selectedMatch.matchPercentage >= 50
                                  ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700"
                                  : "bg-red-900/40 text-red-400 border border-red-700"
                              }`}
                            >
                              {selectedMatch.matchPercentage}%
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">JD Match</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Extract Section in Detail Panel */}
                    <div className="p-5 border-b border-gray-800">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoCard icon="📧" label="Email" value={selected.email || "N/A"} copyValue={selected.email} onCopy={copyToClipboard} copiedField={copiedField} fieldKey={`detail-email-${selected.id}`} />
                        <InfoCard icon="📱" label="Phone" value={selected.phone || "N/A"} copyValue={selected.phone} onCopy={copyToClipboard} copiedField={copiedField} fieldKey={`detail-phone-${selected.id}`} />
                        <InfoCard icon="🎯" label="Role / Title" value={selected.title || "N/A"} />
                        <InfoCard icon="💼" label="Experience" value={selected.experience || "N/A"} />
                        <InfoCard icon="📍" label="Location" value={selected.location || "N/A"} />
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3">
                        {selected.email && (
                          <button
                            onClick={() => window.open(`mailto:${selected.email}`, "_blank")}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            ✉️ Send Email
                          </button>
                        )}
                        {selected.phone && (
                          <button
                            onClick={() => window.open(`tel:${selected.phone.replace(/\s/g, "")}`, "_blank")}
                            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            📞 Call
                          </button>
                        )}
                        {selected.phone && (
                          <button
                            onClick={() => window.open(`https://wa.me/${selected.phone.replace(/[\s\-+]/g, "")}`, "_blank")}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            💬 WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const allInfo = `Name: ${selected.name}\nEmail: ${selected.email || "N/A"}\nPhone: ${selected.phone || "N/A"}\nLocation: ${selected.location || "N/A"}\nExperience: ${selected.experience || "N/A"}\nSkills: ${selected.skills || "N/A"}`;
                            copyToClipboard(allInfo, `detail-all-${selected.id}`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            copiedField === `detail-all-${selected.id}`
                              ? "bg-green-600 text-white"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                          }`}
                        >
                          {copiedField === `detail-all-${selected.id}` ? "✅ Copied!" : "📋 Copy All Info"}
                        </button>
                      </div>

                      {selected.skills && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-400 mb-2">🛠️ Skills Detected</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.skills.split(", ").map((skill) => {
                              const isMatched =
                                selectedMatch?.matchedKeywords.some(
                                  (k) => k.toLowerCase() === skill.toLowerCase()
                                );
                              return (
                                <span
                                  key={skill}
                                  className={`px-2.5 py-1 text-xs rounded-full border ${
                                    jdApplied && isMatched
                                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                                      : jdApplied
                                      ? "bg-gray-800 text-gray-500 border-gray-700"
                                      : "bg-orange-500/15 text-orange-400 border-orange-500/20"
                                  }`}
                                >
                                  {jdApplied && isMatched && "✓ "}
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* JD Match Details */}
                      {jdApplied && selectedMatch && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <p className="text-xs text-gray-400 mb-2">🎯 JD Match Analysis</p>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Match Score</span>
                              <span
                                className={`font-bold ${
                                  selectedMatch.matchPercentage >= 80
                                    ? "text-green-400"
                                    : selectedMatch.matchPercentage >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {selectedMatch.matchPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  selectedMatch.matchPercentage >= 80
                                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                    : selectedMatch.matchPercentage >= 50
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                                    : "bg-gradient-to-r from-red-500 to-pink-400"
                                }`}
                                style={{ width: `${selectedMatch.matchPercentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-2">
                              <p className="text-[10px] text-green-400 mb-1">
                                ✅ Matched ({selectedMatch.matchedKeywords.length})
                              </p>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {selectedMatch.matchedKeywords.slice(0, 20).map((k) => (
                                  <span key={k} className="text-[10px] bg-green-800/40 text-green-300 px-1.5 py-0.5 rounded">
                                    {k}
                                  </span>
                                ))}
                                {selectedMatch.matchedKeywords.length > 20 && (
                                  <span className="text-[10px] text-green-500">
                                    +{selectedMatch.matchedKeywords.length - 20} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2">
                              <p className="text-[10px] text-red-400 mb-1">
                                ❌ Missing ({selectedMatch.missingKeywords.length})
                              </p>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {selectedMatch.missingKeywords.slice(0, 20).map((k) => (
                                  <span key={k} className="text-[10px] bg-red-800/40 text-red-300 px-1.5 py-0.5 rounded">
                                    {k}
                                  </span>
                                ))}
                                {selectedMatch.missingKeywords.length > 20 && (
                                  <span className="text-[10px] text-red-500">
                                    +{selectedMatch.missingKeywords.length - 20} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-sm text-gray-300 mb-3 flex items-center gap-2">
                        📝 Resume Preview
                        <button
                          onClick={() => {
                            copyToClipboard(selected.content, `resume-${selected.id}`);
                          }}
                          className={`ml-auto text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                            copiedField === `resume-${selected.id}`
                              ? "bg-green-700 text-white"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                          }`}
                        >
                          {copiedField === `resume-${selected.id}` ? "✅ Copied!" : "📋 Copy Resume"}
                        </button>
                      </h3>
                      <ResumePreview content={selected.content} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4 opacity-30">👈</div>
                      <p className="text-gray-500 text-lg">Candidate select karo</p>
                      <p className="text-gray-700 text-sm mt-1">ya naya resume upload karo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============== RESUME PREVIEW COMPONENT ===============

const SECTION_HEADERS = [
  "summary", "objective", "professional summary", "career summary",
  "profile", "about", "about me", "overview", "career objective",
  "experience", "work experience", "professional experience", "employment",
  "employment history", "work history", "career history", "relevant experience",
  "education", "academic", "academics", "academic background", "qualifications",
  "skills", "technical skills", "core competencies", "competencies",
  "key skills", "areas of expertise", "technologies", "tools",
  "certifications", "certification", "licenses", "credentials",
  "projects", "key projects", "personal projects", "academic projects",
  "achievements", "accomplishments", "awards", "honors",
  "publications", "research", "papers",
  "languages", "interests", "hobbies",
  "references", "volunteer", "volunteering", "extracurricular",
  "contact", "contact information", "personal information", "personal details",
  "declaration", "additional information", "activities",
];

function ResumePreview({ content }: { content: string }) {
  const lines = content.split("\n");

  const isSection = (line: string): boolean => {
    const cleaned = line.trim().replace(/[:\-–—|•·#*_=]/g, "").trim().toLowerCase();
    if (cleaned.length === 0 || cleaned.length > 50) return false;
    for (const header of SECTION_HEADERS) {
      if (cleaned === header || cleaned.startsWith(header + " ") || cleaned.endsWith(" " + header)) {
        return true;
      }
    }
    if (line.trim().length > 2 && line.trim().length < 40 && line.trim() === line.trim().toUpperCase() && /[A-Z]/.test(line)) {
      return true;
    }
    return false;
  };

  const isBullet = (line: string): boolean => {
    const trimmed = line.trim();
    return /^[•●○◦▪▸►▹\-–—*→⮞❖✓✔☑]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed);
  };

  const isDateLine = (line: string): boolean => {
    return /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b.*\b\d{4}\b/i.test(line)
      || /\b\d{4}\b.*[-–—to]\s*(present|current|\d{4})/i.test(line)
      || (/\b(present|current)\b/i.test(line) && /\d{4}/.test(line));
  };

  const hasEmail = (line: string): boolean => {
    return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(line);
  };

  const hasPhone = (line: string): boolean => {
    return /\+?\d[\d\s()-]{8,}/.test(line);
  };

  const hasUrl = (line: string): boolean => {
    return /https?:\/\/\S+|www\.\S+|linkedin\.com|github\.com/i.test(line);
  };

  const highlightSpecial = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const urlRegex = /https?:\/\/\S+|www\.\S+/g;

    const emailMatches = remaining.match(emailRegex);
    const urlMatches = remaining.match(urlRegex);

    if (emailMatches) {
      emailMatches.forEach(email => {
        const idx = remaining.indexOf(email);
        if (idx >= 0) {
          if (idx > 0) parts.push(<span key={key++}>{remaining.substring(0, idx)}</span>);
          parts.push(
            <span key={key++} className="text-cyan-400 bg-cyan-400/10 px-1 rounded font-medium">
              {email}
            </span>
          );
          remaining = remaining.substring(idx + email.length);
        }
      });
    }

    if (urlMatches && remaining === text) {
      urlMatches.forEach(url => {
        const idx = remaining.indexOf(url);
        if (idx >= 0) {
          if (idx > 0) parts.push(<span key={key++}>{remaining.substring(0, idx)}</span>);
          parts.push(
            <a key={key++} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 bg-blue-400/10 px-1 rounded hover:underline">
              {url}
            </a>
          );
          remaining = remaining.substring(idx + url.length);
        }
      });
    }

    if (parts.length > 0) {
      if (remaining) parts.push(<span key={key++}>{remaining}</span>);
      return <>{parts}</>;
    }

    return text;
  };

  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Document header bar */}
      <div className="bg-gray-900 px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="text-[11px] text-gray-500 ml-2 font-mono">📄 resume_preview</span>
        <span className="text-[10px] text-gray-700 ml-auto">{lines.length} lines</span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-0.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} className="h-3" />;
          }

          if (isSection(line)) {
            return (
              <div key={idx} className="pt-5 pb-2 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-500 rounded-full flex-shrink-0" />
                  <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                    {trimmed.replace(/^[:\-–—|•·#*_=]+|[:\-–—|•·#*_=]+$/g, "").trim()}
                  </h4>
                  <div className="flex-1 border-b border-gray-800/60" />
                </div>
              </div>
            );
          }

          if (idx === 0) {
            return (
              <div key={idx} className="pb-2">
                <span className="text-xl font-bold text-white tracking-wide">{highlightSpecial(trimmed)}</span>
              </div>
            );
          }

          if (idx < 8 && (hasEmail(line) || hasPhone(line) || hasUrl(line))) {
            return (
              <div key={idx} className="flex items-center gap-2 py-0.5">
                <span className="text-gray-500 text-xs">
                  {hasEmail(line) ? "📧" : hasPhone(line) ? "📱" : "🔗"}
                </span>
                <span className="text-xs text-gray-300">{highlightSpecial(trimmed)}</span>
              </div>
            );
          }

          if (isDateLine(line)) {
            return (
              <div key={idx} className="py-0.5">
                <span className="text-xs text-purple-400 font-medium italic">{highlightSpecial(trimmed)}</span>
              </div>
            );
          }

          if (isBullet(line)) {
            const bulletContent = trimmed.replace(/^[•●○◦▪▸►▹\-–—*→⮞❖✓✔☑]\s*/, "").replace(/^\d+[.)]\s*/, "");
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-4 py-0.5">
                <span className="text-orange-500 mt-0.5 flex-shrink-0 text-xs">▸</span>
                <span className="text-sm text-gray-300 leading-relaxed">{highlightSpecial(bulletContent)}</span>
              </div>
            );
          }

          return (
            <div key={idx} className="py-0.5 pl-1">
              <span className="text-sm text-gray-400 leading-relaxed">{highlightSpecial(trimmed)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  copyValue,
  onCopy,
  copiedField,
  fieldKey,
}: {
  icon: string;
  label: string;
  value: string;
  copyValue?: string;
  onCopy?: (text: string, label: string) => void;
  copiedField?: string | null;
  fieldKey?: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800 group relative">
      <p className="text-xs text-gray-500 mb-0.5">
        {icon} {label}
      </p>
      <p className="text-sm font-medium truncate">{value}</p>
      {copyValue && onCopy && fieldKey && (
        <button
          onClick={() => onCopy(copyValue, fieldKey)}
          className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            copiedField === fieldKey
              ? "bg-green-700 text-white opacity-100"
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          {copiedField === fieldKey ? "✅" : "📋"}
        </button>
      )}
    </div>
  );
}

function MatchBadge({ percentage }: { percentage: number }) {
  let bg = "bg-red-900/50 text-red-400 border-red-800";
  if (percentage >= 80) bg = "bg-green-900/50 text-green-400 border-green-800";
  else if (percentage >= 50) bg = "bg-yellow-900/50 text-yellow-400 border-yellow-800";

  return (
    <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${bg}`}>
      {percentage}%
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colors = {
    blue: "bg-blue-900/30 border-blue-800 text-blue-400",
    green: "bg-green-900/30 border-green-800 text-green-400",
    yellow: "bg-yellow-900/30 border-yellow-800 text-yellow-400",
    red: "bg-red-900/30 border-red-800 text-red-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}
