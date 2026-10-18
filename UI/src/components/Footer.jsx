import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "./ui.jsx";
import { useT } from "../store/prefs.js";
import useBase from "../hooks/useBase.js";

// Quick links ng bawat role (Coordinator = walang base)
const QUICK = {
  "": [["/dashboard", "Home"], ["/parcels", "Parcels"], ["/reports", "Reports"], ["/verification", "Verification"]],
  "/seller": [["", "Home"], ["/parcels", "Parcel Records"], ["/create", "Create Parcel"], ["/scan", "Scan QR / Upload Video"]],
  "/rider": [["", "Home"], ["/scan", "Scan QR Code"], ["/messages", "Messages"]],
};

const legal = {
  Terms: "By using ParcelTrack you agree to use the system only for legitimate parcel monitoring and verification. Accounts are personal and must not be shared. ParcelTrack may suspend accounts that misuse the system. (Sample text — replace with your project's official terms.)",
  Privacy: "ParcelTrack stores the information needed to verify and deliver parcels, such as names, contact details, addresses and seller videos. This data is used only for delivery operations and is not sold to third parties. (Sample text — replace with your project's official policy.)",
};

export default function Footer() {
  const t = useT();
  const base = useBase();
  const [doc, setDoc] = useState(null);
  const quick = QUICK[base].map(([to, l]) => [base ? `${base}${to}` || base : to, l]);
  const col = "text-[12px] text-[#888] hover:text-brand";

  return (
    <footer className="mt-14 pt-8 border-t border-[#e9e9e9] print:hidden dark:border-night-line">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-8 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-[34px] h-[34px] rounded-[9px] bg-brand text-white flex items-center justify-center"><i className="fa-solid fa-box" /></span>
            <strong className="text-[15px]">ParcelTrack</strong>
          </div>
          <p className="text-[12px] leading-relaxed text-[#888]">
            A parcel verification and delivery monitoring system for coordinators, sellers and riders.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wide">{t("Quick Links")}</h4>
          <ul className="space-y-2">
            {quick.map(([to, l]) => (
              <li key={to}><Link to={to} className={col}>{t(l)}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wide">ParcelTrack</h4>
          <ul className="space-y-2">
            {[["/about", "About Us"], ["/contact", "Contact"], ["/help", "Help"], ["/settings", "Settings"]].map(([to, l]) => (
              <li key={to}><Link to={`${base}${to}`} className={col}>{t(l)}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wide">{t("Contact")}</h4>
          <ul className="space-y-2 text-[12px] text-[#888]">
            <li><i className="fa-solid fa-envelope w-4 text-brand" /> support@parceltrack.example</li>
            <li><i className="fa-solid fa-phone w-4 text-brand" /> (02) 8123 4567</li>
            <li><i className="fa-solid fa-location-dot w-4 text-brand" /> Cavite State University, Cavite</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap mt-8 py-5 border-t border-[#eee] text-[11px] text-[#aaa] dark:border-night-line">
        <span>© 2026 ParcelTrack. All rights reserved.</span>
        <span className="flex gap-4">
          {Object.keys(legal).map((k) => (
            <button key={k} onClick={() => setDoc(k)} className="hover:text-brand">{k}</button>
          ))}
        </span>
      </div>

      <Modal open={!!doc} onClose={() => setDoc(null)} z="z-[4000]" className="w-full max-w-[460px] p-7 dark:bg-night-panel">
        <h3 className="text-[16px] font-bold mb-3">{doc}</h3>
        <p className="text-[13px] leading-relaxed text-[#777] dark:text-[#d1c9c2]">{doc && legal[doc]}</p>
        <button onClick={() => setDoc(null)} className="mt-5 px-4 py-2.5 rounded-lg bg-brand text-white text-[13px] font-bold">Close</button>
      </Modal>
    </footer>
  );
}
