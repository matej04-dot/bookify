import AdminReviewList from "@/components/AdminReviewList";
import { AppPageProps } from "@/types/Types";

export default async function AdminUserReviewsPage({ params }: AppPageProps) {
  const { userId } = await params;

  return <AdminReviewList userId={userId} />;
}
