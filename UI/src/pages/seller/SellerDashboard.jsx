import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Topbar from "../../components/Topbar.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { EmptyState } from "../../components/ui.jsx";
import { LoadingRow, Notice, PanelLink, PanelTitle, StatCard } from "../../components/portal.jsx";
import { btnGhost, btnPrimary, panel, td, th } from "../../components/styles.js";
import { getUser } from "../../api.js";
import RecentActivity from "../../components/audit/RecentActivity.jsx";
import { listParcels } from "../../services/parcelService.js";
import { STAT_NOTES, parcelStats } from "../../utils/stats.js";
import { formatDate } from "../../utils/format.js";
import { statusInfo } from "../../utils/parcelStatus.js";

// Lahat ng bilang ay galing sa GET /api/parcels (sariling parcels ng seller). Walang hardcoded.
const CHART = [
  ["WAITING_FOR_VIDEO", "#e99a00"],
  ["REUPLOAD_REQUESTED", "#f97316"],
  ["VIDEO_SUBMITTED", "#4285c5"],
  ["VERIFIED", "#16a34a"],
  ["REJECTED", "#ef4444"],
];

export default function SellerDashboard() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listParcels()
      .then(setParcels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const count = (...s) => parcels.filter((p) => s.includes(p.status)).length;
  const stats = parcelStats(parcels);
  const needAction = parcels.filter((p) => ["REUPLOAD_REQUESTED", "REJECTED"].includes(p.status));
  const chartData = useMemo(
    () => CHART.map(([s, color]) => ({ name: statusInfo(s).label, value: count(s), color })),
    [parcels] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const v = (n) => (loading ? "…" : n);
  const link = (p) => `/seller/scan?txn=${encodeURIComponent(p.transaction_number || p.parcel_id)}`;

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${getUser()?.name || "Seller"}!`}>
        <Link to="/seller/scan" className={btnGhost}><i className="fa-solid fa-qrcode" /> Scan / Upload</Link>
        <Link to="/seller/create" className={btnPrimary}><i className="fa-solid fa-plus" /> Create Parcel</Link>
      </Topbar>

      {error && <Notice tone="error" icon="fa-circle-exclamation" role="alert">{error}</Notice>}

      {/* SUMMARY CARDS */}
      <section className="mb-7 mt-1 grid grid-cols-4 gap-6 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
        <StatCard label="Total Parcels" value={v(stats.total)} note="Parcels you registered" icon="fa-box" tone="orange" to="/seller/parcels" />
        <StatCard label="Flagged Parcels" value={v(stats.flagged)} note={STAT_NOTES.flagged} icon="fa-flag" tone="red" to="/seller/parcels?status=FLAGGED" />
        <StatCard label="Pending Parcels" value={v(stats.pending)} note="Waiting for video, verification or delivery" icon="fa-hourglass-half" tone="yellow" to="/seller/parcels?status=PENDING" />
        <StatCard label="Delivered" value={v(stats.delivered)} note={STAT_NOTES.delivered} icon="fa-circle-check" tone="green" to="/seller/parcels?status=DELIVERED" />
      </section>

      {/* STATUS CHART + ACTION NEEDED */}
      <section className="mb-7 grid grid-cols-[2fr_1fr] items-stretch gap-6 max-[1200px]:grid-cols-1">
        <div className={`${panel} flex min-w-0 flex-col p-[30px]`}>
          <PanelTitle icon="fa-chart-column">Parcels by Status</PanelTitle>
          {parcels.length === 0 ? (
            <EmptyState title={loading ? "Loading…" : "No data yet"} text={loading ? "" : "Register a parcel to see your status breakdown."} />
          ) : (
            <div className="min-h-[280px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e8ef" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#dfe5ed" }} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={13} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(249,115,22,.08)" }} />
                  <Bar dataKey="value" name="Parcels" radius={[7, 7, 0, 0]} maxBarSize={52}>
                    {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${panel} flex min-w-0 flex-col p-[30px]`}>
          <PanelTitle icon="fa-bell">Action Needed</PanelTitle>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#fff4ed] p-5 dark:bg-night-head">
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#fff0e5] text-[24px] text-orange-500">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div>
              <h2 className="text-[32px] font-bold leading-tight text-orange-500">
                {v(needAction.length)} <small className="text-base font-normal text-[#26344d] dark:text-[#f1eeeb]">parcels</small>
              </h2>
              <p className="text-sm text-[#64748b]">need your attention.</p>
            </div>
          </div>

          {needAction.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#999]">{loading ? "" : "Nothing to fix. You're all set."}</p>
          ) : (
            <ul className="flex-1">
              {needAction.slice(0, 5).map((p) => (
                <li key={p.parcel_id} className="flex items-center justify-between gap-3 border-b border-[#edf0f4] py-3 text-[13px] last:border-b-0 dark:border-night-line">
                  <Link to={link(p)} className="truncate font-semibold text-brand hover:underline">{p.transaction_number || p.parcel_id}</Link>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* RECENT PARCELS */}
      <section className={`${panel} overflow-hidden p-[30px]`}>
        <PanelTitle icon="fa-box" action={<PanelLink to="/seller/parcels">View All</PanelLink>}>Recent Parcels</PanelTitle>

        {loading ? (
          <LoadingRow />
        ) : parcels.length === 0 ? (
          <EmptyState title="No parcels yet" text="Register your first parcel to get started." />
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-[#eee] dark:border-night-line">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-[#fafafa] dark:bg-night-head">
                <tr>
                  {["Transaction no.", "Receiver", "Contents", "Status", "Updated", ""].map((h) => <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {parcels.slice(0, 5).map((p) => (
                  <tr key={p.parcel_id} className="text-[#666] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                    <td className={`${td} whitespace-nowrap font-bold text-[#333] dark:text-[#f1eeeb]`}>{p.transaction_number || p.parcel_id}</td>
                    <td className={td}>{p.receiver_name}</td>
                    <td className={td}>{p.contents || "—"}</td>
                    <td className={td}><StatusBadge status={p.status} /></td>
                    <td className={`${td} whitespace-nowrap`}>{formatDate(p.updated_at)}</td>
                    <td className={`${td} text-right`}>
                      <Link to={link(p)} className="font-semibold text-brand hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-7"><RecentActivity to="/seller/activity" /></div>
    </>
  );
}
