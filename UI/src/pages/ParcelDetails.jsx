import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import { ConfirmDialog, EmptyState, Modal, StatusBadge } from "../components/ui.jsx";
import { btnGhost, btnPrimary, labelCls, inputCls, panel } from "../components/styles.js";
import { assignRider, useParcels, useRiders } from "../store/records.js";
import { logAction } from "../store/audit.js";
import { toast } from "../store/toast.js";

// Timeline galing sa status ng parcel (mock). TODO: GET /api/parcels/:id/events
function buildTimeline(p) {
  const at = (hrs) =>
    new Date(p.ts + hrs * 3600 * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const steps = [
    { icon: "fa-box", title: "Parcel registered", text: `${p.shop} created the parcel.`, time: at(0) },
    p.verification === "Verified"
      ? { icon: "fa-circle-check", title: "Verified by coordinator", text: "QR scanned and seller video checked.", time: at(1) }
      : p.verification === "Flagged"
      ? { icon: "fa-flag", title: "Flagged for review", text: "Needs coordinator attention.", time: at(1), bad: true }
      : { icon: "fa-clock", title: "Waiting for verification", text: "Coordinator has not verified this yet.", time: "Pending", pending: true },
    { icon: "fa-motorcycle", title: "Picked up by rider", text: `Rider: ${p.rider}`, time: at(3) },
    { icon: "fa-truck", title: "In transit", text: "On the way to the recipient.", time: at(5) },
  ];
  if (p.status === "Delivered") steps.push({ icon: "fa-circle-check", title: "Delivered", text: `Received by ${p.recipient}.`, time: at(p.hours), done: true });
  else if (p.status === "Failed Delivery") steps.push({ icon: "fa-triangle-exclamation", title: "Delivery failed", text: "Recipient unavailable or address issue.", time: at(p.hours), bad: true });
  else steps.push({ icon: "fa-location-dot", title: "Out for delivery", text: "Expected soon.", time: "Pending", pending: true });
  return steps;
}

export default function ParcelDetails() {
  const { id } = useParams();
  const parcels = useParcels();
  const riders = useRiders();
  const parcel = parcels.find((p) => p.id === id);

  const [assignOpen, setAssignOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [confirm, setConfirm] = useState(false);

  const timeline = useMemo(() => (parcel ? buildTimeline(parcel) : []), [parcel]);

  if (!parcel) {
    return (
      <>
        <Topbar title="Parcel not found" subtitle="" />
        <div className={panel}>
          <EmptyState icon="fa-box-open" title={`No parcel with ID ${id}`} text="It may have been removed or the link is wrong." />
          <div className="pb-8 text-center"><Link to="/parcels" className={btnPrimary}>Back to Parcels</Link></div>
        </div>
      </>
    );
  }

  const available = riders.filter((r) => r.status !== "Off-duty" && r.name !== parcel.rider);
  const row = (label, value) => (
    <div className="flex justify-between gap-4 py-2.5 border-b border-[#f3f3f3] last:border-0 text-[13px] dark:border-night-line">
      <span className="text-[#999]">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  );

  const doAssign = () => {
    // TODO: PATCH /api/parcels/:id/assign { rider }
    const from = parcel.rider;
    assignRider(parcel.id, pick);
    logAction({ category: "Parcels", action: "Reassigned rider", target: parcel.id, detail: `${from} → ${pick}` });
    toast(`${parcel.id} reassigned to ${pick}.`);
    setConfirm(false);
    setAssignOpen(false);
    setPick("");
  };

  return (
    <>
      <Topbar title={`Parcel ${parcel.id}`} subtitle={`${parcel.item} · ${parcel.shop}`}>
        <Link to="/parcels" className={btnGhost}><i className="fa-solid fa-arrow-left" /> Back</Link>
        <button onClick={() => window.print()} className={btnGhost}><i className="fa-solid fa-print" /> Print</button>
      </Topbar>

      <div className="grid grid-cols-[1.1fr_1fr] gap-6 max-[1100px]:grid-cols-1">
        {/* TIMELINE */}
        <section className={`${panel} p-7`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold">Tracking Timeline</h2>
            <StatusBadge status={parcel.status} />
          </div>
          <ol className="relative">
            {timeline.map((s, i) => {
              const tone = s.bad ? "bg-[#fff0f0] text-[#d94747]" : s.pending ? "bg-[#f3f3f3] text-[#aaa] dark:bg-night-line" : s.done ? "bg-[#eaf8ef] text-[#29945a]" : "bg-brand-soft text-brand";
              return (
                <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-[#eadfd5] dark:bg-night-line" />}
                  <span className={`w-[36px] h-[36px] shrink-0 rounded-full flex items-center justify-center text-[13px] ${tone}`}><i className={`fa-solid ${s.icon}`} /></span>
                  <div className="pt-0.5">
                    <strong className={`block text-[14px] ${s.pending ? "text-[#aaa]" : ""}`}>{s.title}</strong>
                    <span className="block text-[12px] text-[#888] mt-0.5">{s.text}</span>
                    <small className="block text-[11px] text-[#aaa] mt-1">{s.time}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex flex-col gap-6">
          <section className={`${panel} p-7`}>
            <h2 className="text-[18px] font-bold mb-3">Parcel Information</h2>
            {row("Tracking ID", parcel.id)}
            {row("Item", parcel.item)}
            {row("Seller", `${parcel.seller} (${parcel.shop})`)}
            {row("Recipient", parcel.recipient)}
            {row("Address", parcel.address)}
            {row("Amount (COD)", `₱${parcel.amount.toLocaleString()}`)}
            {row("Verification", <StatusBadge status={parcel.verification} />)}
          </section>

          <section className={`${panel} p-7`}>
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-[18px] font-bold">Assigned Rider</h2>
              {parcel.status === "In Transit" && (
                <button onClick={() => setAssignOpen(true)} className={btnGhost}><i className="fa-solid fa-user-pen" /> Reassign</button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="w-[44px] h-[44px] rounded-full bg-brand-soft text-brand flex items-center justify-center"><i className="fa-solid fa-motorcycle" /></span>
              <div>
                <strong className="block text-[14px]">{parcel.rider}</strong>
                <Link to={`/messages?contact=${encodeURIComponent(parcel.rider)}`} className="text-[12px] text-brand hover:underline">Message rider</Link>
              </div>
            </div>
          </section>

          <section className={`${panel} p-7`}>
            <h2 className="text-[18px] font-bold mb-3">Proof of Delivery</h2>
            {parcel.status === "Delivered" ? (
              <>
                <div className="mb-4 h-[150px] rounded-xl bg-gradient-to-br from-[#fff0e7] to-[#ffe0cc] flex flex-col items-center justify-center text-brand dark:from-night-head dark:to-night-line">
                  <i className="fa-solid fa-camera text-[26px] mb-2" />
                  <span className="text-[12px] font-semibold">Delivery photo</span>
                  <small className="text-[10px] opacity-70">Uploaded by {parcel.rider}</small>
                </div>
                {row("Received by", parcel.recipient)}
                {row("Delivered at", new Date(parcel.ts + parcel.hours * 3600 * 1000).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }))}
                {row("Signature", <span className="italic font-serif text-[16px] text-[#666] dark:text-[#d1c9c2]">{parcel.recipient}</span>)}
              </>
            ) : parcel.status === "Failed Delivery" ? (
              <p className="text-[13px] text-[#d94747]"><i className="fa-solid fa-triangle-exclamation mr-1.5" /> Delivery failed — no proof of delivery was submitted.</p>
            ) : (
              <p className="text-[13px] text-[#999]"><i className="fa-regular fa-clock mr-1.5" /> Not yet delivered. The rider's photo and signature will appear here after delivery.</p>
            )}
          </section>
        </div>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} z="z-[3500]" className="w-full max-w-[440px] p-7 dark:bg-night-panel">
        <h3 className="text-[17px] font-bold mb-1">Reassign Rider</h3>
        <p className="text-[12px] text-[#999] mb-5">Current rider: {parcel.rider}</p>
        <label className={labelCls} htmlFor="rider-pick">New rider</label>
        <select id="rider-pick" value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls}>
          <option value="">Select a rider…</option>
          {available.map((r) => <option key={r.id} value={r.name}>{r.name} · {r.zone} · {r.status}</option>)}
        </select>
        <div className="flex justify-end gap-2.5 mt-6">
          <button className={btnGhost} onClick={() => setAssignOpen(false)}>Cancel</button>
          <button className={btnPrimary} disabled={!pick} onClick={() => setConfirm(true)}>Reassign</button>
        </div>
      </Modal>
      <ConfirmDialog open={confirm} title="Reassign this parcel?" text={`${parcel.id} will be handled by ${pick}.`} confirmLabel="Yes, reassign" onConfirm={doAssign} onCancel={() => setConfirm(false)} />
    </>
  );
}
