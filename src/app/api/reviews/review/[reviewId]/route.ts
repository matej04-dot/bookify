import { normalizeRouteParam } from "@/lib/ids";
import { handlePatchReviewRequest } from "@/lib/review-update";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ reviewId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { reviewId: rawReviewId = "" } = await context.params;
  const reviewId = normalizeRouteParam(rawReviewId);
  return handlePatchReviewRequest(request, reviewId);
}
