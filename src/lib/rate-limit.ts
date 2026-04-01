type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const bucketsByNamespace = new Map<string, Map<string, RateLimitBucket>>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function limitByIp(
  request: Request,
  namespace: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const clientIp = getClientIp(request);

  let namespaceBuckets = bucketsByNamespace.get(namespace);
  if (!namespaceBuckets) {
    namespaceBuckets = new Map<string, RateLimitBucket>();
    bucketsByNamespace.set(namespace, namespaceBuckets);
  }

  const existing = namespaceBuckets.get(clientIp);

  if (!existing || existing.resetAt <= now) {
    namespaceBuckets.set(clientIp, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;
  namespaceBuckets.set(clientIp, existing);

  return { allowed: true, retryAfterSeconds: 0 };
}
