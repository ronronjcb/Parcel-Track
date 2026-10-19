import { useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import { EmptyState, Modal } from "../../components/ui.jsx";
import { Notice } from "../../components/portal.jsx";
import { btnGhost, btnPrimary, inputCls, labelCls, panel, td, textareaCls, th } from "../../components/styles.js";
import { FAIL_REASONS, STAGE, markDelivered, markFailed, reattempt, useMyDeliveries } from "../../store/riderDeliveries.js";
import { compressImage } from "../../utils/image.js";
import { formatDate } from "../../utils/format.js";
import { toast } from "../../store/toast.js";

const PAGE_SIZE = 8;

const COPY = {
  [STAGE.TO_DELIVER]: { title: "To Be Delivered", subtitle: "Parcels you scanned. Mark each one as delivered (with proof) or failed (with a reason).", icon: "fa-truck-fast", empty: "Nothing to deliver", emptyText: "Scan a parcel's QR code and it will appear here." },
  [STAGE.DELIVERED]: { title: "Delivered", subtitle: "Parcels you delivered, with proof of delivery.", icon: "fa-circle-check", empty: "No delivered parcels yet", emptyText: "Completed deliveries will be listed here." },
  [STAGE.FAILED]: { title: "Failed Delivery", subtitle: "Parcels you could not deliver, with the reason.", icon: "fa-triangle-exclamation", empty: "No failed deliveries", emptyText: "Failed attempts and their reasons will be listed here." },
};

// Isang page para sa tatlong listahan ng rider: To Be Delivered, Delivered at Failed (depende sa `stage`)
export default function RiderDeliveries({ stage }) {
  const copy = COPY[stage];
  const all = useMyDeliveries();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null); // { type: "delivered" | "failed", d }
  const [proof, setProof] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(null);

  const list = all
    .filter((d) => d.stage === stage)
    .sort((a, b) => (b.doneAt || b.scannedAt) - (a.doneAt || a.scannedAt));
  const safePage = Math.min(page, Math.max(1, Math.ceil(list.length / PAGE_SIZE)));
  const rows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const open = (type, d) => {
    setAction({ type, d });
    setProof("");
    setReason("");
    setNote("");
    setError("");
  };
  const close = () => setAction(null);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setProof(await compressImage(file));
    } catch (err) {
      setProof("");
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    const { type, d } = action;
    if (type === "delivered") {
      if (!proof) return setError("Please add a photo as proof of delivery.");
      // TODO: POST /api/rider/parcels/:id/delivered
      markDelivered(d.parcel_id, { proof, note: note.trim() });
      toast(`${d.transaction_number} marked as delivered.`);
    } else {
      if (!reason) return setError("Please choose why the delivery failed.");
      if (reason === "Other" && !note.trim()) return setError("Please explain the reason in the notes.");
      // TODO: POST /api/rider/parcels/:id/failed
      markFailed(d.parcel_id, { reason, note: note.trim() });
      toast(`${d.transaction_number} marked as failed.`, "error");
    }
    close();
  };

  const heads = {
    [STAGE.TO_DELIVER]: ["Parcel", "Receiver", "Address", "Seller", "Scanned", ""],
    [STAGE.DELIVERED]: ["Parcel", "Receiver", "Seller", "Delivered", "Proof", "Notes"],
    [STAGE.FAILED]: ["Parcel", "Receiver", "Seller", "Failed", "Reason", ""],
  }[stage];

  return (
    <>
      <Topbar title={copy.title} subtitle={copy.subtitle}>
        {stage !== STAGE.TO_DELIVER ? (
          <Link to="/rider/reports" className={btnGhost}><i className="fa-solid fa-file-lines" /> My Reports</Link>
        ) : (
          <Link to="/rider/scan" className={btnPrimary}><i className="fa-solid fa-qrcode" /> Scan QR Code</Link>
        )}
      </Topbar>

      <section className={`${panel} overflow-hidden p-[26px] max-[600px]:p-5`}>
        {list.length === 0 ? (
          <EmptyState icon={copy.icon} title={copy.empty} text={copy.emptyText} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[10px] border border-[#eee] dark:border-night-line">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="bg-[#fafafa] dark:bg-night-head"><tr>{heads.map((h, i) => <th key={i} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.parcel_id} className="align-top text-[#666] hover:bg-[#fffaf7] dark:text-[#d1c9c2] dark:hover:bg-night-head">
                      <td className={`${td} whitespace-nowrap`}>
                        <strong className="block text-[#333] dark:text-[#f1eeeb]">{d.transaction_number}</strong>
                        <span className="text-[11px] text-[#aaa]">{d.contents || "—"}</span>
                      </td>
                      <td className={td}>
                        {d.receiver || "—"}
                        {d.contact && <span className="block text-[11px] text-[#aaa]">{d.contact}</span>}
                      </td>

                      {stage === STAGE.TO_DELIVER && (
                        <>
                          <td className={`${td} max-w-[220px]`}>{d.address || "—"}</td>
                          <td className={td}>{d.seller || "—"}</td>
                          <td className={`${td} whitespace-nowrap`}>{formatDate(d.scannedAt)}</td>
                          <td className={`${td} whitespace-nowrap text-right`}>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => open("delivered", d)} className={btnPrimary}><i className="fa-solid fa-circle-check" /> Delivered</button>
                              <button onClick={() => open("failed", d)} className={btnGhost}><i className="fa-solid fa-xmark" /> Failed</button>
                            </div>
                          </td>
                        </>
                      )}

                      {stage === STAGE.DELIVERED && (
                        <>
                          <td className={td}>{d.seller || "—"}</td>
                          <td className={`${td} whitespace-nowrap`}>{formatDate(d.doneAt)}</td>
                          <td className={td}>
                            {d.proof ? (
                              <button onClick={() => setViewer(d)} aria-label="View proof of delivery">
                                <img src={d.proof} alt="Proof of delivery" className="h-12 w-12 rounded-lg border border-[#eee] object-cover dark:border-night-line" />
                              </button>
                            ) : "—"}
                          </td>
                          <td className={`${td} max-w-[200px]`}>{d.note || "—"}</td>
                        </>
                      )}

                      {stage === STAGE.FAILED && (
                        <>
                          <td className={td}>{d.seller || "—"}</td>
                          <td className={`${td} whitespace-nowrap`}>{formatDate(d.doneAt)}</td>
                          <td className={`${td} max-w-[240px]`}>
                            <strong className="block text-[#d94747]">{d.reason}</strong>
                            {d.note && <span className="text-[11px] text-[#aaa]">{d.note}</span>}
                          </td>
                          <td className={`${td} text-right`}>
                            <button onClick={() => { reattempt(d.parcel_id); toast(`${d.transaction_number} moved back to To Be Delivered.`); }} className="text-[12px] font-semibold text-brand hover:underline">
                              Try again
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageSize={PAGE_SIZE} total={list.length} onPage={setPage} />
          </>
        )}
      </section>

      {/* Delivered / Failed */}
      <Modal open={!!action} onClose={close} z="z-[3500]" className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto p-7 dark:bg-night-panel">
        {action && (
          <>
            <button onClick={close} aria-label="Close" className="absolute right-4 top-4 h-8 w-8 rounded-full bg-[#f4f6f8] text-[#7c8da0] dark:bg-night-line"><i className="fa-solid fa-xmark" /></button>
            <h3 className="mb-1 pr-8 text-[18px] font-bold">
              {action.type === "delivered" ? "Mark as delivered" : "Mark as failed delivery"}
            </h3>
            <p className="mb-5 text-[12px] text-[#999]">{action.d.transaction_number} · {action.d.receiver}</p>

            {action.type === "delivered" ? (
              <div>
                <label className={labelCls} htmlFor="pod">Proof of delivery (photo)</label>
                <input id="pod" type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="block w-full text-[12px] file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-[12px] file:font-bold file:text-brand" />
                {busy && <p className="mt-2 text-[12px] text-[#999]">Preparing photo…</p>}
                {proof && <img src={proof} alt="Proof preview" className="mt-3 max-h-[220px] w-full rounded-xl border border-[#eee] object-contain dark:border-night-line" />}
              </div>
            ) : (
              <div>
                <label className={labelCls} htmlFor="reason">Reason</label>
                <select id="reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} className={inputCls}>
                  <option value="">Select a reason…</option>
                  {FAIL_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className={labelCls} htmlFor="note">Notes {action.type === "failed" && reason === "Other" ? "(required)" : "(optional)"}</label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={textareaCls} placeholder={action.type === "delivered" ? "e.g. Received by the recipient's sister" : "Add details if needed"} />
            </div>

            {error && <div className="mt-4"><Notice tone="error" icon="fa-circle-exclamation" role="alert">{error}</Notice></div>}

            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={close} className={btnGhost}>Cancel</button>
              <button onClick={confirm} disabled={busy} className={btnPrimary}>
                {action.type === "delivered" ? "Confirm delivered" : "Confirm failed"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Malaking proof */}
      <Modal open={!!viewer} onClose={() => setViewer(null)} z="z-[3500]" className="w-full max-w-[520px] p-5 dark:bg-night-panel">
        {viewer && (
          <>
            <button onClick={() => setViewer(null)} aria-label="Close" className="absolute right-3 top-3 h-8 w-8 rounded-full bg-[#f4f6f8] text-[#7c8da0] dark:bg-night-line"><i className="fa-solid fa-xmark" /></button>
            <p className="mb-3 pr-8 text-[13px] font-bold">{viewer.transaction_number} · Proof of delivery</p>
            <img src={viewer.proof} alt="Proof of delivery" className="max-h-[70vh] w-full rounded-xl object-contain" />
            <p className="mt-2 text-[11px] text-[#999]">{formatDate(viewer.doneAt)}</p>
          </>
        )}
      </Modal>
    </>
  );
}
