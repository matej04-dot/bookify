import AdminReviewList from "@/components/AdminReviewList";
import { getServerViewer } from "@/lib/server-auth";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserReviewsPage({ params }: PageProps) {
  const viewer = await getServerViewer();
  if (!viewer) {
    redirect("/login?from=/admin");
  }

  if (viewer.role !== "admin" || viewer.isBanned) {
    redirect("/");
  }

  const { userId } = await params;

  return <AdminReviewList userId={userId} />;
}
