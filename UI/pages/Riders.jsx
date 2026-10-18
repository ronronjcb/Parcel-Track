import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import Pagination from "../components/Pagination.jsx";
import { EmptyState, Modal, TableSkeleton } from "../components/ui.jsx";
import { btnGhost, btnPrimary, inputCls, panel, td, th } from "../components/styles.js";
import { setRiderStatus, useParcels, useRiders } from "../store/records.js";
import { logAction } from "../store/audit.js";
import { toast } from "../store/toast.js";
import { useFakeLoading } from "../utils/useFakeLoading.js";

const tone = {
  Active: "bg-[#eaf8ef] text-[#29945a]",
  "On Delivery": "bg-[#fff0e7] text-[#e9651c]",
  "Off-duty": "bg-[#f1f1f1] text-[#777] dark:bg-night-line dark:text-[#d1c9c2]",
};
const PAGE_SIZE = 8;

export default function Riders() {
  const riders = useRiders();
  const parcels = useParcels();
  const loading = useFakeLoading();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [view, setView] = useState(null);

  const stats = useMemo(() => {
    const m = {};
    riders.forEach((r) => {
      const mine = parcels.filter((p) => p.rider === r.name);
      const delivered = mine.filter((p) => p.status === "Delivered").length;
      const failed = mine.filter((p) => p.status === "Failed Delivery").length;
      m[r.name] = { total: mine.length, transit: mine.filter((p) => p.status === "In Transit").length, delivered, failed, rate: delivered + failed ? Math.round((delivered / (delivered + failed)) * 100) : 0 };
    });
    return m;
  }, [riders, parcels]);

  const rows = riders.filter(
    (r) => (status === "All" || r.status === status) && (!search.trim() || [r.name, r.zone, r.id].some((v) => v.toLowerCase().includes(search.toLowerCase().trim())))
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const current = view && riders.find((r) => r.id === view);

  const toggle = (r) => {
    const next = r.status === "Off-duty" ? "Active" : "Off-duty";
    setRiderStatus(r.id, next);
    logAction({ category: "Riders", action: next === "Off-duty" ? "Set rider off-duty" : "Set rider active", target: r.name });
    toast(`${r.name} is now ${next}.`);
  };

  const cards = [
    ["Total riders", riders.length, "fa-motorcycle", "bg-[#fff0e7] text-[#ff6818]"],
    ["Active", riders.filter((r) => r.status === "Active").length, "fa-circle-check", "bg-[#eaf8ef] text-[#25a35a]"],
    ["On delivery", riders.filter((r) => r.status === "On Delivery").length, "fa-truck", "bg-[#eaf3ff] text-[#4285c5]"],
    ["Off-duty", riders.filter((r) => r.status === "Off-duty").length, "fa-moon", "bg-[#f1f1f1] text-[#777]"],
  ];

  return (
    <>
      <Topbar title="Riders" subtitle="Manage riders, availability and delivery performance." />

      <section className="grid grid-cols-4 gap-5 mb-7 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {cards.map(([l, v, ic, t]) => (
          <div key={l} className={`${panel} p-6 flex items-center gap-4`}>
            <span className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center text-[22px] ${t}`}><i className={`fa-solid ${ic}`} /></span>
            <div><small className="text-[12px] text-[#999]">{l}</small><strong className="block text-[28px] leading-tight">{v}</strong></div>
          </div>
        ))}
      </section>

      <section className={`${panel} p-6`}>
        <div className="grid grid-cols-[1fr_200px] gap-3 mb-5 max-[700px]:grid-cols-1">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#aaa]" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search rider name, zone or ID..." className={`${inputCls} pl-9`} />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls} aria-label="Filter by status">
            {["All", "Active", "On Delivery", "Off-duty"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="w-full overflow-x-auto border border-[#eee] rounded-[10px] dark:border-night-line">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-[#fafafa] dark:bg-night-head">
              <tr>{["Rider", "Zone", "Vehicle", "Parcels", "Success rate", "Rating", "Status", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr>
            </thead>
            {loading ? <TableSkeleton rows={6} cols={8} /> : (
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="text-[#666] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                    <td className={td}><strong className="block text-[#333] dark:text-[#f1eeeb]">{r.name}</strong><small className="text-[10px] text-[#aaa]">{r.id}</small></td>
                    <td className={td}>{r.zone}</td>
                    <td className={td}>{r.vehicle}</td>
                    <td className={td}>{stats[r.name].total}</td>
                    <td className={td}>{stats[r.name].rate}%</td>
                    <td className={td}><i className="fa-solid fa-star text-[#f5a623] mr-1 text-[11px]" />{r.rating}</td>
                    <td className={td}><span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tone[r.status]}`}>{r.status}</span></td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button onClick={() => setView(r.id)} className="text-brand text-[12px] font-semibold hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {!loading && rows.length === 0 && <EmptyState icon="fa-motorcycle" title="No riders found" text="Try a different search or status." />}
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </section>

      <Modal open={!!current} onClose={() => setView(null)} z="z-[3500]" className="w-full max-w-[500px] p-7 dark:bg-night-panel">
        {current && (
          <>
            <button onClick={() => setView(null)} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f6f8] text-[#7c8da0] dark:bg-night-line"><i className="fa-solid fa-xmark" /></button>
            <div className="flex items-center gap-4 mb-5">
              <span className="w-[56px] h-[56px] rounded-full bg-brand-soft text-brand flex items-center justify-center text-[22px]"><i className="fa-solid fa-motorcycle" /></span>
              <div>
                <h3 className="text-[18px] font-bold">{current.name}</h3>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[11px] font-semibold ${tone[current.status]}`}>{current.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[["Assigned", stats[current.name].total], ["In transit", stats[current.name].transit], ["Delivered", stats[current.name].delivered], ["Failed", stats[current.name].failed]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-[#fffaf7] border border-[#ffe9dc] p-3.5 dark:bg-night-head dark:border-night-line"><small className="block text-[11px] text-[#999]">{l}</small><strong className="text-[20px]">{v}</strong></div>
              ))}
            </div>
            <dl className="text-[13px] space-y-2.5 mb-6">
              {[["Phone", current.phone], ["Zone", current.zone], ["Vehicle", `${current.vehicle} · ${current.plate}`], ["Joined", current.joined]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-[#999]">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>
              ))}
            </dl>
            <div className="flex gap-2.5 flex-wrap">
              <Link to={`/messages?contact=${encodeURIComponent(current.name)}`} className={btnPrimary}><i className="fa-solid fa-comment" /> Message</Link>
              <button onClick={() => toggle(current)} className={btnGhost}>{current.status === "Off-duty" ? "Set Active" : "Set Off-duty"}</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
