import { useState, useCallback, useRef, useEffect } from "react";
import type { Candidate } from "./types";
import { loadCandidates, addCandidate, deleteCandidate } from "./utils/storage";
import { extractText } from "./utils/fileExtractor";
import { parseResume } from "./utils/parser";

export function App() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Clear upload message after 3s
  useEffect(() => {
    if (uploadMsg) {
      const t = setTimeout(() => setUploadMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [uploadMsg]);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setUploadMsg("❌ Sirf PDF, DOCX ya TXT file upload karo!");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    try {
      const text = await extractText(file);
      if (!text.trim()) {
        setUploadMsg("❌ File se text extract nahi ho paya!");
        setUploading(false);
        return;
      }
      const candidate = parseResume(text, file.name);
      const updated = addCandidate(candidate);
      setCandidates(updated);
      setSelectedId(candidate.id);
      setUploadMsg("✅ Resume uploaded & parsed successfully!");
    } catch (err) {
      console.error(err);
      setUploadMsg("❌ Error: " + (err instanceof Error ? err.message : "File parse failed"));
    }
    setUploading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDelete = useCallback((id: string) => {
    const updated = deleteCandidate(id);
    setCandidates(updated);
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  // Filtered candidates
  const filtered = candidates.filter((c) => {
    if (nameFilter && !c.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (emailFilter && !c.email.toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (skillFilter && !c.skills.toLowerCase().includes(skillFilter.toLowerCase())) return false;
    return true;
  });

  const selected = candidates.find((c) => c.id === selectedId) || null;

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

          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-600 text-center">
              {candidates.length} total candidates
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
            <span className="text-orange-500">🔥</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              ATS MONSTER RECRUITER
            </span>
          </h1>
        </header>

        {/* UPLOAD AREA */}
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
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-orange-400">Parsing resume...</span>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-400 text-sm">
                  <span className="text-orange-400 font-semibold">Click to upload</span> ya drag & drop karo
                </p>
                <p className="text-gray-600 text-xs mt-1">PDF, DOCX, TXT supported</p>
              </div>
            )}
          </div>
          {uploadMsg && (
            <div
              className={`mt-2 text-sm text-center py-2 rounded-lg ${
                uploadMsg.startsWith("✅")
                  ? "bg-green-900/30 text-green-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              {uploadMsg}
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-4">
          {/* LEFT - CANDIDATE LIST */}
          <div className="w-[420px] flex-shrink-0 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-gray-900/80">
              <h2 className="font-bold text-sm text-gray-300">
                Candidates ({filtered.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">Koi candidate nahi mila</p>
                  <p className="text-xs mt-1">Resume upload karo ya filter change karo</p>
                </div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-3 border-b border-gray-800/50 cursor-pointer transition-all group ${
                      selectedId === c.id
                        ? "bg-orange-500/10 border-l-2 border-l-orange-500"
                        : "hover:bg-gray-800/50 border-l-2 border-l-transparent"
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.email || "No email"}</p>
                      {c.experience && (
                        <span className="inline-block text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded mt-0.5">
                          {c.experience}
                        </span>
                      )}
                    </div>
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
                ))
              )}
            </div>
          </div>

          {/* RIGHT - DETAIL PANEL */}
          <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="p-5 border-b border-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">{selected.name}</h2>
                      <p className="text-sm text-gray-400">{selected.fileName}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Uploaded: {new Date(selected.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-b border-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard icon="📧" label="Email" value={selected.email || "N/A"} />
                    <InfoCard icon="📱" label="Phone" value={selected.phone || "N/A"} />
                    <InfoCard icon="💼" label="Experience" value={selected.experience || "N/A"} />
                    <InfoCard icon="📄" label="File" value={selected.fileName} />
                  </div>

                  {selected.skills && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">🛠️ Skills Detected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.skills.split(", ").map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-orange-500/15 text-orange-400 text-xs rounded-full border border-orange-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col overflow-hidden p-5">
                  <h3 className="font-bold text-sm text-gray-300 mb-2">📝 Resume Preview</h3>
                  <div className="flex-1 overflow-y-auto bg-gray-950 rounded-lg border border-gray-800 p-4">
                    <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {selected.content}
                    </pre>
                  </div>
                </div>
              </>
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
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
      <p className="text-xs text-gray-500 mb-0.5">
        {icon} {label}
      </p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
