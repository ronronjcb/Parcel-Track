import { useState } from "react";
import Topbar from "../../components/Topbar.jsx";
import LogoutModal from "../../components/LogoutModal.jsx";
import UserAvatar from "../../components/Avatar.jsx";
import { DetailList, PanelTitle } from "../../components/portal.jsx";
import { btnDanger, panel } from "../../components/styles.js";
import { getUser } from "../../api.js";
import { setPrefs, toggleDark, usePrefs } from "../../store/prefs.js";

const SIZES = [["sm", "Small"], ["md", "Medium"], ["lg", "Large"]];

// Profile + itsura + logout para sa Seller at Rider. Walang token o password hash na ipinapakita.
export default function SettingsPage() {
  const user = getUser();
  const { dark, fontSize } = usePrefs();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <Topbar title="Settings" subtitle="Your account and appearance." />

      <div className="grid max-w-5xl grid-cols-2 items-start gap-6 max-[1000px]:grid-cols-1">
        <section className={`${panel} p-[30px] max-[600px]:p-5`}>
          <PanelTitle icon="fa-user">Profile</PanelTitle>
          <div className="mb-6 flex items-center gap-4">
            <UserAvatar className="h-[64px] w-[64px] text-[24px]" />
            <div className="min-w-0">
              <strong className="block truncate text-[16px]">{user?.name}</strong>
              <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold capitalize text-brand dark:bg-night-head">{user?.role}</span>
            </div>
          </div>
          <DetailList rows={[["Name", user?.name], ["Email", user?.email], ["Role", user?.role], ["User ID", user?.user_id]]} />
          <p className="mt-5 text-[11px] text-[#999]">Editing your profile or password is not supported by the backend yet.</p>
        </section>

        <div className="space-y-6">
          <section className={`${panel} p-[30px] max-[600px]:p-5`}>
            <PanelTitle icon="fa-palette">Appearance</PanelTitle>

            <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-[#edf0f4] pb-4 dark:border-night-line">
              <span>
                <strong className="block text-[13px]">Dark mode</strong>
                <span className="text-[11px] text-[#999]">Easier on the eyes at night.</span>
              </span>
              <input type="checkbox" checked={dark} onChange={toggleDark} className="h-5 w-5 accent-[#ff6818]" />
            </label>

            <div className="pt-4">
              <strong className="block text-[13px]">Text size</strong>
              <div className="mt-3 flex gap-2">
                {SIZES.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPrefs({ fontSize: key })}
                    aria-pressed={fontSize === key}
                    className={`rounded-lg border px-4 py-2 text-[12px] font-semibold transition ${
                      fontSize === key
                        ? "border-brand bg-brand text-white"
                        : "border-[#e5e5e5] bg-white text-[#555] hover:border-brand hover:text-brand dark:border-night-line dark:bg-night-head dark:text-[#d1c9c2]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <button onClick={() => setLogoutOpen(true)} className={btnDanger}>
            <i className="fa-solid fa-right-from-bracket" /> Logout
          </button>
        </div>
      </div>
      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
