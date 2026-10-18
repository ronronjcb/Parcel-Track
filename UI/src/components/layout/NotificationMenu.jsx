import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useClickOutside from "../../hooks/useClickOutside.js";
import { markAllPortalRead, markPortalRead, usePortalNotifications } from "../../store/portalNotifications.js";
import { timeAgo } from "../../store/notifications.js";
import { toPath } from "./navConfig.js";

const iconBtn =
  "relative w-[40px] h-[40px] rounded-full bg-[#f5f5f5] text-[#555] hover:bg-brand-soft hover:text-brand transition dark:bg-night-line dark:text-[#d1c9c2]";

// Bell sa header ng Seller/Rider. Parehong data ng Notifications page (tingnan ang store/portalNotifications.js).
export default function NotificationMenu({ role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { items, unread, reload } = usePortalNotifications(role);
  useClickOutside(ref, () => setOpen(false), open);

  const go = (n) => {
    markPortalRead(n.id);
    setOpen(false);
    if (n.to) navigate(n.to);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          reload();
        }}
        aria-label={`Notifications${unread ? `, ${unread} new` : ""}`}
        aria-expanded={open}
        className={iconBtn}
      >
        <i className="fa-regular fa-bell" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[340px] max-w-[calc(100vw-30px)] overflow-hidden rounded-[14px] border border-[#eee] bg-white shadow-[0_18px_50px_rgba(0,0,0,.15)] animate-popup dark:border-night-line dark:bg-night-panel">
          <div className="flex items-center justify-between border-b border-[#f1f1f1] px-4 py-3 dark:border-night-line">
            <p className="text-[13px] font-bold">Notifications</p>
            {unread > 0 && (
              <button onClick={() => markAllPortalRead(items.map((n) => n.id))} className="text-[11px] font-semibold text-brand hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="p-8 text-center text-[13px] text-[#999]">You're all caught up.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <button onClick={() => go(n)} className={`flex w-full gap-3 px-4 py-3 text-left text-[13px] hover:bg-[#fff3e8] dark:hover:bg-night-line ${n.read ? "" : "bg-[#fffaf7] dark:bg-night-head"}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand dark:bg-night-head">
                      <i className={`fa-solid ${n.icon}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate">{n.title}</strong>
                      <span className="block truncate text-[11px] text-[#999]">{n.text}</span>
                      <small className="text-[10px] text-[#bbb]">{timeAgo(n.ts)}</small>
                    </span>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to={toPath(role, "notifications")} onClick={() => setOpen(false)} className="block border-t border-[#f1f1f1] px-4 py-3 text-center text-[12px] font-semibold text-brand hover:bg-[#fff3e8] dark:border-night-line dark:hover:bg-night-line">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
