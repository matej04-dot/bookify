import AdminReviewList from "@/components/AdminReviewList";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserReviewsPage({ params }: PageProps) {
  const { userId } = await params;

  return <AdminReviewList userId={userId} />;
}
