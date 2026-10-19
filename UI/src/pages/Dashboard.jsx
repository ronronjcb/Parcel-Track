import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Topbar from "../components/Topbar.jsx";
import { StatusBadge } from "../components/ui.jsx";
import { recentParcels } from "../data/mock.js";
import { StatCard } from "../components/portal.jsx";
import RecentActivity from "../components/audit/RecentActivity.jsx";
import { listParcels } from "../services/parcelService.js";
import { STAT_NOTES, parcelStats } from "../utils/stats.js";

const tones = {
  orange: "bg-[#fff0e5] text-orange-500",
  yellow: "bg-[#fff4d8] text-[#e99a00]",
  green: "bg-[#d9f4e5] text-[#0c9b58]",
  red: "bg-[#ffe2e2] text-[#ef4444]",
};

const weekData = [
  { day: "Mon", parcels: 40 },
  { day: "Tue", parcels: 60 },
  { day: "Wed", parcels: 48 },
  { day: "Thu", parcels: 72 },
  { day: "Fri", parcels: 55 },
  { day: "Sat", parcels: 85 },
  { day: "Sun", parcels: 65 },
];

const monthData = Array.from({ length: 10 }, (_, i) => ({
  day: `D${i * 3 + 1}`,
  parcels: [50, 62, 45, 78, 58, 90, 66, 72, 54, 81][i],
}));

const panel = "bg-white border border-[#e5e8ee] rounded-2xl p-[30px] min-w-0 dark:bg-night-panel dark:border-night-line";

export default function Dashboard() {
  const [range, setRange] = useState("7");
  const data = range === "7" ? weekData : monthData;

  // Totoong bilang mula sa backend (GET /api/parcels = lahat ng parcel)
  const [parcels, setParcels] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    listParcels().then(setParcels).catch(() => {}).finally(() => setLoadingStats(false));
  }, []);
  const stats = parcelStats(parcels);
  const v = (n) => (loadingStats ? "…" : n);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Welcome back, Admin!" />

      {/* SUMMARY CARDS: totoong bilang mula sa backend */}
      <section className="grid grid-cols-4 gap-6 mb-7 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
        <StatCard label="Total Parcels" value={v(stats.total)} note={STAT_NOTES.total} icon="fa-box" tone="orange" to="/parcels" />
        <StatCard label="Flagged Parcels" value={v(stats.flagged)} note={STAT_NOTES.flagged} icon="fa-flag" tone="red" to="/verification" />
        <StatCard label="Pending Parcels" value={v(stats.pending)} note={STAT_NOTES.pending} icon="fa-hourglass-half" tone="yellow" to="/verification" />
        <StatCard label="Delivered" value={v(stats.delivered)} note={STAT_NOTES.delivered} icon="fa-circle-check" tone="green" />
      </section>

      {/* RECENT ACTIVITY (lahat ng role) */}
      <div className="mb-7"><RecentActivity to="/audit" /></div>

      {/* ACTIVITY + VERIFICATION */}
      <section className="grid grid-cols-[2fr_1fr] items-stretch gap-6 mb-7 max-[1200px]:grid-cols-1">
        <div className={`${panel} flex flex-col`}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-[22px] font-bold">
              <i className="fa-solid fa-chart-column mr-2 text-orange-500" />
              Parcel Activity
            </h2>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3.5 py-2.5 border border-[#e0e5ec] rounded-lg text-sm text-[#53637b] bg-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          <div className="flex-1 min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e4e8ef" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#dfe5ed" }} fontSize={13} />
                <YAxis tickLine={false} axisLine={false} fontSize={13} />
                <Tooltip cursor={{ fill: "rgba(249,115,22,.08)" }} />
                <Bar dataKey="parcels" fill="#f97316" radius={[7, 7, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-[18px] mt-6 text-[13px]">
            <span className="text-[#f97316]">● Delivered</span>
            <span className="text-[#3b82f6]">● In Transit</span>
            <span className="text-[#8b5cf6]">● Processing</span>
            <span className="text-[#16a34a]">● Pending</span>
          </div>
        </div>

        <div className={`${panel} flex flex-col`}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-[22px] font-bold">
              <i className="fa-regular fa-bell mr-2 text-orange-500" />
              Verification Needed
            </h2>
            <Link to="/verification" className="text-sm text-orange-500 whitespace-nowrap">
              View All →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-5 mb-5 rounded-xl bg-[#fff4ed] dark:bg-[#3b3531]">
            <div className="w-[60px] h-[60px] rounded-full bg-[#fff0e5] text-orange-500 flex items-center justify-center text-[26px]">
              <i className="fa-solid fa-box" />
            </div>
            <div>
              <h2 className="text-[34px] leading-tight font-bold text-orange-500">
                35 <small className="text-base font-normal text-[#26344d] dark:text-[#f1eeeb]">parcels</small>
              </h2>
              <p className="text-sm text-[#64748b] mt-1">need verification.</p>
            </div>
            <Link
              to="/verification"
              className="w-full mt-2 p-[13px] rounded-lg bg-orange-500 text-white text-center font-bold hover:bg-orange-600"
            >
              View Parcels →
            </Link>
          </div>

          <div className="flex flex-col flex-1">
          {[
            ["fa-clock", "Pending Verification", 35],
            ["fa-triangle-exclamation", "Flagged for Review", 8],
            ["fa-circle-play", "Awaiting Seller Video", 5],
          ].map(([icon, label, n]) => (
            <div key={label} className="flex-1 flex items-center justify-between py-4 text-[15px] text-[#52627a] border-b border-[#edf0f4] last:border-b-0 dark:border-night-line dark:text-[#d1c9c2]">
              <span>
                <i className={`fa-solid ${icon} w-6`} /> {label}
              </span>
              <strong className="text-lg text-orange-500">{n}</strong>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* RECENT PARCELS */}
      <section className={`${panel} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-[22px] font-bold">
            <i className="fa-solid fa-box mr-2 text-orange-500" />
            Recent Parcels
          </h2>
          <Link to="/parcels" className="text-sm text-orange-500 whitespace-nowrap hover:underline">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-[#f5f6f9] text-[#65748b] text-sm text-left dark:bg-night-head dark:text-[#ddd7d2]">
                {["Tracking ID", "Seller", "Status", "Verification", "Date"].map((h) => (
                  <th key={h} className="px-5 py-4 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentParcels.map((p) => {
                const cell = "px-5 py-5 border-b border-[#edf0f4] dark:border-night-line";
                return (
                  <tr key={p.id} className="text-sm text-[#52627a] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                    <td className={`${cell} whitespace-nowrap font-semibold text-[#27364f] dark:text-[#f1eeeb]`}>{p.id}</td>
                    <td className={`${cell} whitespace-nowrap`}>{p.seller}</td>
                    <td className={cell}><StatusBadge status={p.status} /></td>
                    <td className={cell}><StatusBadge status={p.verification} /></td>
                    <td className={`${cell} whitespace-nowrap`}>{p.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
