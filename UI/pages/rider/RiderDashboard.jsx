import { useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import RecentScans from "../../components/rider/RecentScans.jsx";
import Pagination from "../../components/Pagination.jsx";
import { EmptyState } from "../../components/ui.jsx";
import { PanelLink, PanelTitle, StatCard } from "../../components/portal.jsx";
import { btnPrimary, panel, td, th } from "../../components/styles.js";
import { getUser } from "../../api.js";
import RecentActivity from "../../components/audit/RecentActivity.jsx";
import { isToday, useRiderScans } from "../../store/riderScans.js";
import { STAT_NOTES, riderStats } from "../../utils/stats.js";
import { STAGE, useAssignedParcels, useMyDeliveries } from "../../store/riderDeliveries.js";

const PAGE_SIZE = 5;

// Dashboard ng rider: Assigned Parcels (i-scan ang QR) -> Recent Scans -> To Be Delivered -> Delivered / Failed.
export default function RiderDashboard() {
  const scans = useRiderScans();
  const assigned = useAssignedParcels();
  const mine = useMyDeliveries();
  const [page, setPage] = useState(1);

  const stats = riderStats(scans, mine);
  const doneToday = (stage) => mine.filter((d) => d.stage === stage && d.doneAt && isToday(d.doneAt)).length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(assigned.length / PAGE_SIZE)));
  const rows = assigned.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${getUser()?.name || "Rider"}!`}>
        <Link to="/rider/scan" className={btnPrimary}><i className="fa-solid fa-qrcode" /> Scan QR Code</Link>
      </Topbar>

      <section className="mb-7 mt-1 grid grid-cols-4 gap-6 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
        <StatCard label="Total Parcels" value={stats.total} note="Parcels you scanned" icon="fa-box" tone="orange" to="/rider/scan" />
        <StatCard label="Flagged Parcels" value={stats.flagged} note={STAT_NOTES.flagged} icon="fa-flag" tone="red" to="/rider/failed" />
        <StatCard label="Pending Parcels" value={stats.pending} note="To be delivered or waiting for verification" icon="fa-hourglass-half" tone="yellow" to="/rider/deliveries" />
        <StatCard label="Delivered" value={stats.delivered} note={`${doneToday(STAGE.DELIVERED)} today`} icon="fa-circle-check" tone="green" to="/rider/delivered" />
      </section>

      <section className={`${panel} mb-7 overflow-hidden p-[30px] max-[600px]:p-5`}>
        <PanelTitle icon="fa-box-open">Assigned Parcels</PanelTitle>
        <p className="-mt-3 mb-4 text-[12px] text-[#999]">Parcels the coordinator assigned to you. Scan each parcel's QR code to start its delivery.</p>
        {assigned.length === 0 ? (
          <EmptyState icon="fa-box-open" title="No assigned parcels" text="New parcels from the coordinator will show up here." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[10px] border border-[#eee] dark:border-night-line">
              <table className="w-full min-w-[720px] border-collapse">
                <thead className="bg-[#fafafa] dark:bg-night-head">
                  <tr>{["Parcel", "Receiver", "Address", "Seller", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.parcel_id} className="text-[#666] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                      <td className={`${td} whitespace-nowrap`}>
                        <strong className="block text-[#333] dark:text-[#f1eeeb]">{p.parcel_id}</strong>
                        <span className="text-[11px] text-[#aaa]">{p.contents}</span>
                      </td>
                      <td className={td}>{p.receiver}</td>
                      <td className={`${td} max-w-[240px]`}>{p.address}</td>
                      <td className={td}>{p.seller}</td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <Link to={`/rider/scan?expect=${encodeURIComponent(p.parcel_id)}`} className={btnPrimary}>
                          <i className="fa-solid fa-qrcode" /> Scan QR
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageSize={PAGE_SIZE} total={assigned.length} onPage={setPage} />
          </>
        )}
      </section>

      <div className="mb-7"><RecentScans scans={scans} action={<PanelLink to="/rider/scan">Scan</PanelLink>} /></div>

      <RecentActivity to="/rider/activity" />
    </>
  );
}
