import { Link, useLocation } from "react-router-dom";
import { useT } from "../store/prefs.js";
import useBase from "../hooks/useBase.js";

// Pangalan ng bawat bahagi ng URL para sa breadcrumbs
const names = {
  dashboard: "Dashboard",
  parcels: "Parcels",
  reports: "Reports",
  verification: "Verification",
  riders: "Riders",
  sellers: "Sellers",
  messages: "Messages",
  complaints: "Complaints",
  announcements: "Announcements",
  notifications: "Notifications",
  analytics: "Analytics",
  audit: "Audit Log",
  accounts: "Accounts",
  activity: "Activity Log",
  settings: "Settings",
  seller: "Seller Portal",
  rider: "Rider Portal",
  create: "Create Parcel",
  scan: "Scan QR",
  pending: "To Be Delivered",
  deliveries: "To Be Delivered",
  delivered: "Delivered",
  failed: "Failed Delivery",
  about: "About Us",
  contact: "Contact",
  help: "Help",
};

// Page header: breadcrumbs + title + subtitle (+ optional `children` na buttons sa kanan)
export default function Topbar({ title, subtitle, children }) {
  const t = useT();
  const base = useBase(); // "" (Coordinator) | "/seller" | "/rider"
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = [{ label: t("Home"), to: base || "/dashboard" }];
  parts.forEach((p, i) => {
    if (p === "dashboard" || (base && i === 0)) return;
    crumbs.push({
      label: names[p] ? t(names[p]) : decodeURIComponent(p),
      to: i < parts.length - 1 ? "/" + parts.slice(0, i + 1).join("/") : null,
    });
  });

  return (
    <header className="mb-7 flex items-end justify-between gap-4 flex-wrap print:hidden">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#999]">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <i className="fa-solid fa-chevron-right text-[8px]" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-brand">{c.label}</Link>
              ) : (
                <span className="font-semibold text-[#666] dark:text-[#d1c9c2]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="text-[27px] font-bold mb-1.5">{t(title)}</h1>
        {subtitle && <p className="text-[13px] text-[#999]">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
    </header>
  );
}
