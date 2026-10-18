import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import Pagination from "../../components/Pagination.jsx";
import { EmptyState } from "../../components/ui.jsx";
import { Notice } from "../../components/portal.jsx";
import ParcelReport from "../../components/seller/ParcelReport.jsx";
import { btnGhost, btnPrimary, inputCls, panel, td, th } from "../../components/styles.js";
import { listParcels } from "../../services/parcelService.js";
import { formatDate } from "../../utils/format.js";
import { statusInfo } from "../../utils/parcelStatus.js";
import { bucketOf } from "../../utils/stats.js";

const PAGE_SIZE = 10;
const STATUSES = ["WAITING_FOR_VIDEO", "VIDEO_SUBMITTED", "VERIFIED", "REJECTED", "REUPLOAD_REQUESTED"];
const PENDING = ["WAITING_FOR_VIDEO", "REUPLOAD_REQUESTED"];

export default function ParcelRecords() {
  const [params, setParams] = useSearchParams();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const status = params.get("status") || "ALL";

  const load = () => {
    setLoading(true);
    setError("");
    listParcels()
      .then(setParcels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = parcels.filter((p) => {
      const bucket = ["FLAGGED", "PENDING", "DELIVERED"].includes(status);
      if (bucket) {
        if (bucketOf(p) !== status) return false;
      } else {
        if (status === "PENDING_UPLOAD" && !PENDING.includes(p.status)) return false;
        if (status !== "ALL" && status !== "PENDING_UPLOAD" && p.status !== status) return false;
      }
      if (!q) return true;
      return [p.parcel_id, p.transaction_number, p.receiver_name, p.receiver_contact, p.contents].some((v) => String(v || "").toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sort === "status") return statusInfo(a.status).label.localeCompare(statusInfo(b.status).label);
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [parcels, search, status, sort]);

  useEffect(() => setPage(1), [search, status, sort]);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setStatus = (v) => {
    if (v === "ALL") params.delete("status");
    else params.set("status", v);
    setParams(params, { replace: true });
  };

  // Mabilis na filter (may bilang) sa itaas ng talaan
  const tabs = [
    ["ALL", "All", parcels.length],
    ["PENDING_UPLOAD", "Needs video", parcels.filter((p) => PENDING.includes(p.status)).length],
    ["VIDEO_SUBMITTED", "Under verification", parcels.filter((p) => p.status === "VIDEO_SUBMITTED").length],
    ["VERIFIED", "Verified", parcels.filter((p) => p.status === "VERIFIED").length],
    ["REJECTED", "Rejected", parcels.filter((p) => p.status === "REJECTED").length],
  ];

  return (
    <>
      <Topbar title="Parcel Records" subtitle="All the parcels you registered, with their verification status.">
        <button onClick={() => setReportOpen((v) => !v)} className={btnGhost}><i className="fa-solid fa-file-lines" /> Generate Report</button>
        <Link to="/seller/create" className={btnPrimary}><i className="fa-solid fa-plus" /> Create Parcel</Link>
      </Topbar>

      {reportOpen && <ParcelReport parcels={parcels} onClose={() => setReportOpen(false)} />}

      {error && (
        <div className="mb-4">
          <Notice tone="error" icon="fa-circle-exclamation" role="alert">
            {error} <button onClick={load} className="font-bold underline">Try again</button>
          </Notice>
        </div>
      )}

      <section className={`${panel} p-[26px] max-[600px]:p-[18px] ${reportOpen ? "print:hidden" : ""}`}>
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                status === key
                  ? "border-brand bg-brand text-white"
                  : "border-[#eee] bg-white text-[#666] hover:border-brand hover:text-brand dark:border-night-line dark:bg-night-head dark:text-[#d1c9c2]"
              }`}
            >
              {label} <span className="ml-1 opacity-70">{loading ? "" : n}</span>
            </button>
          ))}
        </div>

        <div className="mb-[18px] grid grid-cols-[1fr_190px_170px] gap-3 max-[900px]:grid-cols-1">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#aaa]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, transaction no., receiver, contact or contents..." aria-label="Search" className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter" className={inputCls}>
            <option value="ALL">All statuses</option>
            <option value="FLAGGED">Flagged</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PENDING_UPLOAD">Needs video upload</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusInfo(s).label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={inputCls}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="status">By status</option>
          </select>
        </div>

        <div className="w-full overflow-x-auto rounded-[10px] border border-[#eee] dark:border-night-line">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="bg-[#fafafa] dark:bg-night-head">
              <tr>
                {["Parcel ID", "Transaction no.", "Receiver", "Contents", "Status", "Created", ""].map((h) => <th key={h} className={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const needsVideo = PENDING.includes(p.status);
                return (
                  <tr key={p.parcel_id} className="text-[#666] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                    <td className={`${td} whitespace-nowrap font-mono text-[11px]`}>{p.parcel_id}</td>
                    <td className={`${td} whitespace-nowrap font-bold text-[#333] dark:text-[#f1eeeb]`}>{p.transaction_number || "—"}</td>
                    <td className={td}>
                      <strong className="block text-[13px] text-[#333] dark:text-[#f1eeeb]">{p.receiver_name}</strong>
                      <span className="block text-[11px] text-[#aaa]">{p.receiver_contact || "—"}</span>
                    </td>
                    <td className={td}>{p.contents || "—"}</td>
                    <td className={td}><StatusBadge status={p.status} /></td>
                    <td className={`${td} whitespace-nowrap`}>{formatDate(p.created_at)}</td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Link to={`/seller/scan?txn=${encodeURIComponent(p.transaction_number || p.parcel_id)}`} className="font-semibold text-brand hover:underline">
                        {needsVideo ? "Upload video" : "View details"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <p className="py-10 text-center text-[13px] text-[#999]">Loading…</p>}
          {!loading && visible.length === 0 && (
            <EmptyState
              title={parcels.length ? "No parcels match your filters" : "You have no parcels yet"}
              text={parcels.length ? "Try a different search or status." : "Create your first parcel to see it here."}
            />
          )}
        </div>

        {!loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />}
      </section>
    </>
  );
}
