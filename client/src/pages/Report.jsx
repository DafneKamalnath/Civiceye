import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  MapPin,
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "✨ Auto-detect with AI (Recommended)" },
  { value: "pothole", label: "Pothole / Road Surface" },
  { value: "streetlight", label: "Broken Streetlight / Electrical" },
  { value: "water", label: "Water Leak / Pipe Burst / Drainage" },
  { value: "garbage", label: "Overflowing Garbage / Waste Dump" },
  { value: "tree", label: "Fallen Tree / Dangerous Branch" },
  { value: "road", label: "Road Damage / Sidewalk / Divider" },
  { value: "other", label: "Other Civic Hazard" },
];

export default function Report() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("form"); // "form" | "my-reports"

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Status & Geolocation State
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState(null);

  // My Reports State
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch citizen's reports
  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get("/reports/mine");
      setMyReports(res.data);
    } catch (err) {
      console.error("Could not fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-reports") {
      fetchMyReports();
    }
  }, [activeTab]);

  // Handle HTML5 Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationStatus("Acquiring GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat.toFixed(6));
        setLng(userLng.toFixed(6));
        setLocationStatus(`GPS locked (accuracy: ±${Math.round(position.coords.accuracy)}m)`);
        setLocationLoading(false);

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name && !address) {
              setAddress(data.display_name);
            }
          }
        } catch {
          // Reverse geocode failed silently; coords are saved
        }
      },
      (err) => {
        setLocationLoading(false);
        setLocationStatus(`Could not get location: ${err.message}. Please enter address below.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Image Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessResult(null);

    if (!title.trim()) {
      setErrorMsg("Please enter a short title for the issue.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please describe the issue or location context.");
      return;
    }
    if (!lat || !lng) {
      setErrorMsg("Location coordinates are required. Click 'Use My Location' or enter coordinates.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("address", address.trim());
      formData.append("lat", lat);
      formData.append("lng", lng);
      if (category) formData.append("category", category);
      if (imageFile) formData.append("image", imageFile);

      const res = await api.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessResult(res.data);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setAddress("");
      setLat("");
      setLng("");
      setLocationStatus("");
      handleRemoveImage();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case "in_progress":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Open</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Civic Report Portal</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                AI Prioritized
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              From Citizen Complaints to Civic Intelligence. Submit civic hazards and track resolution.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === "form"
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Submit Report
            </button>
            <button
              onClick={() => setActiveTab("my-reports")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === "my-reports"
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Reports
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: REPORT SUBMISSION FORM                                             */}
        {/* ========================================================================= */}
        {activeTab === "form" && (
          <div className="mt-8 max-w-3xl mx-auto">
            {/* Success Banner */}
            {successResult && (
              <div className="mb-6 p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-base">
                      {successResult.merged ? "Report Linked to Existing Issue" : "Civic Report Submitted Successfully!"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      {successResult.merged
                        ? `A nearby report in category "${successResult.parentReport?.category}" was already registered. Your complaint incremented the civic priority score.`
                        : `Your report has been analyzed by AI and routed to the ${successResult.report?.department} Department.`}
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block">Category:</span>
                        <span className="font-semibold text-white capitalize">{successResult.report?.category}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block">Department:</span>
                        <span className="font-semibold text-cyan-300">{successResult.report?.department}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block">Severity:</span>
                        <span className="font-semibold text-amber-400 capitalize">{successResult.report?.severity}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block">Priority Score:</span>
                        <span className="font-semibold text-emerald-400">{successResult.report?.priorityScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-sm">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Issue Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deep pothole causing near collisions on main road"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 outline-none text-sm transition"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Description & Observations <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem, hazard level, or proximity to sensitive places like schools or hospitals..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 outline-none text-sm transition"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI analyzes keywords (e.g. "hospital", "urgent", "flooding") to calibrate civic urgency.
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Category <span className="text-slate-400 font-normal text-xs">(optional - AI detects automatically if left blank)</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white outline-none text-sm transition"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Photo Upload with Preview */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Photo of Issue <span className="text-slate-400 font-normal text-xs">(helps verify & analyze with AI)</span>
                  </label>

                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 max-w-md group">
                      <img src={imagePreview} alt="Issue preview" className="w-full h-48 sm:h-56 object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[11px] text-slate-300">
                        Image ready to upload
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition"
                    >
                      <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-300">Click to upload or take a photo</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP up to 5MB</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Location Section */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        Incident Location <span className="text-red-400">*</span>
                      </h4>
                      <p className="text-xs text-slate-400">Required for routing & duplicate detection</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locationLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition"
                    >
                      {locationLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                      <span>{locationLoading ? "Detecting..." : "Use My Location"}</span>
                    </button>
                  </div>

                  {locationStatus && (
                    <p className="text-xs text-cyan-400/90 font-mono bg-cyan-950/20 px-2.5 py-1.5 rounded-md border border-cyan-500/20">
                      {locationStatus}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="e.g. 12.9716"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="e.g. 77.5946"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Street Address or Landmark Fallback</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., MG Road outside City General Hospital"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing with AI & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit Civic Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY SUBMITTED REPORTS                                              */}
        {/* ========================================================================= */}
        {activeTab === "my-reports" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>My Submitted Reports ({myReports.length})</span>
              </h2>
              <button
                onClick={fetchMyReports}
                disabled={loadingReports}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingReports ? (
              <div className="text-center py-16 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                <p>Loading your reports...</p>
              </div>
            ) : myReports.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
                <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No reports submitted yet</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Help improve your city by reporting potholes, broken streetlights, or waste overflow.
                </p>
                <button
                  onClick={() => setActiveTab("form")}
                  className="mt-4 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs transition"
                >
                  Create First Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myReports.map((rep) => (
                  <div
                    key={rep._id}
                    onClick={() => setSelectedReport(rep)}
                    className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {rep.imageUrl && (
                        <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-slate-950">
                          <img src={rep.imageUrl} alt={rep.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                          {rep.category}
                        </span>
                        {getStatusBadge(rep.status)}
                      </div>

                      <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition">
                        {rep.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {rep.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-slate-300">
                        Priority: <span className="text-amber-400">{rep.priorityScore}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT DETAIL MODAL (BEFORE / AFTER COMPARISON)                           */}
        {/* ========================================================================= */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-left relative shadow-2xl">
              <button
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                  {selectedReport.category}
                </span>
                {getStatusBadge(selectedReport.status)}
                <span className="text-xs text-slate-400">
                  Routed to: <strong className="text-slate-200">{selectedReport.department}</strong>
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{selectedReport.title}</h2>
              <p className="text-sm text-slate-300 mb-4">{selectedReport.description}</p>

              {/* Before / After Verification Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                  <span className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    Before (Citizen Complaint)
                  </span>
                  {selectedReport.imageUrl ? (
                    <img src={selectedReport.imageUrl} alt="Before" className="w-full h-44 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center text-xs text-slate-600 bg-slate-900 rounded-lg">
                      No initial image provided
                    </div>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                  <span className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    After (Authority Verification)
                  </span>
                  {selectedReport.afterImageUrl ? (
                    <img src={selectedReport.afterImageUrl} alt="After resolution" className="w-full h-44 object-cover rounded-lg border border-emerald-500/30" />
                  ) : (
                    <div className="w-full h-44 flex flex-col items-center justify-center text-xs text-slate-500 bg-slate-900 rounded-lg p-4 text-center">
                      <Clock className="w-6 h-6 text-slate-600 mb-1" />
                      <span>Resolution in progress</span>
                      <span className="text-[10px] text-slate-600 mt-0.5">After photo uploaded when fixed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Metadata info */}
              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p>
                  <strong className="text-slate-300">Address:</strong> {selectedReport.location?.address || "Coordinates only"}
                </p>
                <p>
                  <strong className="text-slate-300">Coordinates:</strong> {selectedReport.location?.lat}, {selectedReport.location?.lng}
                </p>
                <p>
                  <strong className="text-slate-300">Priority Score:</strong> {selectedReport.priorityScore} (Severity: {selectedReport.severity})
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}