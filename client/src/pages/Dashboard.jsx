import { useState, useEffect, useMemo, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Filter,
  RefreshCw,
  MapPin,
  TrendingUp,
  Camera,
  Upload,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Building,
  Flame,
  Info,
} from "lucide-react";

// Helper component to center map when selected report changes
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
}

// Function to generate stylish Leaflet DivIcons with color-coded markers
function createCustomPin(priorityScore, status) {
  let color = "#00B4D8"; // Cyan
  if (status === "resolved") {
    color = "#06D6A0"; // Emerald Green
  } else if (priorityScore >= 7) {
    color = "#EF4444"; // Danger Red
  } else if (priorityScore >= 4) {
    color = "#F77F00"; // Orange
  }

  const svgIcon = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 0 10px ${color}88;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #0F172A;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-leaflet-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function Dashboard() {
  const { user } = useAuth();

  // Stats & Reports State
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    byCategory: {},
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Selected Issue for Inspection Panel
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const afterFileInputRef = useRef(null);

  // Fetch Stats and Reports
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, reportsRes] = await Promise.all([
        api.get("/stats"),
        api.get("/reports", {
          params: {
            status: statusFilter,
            category: categoryFilter,
            department: departmentFilter,
          },
        }),
      ]);

      setStats(statsRes.data);
      setReports(reportsRes.data);

      // Keep selected issue synced if it exists in updated list
      if (selectedIssue) {
        const found = reportsRes.data.find((r) => r._id === selectedIssue._id);
        if (found) setSelectedIssue(found);
      } else if (reportsRes.data.length > 0) {
        setSelectedIssue(reportsRes.data[0]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, departmentFilter]);

  // Handle Status Update
  const handleStatusChange = async (newStatus) => {
    if (!selectedIssue) return;
    setStatusUpdating(true);
    try {
      const res = await api.patch(`/reports/${selectedIssue._id}/status`, {
        status: newStatus,
      });
      setSelectedIssue(res.data.report);
      // Update in reports list
      setReports((prev) =>
        prev.map((r) => (r._id === selectedIssue._id ? res.data.report : r))
      );
      // Refresh stats
      const statsRes = await api.get("/stats");
      setStats(statsRes.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Uploading "After" Resolution Image
  const handleAfterImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedIssue) return;

    setUploadingAfter(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post(
        `/reports/${selectedIssue._id}/after-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSelectedIssue(res.data.report);
      setReports((prev) =>
        prev.map((r) => (r._id === selectedIssue._id ? res.data.report : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload after photo");
    } finally {
      setUploadingAfter(false);
      if (afterFileInputRef.current) afterFileInputRef.current.value = "";
    }
  };

  // Determine center coordinates for the map
  const mapCenter = useMemo(() => {
    if (selectedIssue?.location?.lat && selectedIssue?.location?.lng) {
      return [selectedIssue.location.lat, selectedIssue.location.lng];
    }
    if (reports.length > 0 && reports[0].location?.lat) {
      return [reports[0].location.lat, reports[0].location.lng];
    }
    return [12.9716, 77.5946]; // Default City Coordinates (e.g. Bengaluru)
  }, [selectedIssue, reports]);

  const getPriorityBadgeClass = (score) => {
    if (score >= 7.5) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (score >= 4.5) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Authority Operations
              </span>
              <span className="text-xs text-slate-400">Live AI Priority Dispatch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Civic Incident Intelligence Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 STAT METRIC CARDS                                                       */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Incidents</p>
              <h3 className="text-3xl font-black text-white mt-1">{stats.total}</h3>
              <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Captured in city
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Open */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Tickets</p>
              <h3 className="text-3xl font-black text-cyan-400 mt-1">{stats.open}</h3>
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Awaiting response
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</p>
              <h3 className="text-3xl font-black text-amber-400 mt-1">{stats.in_progress}</h3>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Crews dispatched
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resolved</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{stats.resolved}</h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Photo verified
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FILTERS BAR                                                               */}
        {/* ========================================================================= */}
        <section className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filter Issues:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="all">All Categories</option>
                <option value="pothole">Pothole</option>
                <option value="streetlight">Streetlight</option>
                <option value="water">Water Leak</option>
                <option value="garbage">Garbage</option>
                <option value="tree">Fallen Tree</option>
                <option value="road">Road Damage</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="all">All Departments</option>
                <option value="Roads">Roads</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Parks">Parks</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: MAP (TOP) & SPLIT VIEW (TABLE + SELECTED ISSUE PANEL)     */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          {/* Interactive Leaflet Map */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Live Geospatial Incident Map</h3>
                <span className="text-xs text-slate-500 font-mono">({reports.length} plotted)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> High Priority</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Resolved</span>
              </div>
            </div>

            <div className="h-80 sm:h-96 w-full rounded-xl overflow-hidden border border-slate-800 relative z-10">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", backgroundColor: "#0f172a" }}
              >
                <ChangeMapView coords={mapCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {reports.map((rep) => {
                  if (!rep.location?.lat || !rep.location?.lng) return null;
                  const isSelected = selectedIssue?._id === rep._id;

                  return (
                    <Marker
                      key={rep._id}
                      position={[rep.location.lat, rep.location.lng]}
                      icon={createCustomPin(rep.priorityScore, rep.status)}
                      eventHandlers={{
                        click: () => setSelectedIssue(rep),
                      }}
                    >
                      <Popup className="civic-map-popup">
                        <div className="p-1 text-slate-900 font-sans">
                          <span className="text-[10px] uppercase font-bold text-cyan-700 block">
                            {rep.category} • Score {rep.priorityScore}
                          </span>
                          <h4 className="font-bold text-xs mt-0.5">{rep.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-1">{rep.location?.address}</p>
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-200">
                            {rep.status}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Bottom Grid: Issue Table (Left 7 cols) & Selected Panel (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Issue Table (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Priority Queue ({reports.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">Sorted by Priority Score</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Issue Title</th>
                        <th className="py-2.5 px-3">Dept</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No issues match current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        reports.map((rep) => {
                          const isSelected = selectedIssue?._id === rep._id;
                          return (
                            <tr
                              key={rep._id}
                              onClick={() => setSelectedIssue(rep)}
                              className={`cursor-pointer transition hover:bg-slate-800/50 ${
                                isSelected ? "bg-cyan-950/40 border-l-2 border-cyan-400" : ""
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span className={`px-2 py-0.5 rounded border text-[11px] ${getPriorityBadgeClass(rep.priorityScore)}`}>
                                  {rep.priorityScore}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="capitalize font-medium text-slate-300">
                                  {rep.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-white max-w-[180px] truncate">
                                {rep.title}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">
                                {rep.department}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    rep.status === "resolved"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : rep.status === "in_progress"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  }`}
                                >
                                  {rep.status.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected-Issue Inspection Panel (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              {selectedIssue ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedIssue.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Priority:</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${getPriorityBadgeClass(selectedIssue.priorityScore)}`}>
                        {selectedIssue.priorityScore}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{selectedIssue.title}</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selectedIssue.description}</p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Department:</span>
                      <span className="font-semibold text-white">{selectedIssue.department}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Complaints Merged:</span>
                      <span className="font-semibold text-amber-400">{selectedIssue.duplicateCount || 1} citizens</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                      <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" /> Location:
                      </span>
                      <span className="font-medium text-slate-200 truncate block">
                        {selectedIssue.location?.address || `${selectedIssue.location?.lat}, ${selectedIssue.location?.lng}`}
                      </span>
                    </div>
                  </div>

                  {/* Before & After Verification Photos */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Incident Photos</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Before Photo */}
                      <div className="bg-slate-950 rounded-xl p-2 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Before (Reported)</span>
                        {selectedIssue.imageUrl ? (
                          <a href={selectedIssue.imageUrl} target="_blank" rel="noreferrer">
                            <img src={selectedIssue.imageUrl} alt="Before" className="w-full h-28 object-cover rounded-lg hover:opacity-90 transition" />
                          </a>
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center text-[10px] text-slate-600 bg-slate-900 rounded-lg">
                            No photo
                          </div>
                        )}
                      </div>

                      {/* After Photo */}
                      <div className="bg-slate-950 rounded-xl p-2 border border-slate-800">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-1">After (Resolution)</span>
                        {selectedIssue.afterImageUrl ? (
                          <a href={selectedIssue.afterImageUrl} target="_blank" rel="noreferrer">
                            <img src={selectedIssue.afterImageUrl} alt="After" className="w-full h-28 object-cover rounded-lg border border-emerald-500/30 hover:opacity-90 transition" />
                          </a>
                        ) : (
                          <div className="w-full h-28 flex flex-col items-center justify-center text-[10px] text-slate-500 bg-slate-900 rounded-lg p-2 text-center">
                            <span>Pending fix photo</span>
                            <button
                              type="button"
                              onClick={() => afterFileInputRef.current?.click()}
                              className="mt-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/30"
                            >
                              Upload
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Status Dropdown & Upload After Photo */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Update Status (Authority Action):
                      </label>
                      <select
                        value={selectedIssue.status}
                        disabled={statusUpdating}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white text-xs font-semibold outline-none"
                      >
                        <option value="open">Open (Unassigned)</option>
                        <option value="in_progress">In Progress (Field Work Started)</option>
                        <option value="resolved">Resolved (Fix Completed)</option>
                      </select>
                    </div>

                    <div>
                      <input
                        ref={afterFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAfterImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => afterFileInputRef.current?.click()}
                        disabled={uploadingAfter}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                      >
                        {uploadingAfter ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{uploadingAfter ? "Uploading Verification Photo..." : "Upload 'After' Photo"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-slate-500">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Select any incident from the map or table to inspect details and manage resolution.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}