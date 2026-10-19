import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import Pagination from "../components/Pagination.jsx";
import ScanPanel from "../components/qr/ScanPanel.jsx";
import { EmptyState, Modal } from "../components/ui.jsx";
import { btnDanger, btnGhost, btnPrimary, inputCls, panel, td, textareaCls, th } from "../components/styles.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { decideParcel, findParcel, getCoordinatorParcel, getVideoUrl, listParcels } from "../services/parcelService.js";
import { logAction } from "../store/audit.js";
import { toast } from "../store/toast.js";
import { formatDate, formatSize } from "../utils/format.js";
import { statusInfo } from "../utils/parcelStatus.js";

const PAGE_SIZE = 8;
const FILTERS = ["VIDEO_SUBMITTED", "ALL", "VERIFIED", "REUPLOAD_REQUESTED", "REJECTED", "WAITING_FOR_VIDEO"];

// Verification ng coordinator. Lahat ay galing sa totoong backend:
//   listahan: GET /api/parcels | hanapin: GET /api/parcels/by-transaction/:txn
//   detalye: GET /api/parcels/coordinator/:id | video: GET /api/parcels/videos/:videoId
//   desisyon: POST /api/parcels/coordinator/:id/(verify | reject | request-reupload)
export default function Verification() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("VIDEO_SUBMITTED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [scanOpen, setScanOpen] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null); // { parcel, videos, verification_records }
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [videoId, setVideoId] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const urlRef = useRef("");

  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listParcels()
      .then(setParcels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const count = (s) => parcels.filter((p) => p.status === s).length;
  const summary = [
    { label: "Under verification", value: count("VIDEO_SUBMITTED"), icon: "fa-hourglass-half", tone: "bg-[#edf4ff] text-[#4b78b5]" },
    { label: "Verified", value: count("VERIFIED"), icon: "fa-check", tone: "bg-[#eaf8ef] text-[#25a35a]" },
    { label: "Reupload requested", value: count("REUPLOAD_REQUESTED"), icon: "fa-rotate-left", tone: "bg-[#fff0e7] text-[#ff6818]" },
    { label: "Rejected", value: count("REJECTED"), icon: "fa-ban", tone: "bg-[#fff0f0] text-[#d94747]" },
  ];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parcels.filter(
      (p) =>
        (filter === "ALL" || p.status === filter) &&
        (!q || [p.parcel_id, p.transaction_number, p.seller_name, p.receiver_name].some((v) => String(v || "").toLowerCase().includes(q)))
    );
  }, [parcels, filter, search]);
  useEffect(() => setPage(1), [filter, search]);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- video: kunin bilang blob (may token) at linisin ang lumang URL
  const releaseVideo = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
    setVideoUrl("");
  };

  const playVideo = async (id) => {
    releaseVideo();
    setVideoId(id);
    setVideoError("");
    setVideoLoading(true);
    try {
      const url = await getVideoUrl(id);
      urlRef.current = url;
      setVideoUrl(url);
    } catch (e) {
      setVideoError(e.message);
    } finally {
      setVideoLoading(false);
    }
  };
  useEffect(() => releaseVideo, []);

  const applyDetail = (data) => {
    setDetail(data);
    setRemarks("");
    setRemarksError("");
    const latest = data.videos?.[0];
    if (latest) playVideo(latest.video_id);
    else {
      releaseVideo();
      setVideoId(null);
    }
  };

  const openParcel = async (loader) => {
    setOpen(true);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    releaseVideo();
    setVideoId(null);
    try {
      applyDetail(await loader());
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const review = (p) => openParcel(() => getCoordinatorParcel(p.parcel_id));

  const onScanValue = async (value) => {
    setLooking(true);
    setLookupError("");
    try {
      const data = await findParcel(value, "coordinator");
      setScanOpen(false);
      setOpen(true);
      setDetailError("");
      applyDetail(data);
    } catch (e) {
      setLookupError(e.message);
    } finally {
      setLooking(false);
    }
  };

  const close = () => {
    setOpen(false);
    releaseVideo();
  };

  const decide = async (action, label) => {
    const needsRemarks = action !== "verify";
    if (needsRemarks && !remarks.trim()) return setRemarksError("Please write remarks so the seller knows why.");
    setDeciding(true);
    try {
      const id = detail.parcel.parcel_id;
      await decideParcel(id, action, remarks.trim());
      logAction({ category: "Verification", action: label, target: id, detail: remarks.trim() });
      toast(`${label}: ${id}`);
      applyDetail(await getCoordinatorParcel(id));
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeciding(false);
    }
  };

  const p = detail?.parcel;
  const canDecide = p?.status === "VIDEO_SUBMITTED" && detail?.videos?.length > 0;

  return (
    <>
      <Topbar title="Verification" subtitle="Review seller video proofs and decide on each parcel.">
        <button className={btnGhost} onClick={load}><i className="fa-solid fa-rotate" /> Refresh</button>
        <button className={btnPrimary} onClick={() => { setScanOpen((v) => !v); setLookupError(""); }}>
          <i className="fa-solid fa-qrcode" /> {scanOpen ? "Close scanner" : "Scan parcel QR"}
        </button>
      </Topbar>

      {scanOpen && (
        <section className={`${panel} p-6 mb-6`}>
          <ScanPanel onValue={onScanValue} busy={looking} btnClass="bg-brand hover:bg-brand-dark" inputClass="focus:ring-brand/20" />
          {lookupError && <p role="alert" className="mt-4 rounded-lg bg-[#fff1f1] px-4 py-3 text-sm text-[#d94a4a]">{lookupError}</p>}
        </section>
      )}

      <section className="grid grid-cols-4 gap-5 mb-7 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {summary.map((s) => (
          <div key={s.label} className={`${panel} p-6 flex items-center gap-4`}>
            <span className={`w-[54px] h-[54px] shrink-0 rounded-2xl flex items-center justify-center text-[22px] ${s.tone}`}><i className={`fa-solid ${s.icon}`} /></span>
            <div><small className="text-[12px] text-[#999]">{s.label}</small><strong className="block text-[26px] leading-tight">{loading ? "…" : s.value}</strong></div>
          </div>
        ))}
      </section>

      <section className={`${panel} p-6`}>
        <div className="mb-4 flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parcel ID, transaction no., seller, receiver" aria-label="Search" className={`${inputCls} !w-auto min-w-[260px] flex-1`} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Status filter" className={`${inputCls} !w-[210px]`}>
            {FILTERS.map((f) => <option key={f} value={f}>{f === "ALL" ? "All statuses" : statusInfo(f).label}</option>)}
          </select>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff1f1] px-4 py-3 text-sm text-[#d94a4a]">{error} <button onClick={load} className="font-semibold underline">Try again</button></p>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{["Parcel ID", "Transaction no.", "Seller", "Receiver", "Status", "Updated", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className={`${td} text-center text-[#999]`}>Loading…</td></tr>}
              {!loading && visible.map((r) => (
                <tr key={r.parcel_id}>
                  <td className={`${td} font-mono text-[12px]`}>{r.parcel_id}</td>
                  <td className={td}>{r.transaction_number || "—"}</td>
                  <td className={td}>{r.seller_name}</td>
                  <td className={td}>{r.receiver_name}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                  <td className={`${td} whitespace-nowrap text-[#999]`}>{formatDate(r.updated_at)}</td>
                  <td className={`${td} text-right`}><button className={btnGhost} onClick={() => review(r)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && (
          <EmptyState icon="fa-clipboard-check" title={parcels.length ? "No parcels match your filters" : "No parcels yet"} text={filter === "VIDEO_SUBMITTED" ? "Nothing is waiting for verification." : ""} />
        )}
        {!loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />}
      </section>

      {/* WORKSPACE */}
      <Modal open={open} onClose={close} className="w-full max-w-[860px] max-h-[92vh] overflow-y-auto p-7 dark:bg-night-panel">
        <button onClick={close} aria-label="Close" className="absolute top-[15px] right-[17px] w-8 h-8 rounded-full bg-[#f4f6f8] text-[#7c8da0] text-[21px] leading-none dark:bg-night-head">×</button>

        {detailLoading && <p className="py-16 text-center text-[#999]">Loading parcel…</p>}
        {detailError && <p role="alert" className="py-10 text-center text-[#d94a4a]">{detailError}</p>}

        {p && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3 pr-10">
              <h2 className="text-[20px] font-bold font-mono">{p.parcel_id}</h2>
              <StatusBadge status={p.status} />
            </div>

            <dl className="mb-5 grid grid-cols-2 gap-4 text-[13px] max-[600px]:grid-cols-1">
              {[
                ["Transaction number", p.transaction_number],
                ["Seller", `${p.seller_name} (${p.seller_email})`],
                ["Receiver", p.receiver_name],
                ["Receiver contact", p.receiver_contact],
                ["Contents", p.contents],
                ["Created", formatDate(p.created_at)],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-[11px] uppercase text-[#999]">{k}</dt><dd className="break-all font-medium">{v || "—"}</dd></div>
              ))}
            </dl>

            <h3 className="mb-2 text-[14px] font-bold">Video proof</h3>
            {detail.videos.length === 0 ? (
              <p className="mb-5 rounded-lg bg-[#f7f7f7] p-4 text-[13px] text-[#888] dark:bg-night-head">The seller has not uploaded a video yet.</p>
            ) : (
              <div className="mb-5">
                <div className="mb-2 flex flex-wrap gap-2">
                  {detail.videos.map((v, i) => (
                    <button key={v.video_id} onClick={() => playVideo(v.video_id)} className={`${videoId === v.video_id ? "border-brand text-brand" : "border-[#e5e5e5] text-[#777]"} rounded-lg border px-3 py-1.5 text-[12px]`}>
                      {i === 0 ? "Latest" : `Older #${detail.videos.length - i}`} · {formatDate(v.uploaded_at)}
                    </button>
                  ))}
                </div>
                {videoLoading && <p className="py-10 text-center text-[13px] text-[#999]">Loading video…</p>}
                {videoError && <p role="alert" className="rounded-lg bg-[#fff1f1] px-4 py-3 text-[13px] text-[#d94a4a]">{videoError}</p>}
                {videoUrl && <video key={videoUrl} src={videoUrl} controls className="max-h-[360px] w-full rounded-xl bg-black" />}
                {videoId && (() => { const v = detail.videos.find((x) => x.video_id === videoId); return v ? <p className="mt-1 text-[11px] text-[#999]">{v.file_name} · {formatSize(v.file_size)}</p> : null; })()}
              </div>
            )}

            {detail.verification_records.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-2 text-[14px] font-bold">Decision history</h3>
                <ul className="space-y-2 text-[12px]">
                  {detail.verification_records.map((r) => (
                    <li key={r.verification_id} className="rounded-lg bg-[#f7f7f7] p-3 dark:bg-night-head">
                      <strong>{r.decision.replace("_", " ")}</strong> by {r.coordinator_name} · {formatDate(r.verified_at)}
                      {r.remarks && <p className="mt-1 whitespace-pre-wrap text-[#777]">{r.remarks}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canDecide ? (
              <div>
                <label htmlFor="remarks" className="mb-1.5 block text-[12px] font-semibold">Remarks <span className="font-normal text-[#999]">(required for reject or reupload)</span></label>
                <textarea id="remarks" rows={3} value={remarks} onChange={(e) => { setRemarks(e.target.value); setRemarksError(""); }} className={textareaCls} placeholder="e.g. The video is too dark. Please record the sealing again." />
                {remarksError && <p role="alert" className="mt-1 text-[12px] text-[#d94a4a]">{remarksError}</p>}
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button disabled={deciding} className={btnPrimary} onClick={() => decide("verify", "Verified parcel")}><i className="fa-solid fa-check" /> Verify</button>
                  <button disabled={deciding} className={btnGhost} onClick={() => decide("request-reupload", "Requested reupload")}><i className="fa-solid fa-rotate-left" /> Request reupload</button>
                  <button disabled={deciding} className={btnDanger} onClick={() => decide("reject", "Rejected parcel")}><i className="fa-solid fa-ban" /> Reject</button>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-[#f7f7f7] p-3 text-[12px] text-[#888] dark:bg-night-head">
                {p.status === "VIDEO_SUBMITTED" ? "No video to review." : `No decision needed. Current status: ${statusInfo(p.status).label}.`}
              </p>
            )}

            <div className="mt-5 text-right">
              <Link to={`/messages?contact=${p.seller_id}`} onClick={close} className="text-[13px] text-brand hover:underline"><i className="fa-regular fa-message mr-1" />Message seller</Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
