import Topbar from "../components/Topbar.jsx";
import AuditTable from "../components/audit/AuditTable.jsx";

// Audit Log ng coordinator: LAHAT ng aksyon ng lahat ng role (galing sa backend).
export default function AuditLog() {
  return (
    <>
      <Topbar title="Audit Log" subtitle="Who did what, and when. Includes every seller, rider and coordinator action." />
      <AuditTable note="As coordinator, you can see everyone's activity." />
    </>
  );
}
