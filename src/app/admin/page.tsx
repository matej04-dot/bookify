import AdminPanel from "@/components/AdminPanel";
import { getServerViewer } from "@/lib/server-auth";
import { redirect } from "next/navigation";

async function AdminPanelPage() {
  const viewer = await getServerViewer();
  if (!viewer) {
    redirect("/login?from=/admin");
  }

  if (viewer.role !== "admin" || viewer.isBanned) {
    redirect("/");
  }

  return <AdminPanel />;
}

export default AdminPanelPage;
