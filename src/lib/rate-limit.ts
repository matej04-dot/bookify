import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const bucketsByNamespace = new Map<string, Map<string, RateLimitBucket>>();
const MAX_BUCKETS_PER_NAMESPACE = 10_000;
const upstashRatelimiters = new Map<string, Ratelimit>();

function getUpstashRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

function getUpstashRatelimiter(
  namespace: string,
  maxRequests: number,
  windowMs: number,
): Ratelimit | null {
  const redis = getUpstashRedisClient();
  if (!redis) {
    return null;
  }

  const secondsWindow = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${namespace}:${maxRequests}:${secondsWindow}`;
  const existing = upstashRatelimiters.get(cacheKey);
  if (existing) {
    return existing;
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(maxRequests, `${secondsWindow} s`),
    prefix: `bookify:ratelimit:${namespace}`,
  });

  upstashRatelimiters.set(cacheKey, ratelimit);
  return ratelimit;
}

function isTrustedProxyEnabled() {
  return (
    process.env.TRUST_PROXY_HEADERS === "true" || process.env.VERCEL === "1"
  );
}

function normalizeIpCandidate(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  // Support IPv4 and IPv6 values, including bracketed IPv6 forms.
  const cleanCandidate = candidate.replace(/^\[|\]$/g, "");
  return isIP(cleanCandidate) ? cleanCandidate : null;
}

function readProxyIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  if (forwardedFor) {
    const candidates = forwardedFor.split(",");
    for (const value of candidates) {
      const normalized = normalizeIpCandidate(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  const realIp = request.headers.get("x-real-ip") || "";
  return normalizeIpCandidate(realIp);
}

function getClientIp(request: Request): string {
  if (isTrustedProxyEnabled()) {
    const proxyIp = readProxyIp(request);
    if (proxyIp) {
      return proxyIp;
    }
  }

  return "unknown";
}

function pruneNamespaceBuckets(
  namespaceBuckets: Map<string, RateLimitBucket>,
  now: number,
) {
  if (namespaceBuckets.size === 0) {
    return;
  }

  for (const [ip, bucket] of namespaceBuckets) {
    if (bucket.resetAt <= now) {
      namespaceBuckets.delete(ip);
    }
  }

  if (namespaceBuckets.size <= MAX_BUCKETS_PER_NAMESPACE) {
    return;
  }

  const sortedEntries = Array.from(namespaceBuckets.entries()).sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  const toRemove = namespaceBuckets.size - MAX_BUCKETS_PER_NAMESPACE;

  for (let index = 0; index < toRemove; index += 1) {
    namespaceBuckets.delete(sortedEntries[index][0]);
  }
}

export async function limitByIp(
  request: Request,
  namespace: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const clientIp = getClientIp(request);

  try {
    const distributedLimiter = getUpstashRatelimiter(
      namespace,
      maxRequests,
      windowMs,
    );

    if (distributedLimiter && clientIp !== "unknown") {
      const result = await distributedLimiter.limit(clientIp);
      return {
        allowed: result.success,
        retryAfterSeconds: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - now) / 1000)),
      };
    }
  } catch {
    // Fallback to in-memory limiter if distributed backend is unavailable.
  }

  let namespaceBuckets = bucketsByNamespace.get(namespace);
  if (!namespaceBuckets) {
    namespaceBuckets = new Map<string, RateLimitBucket>();
    bucketsByNamespace.set(namespace, namespaceBuckets);
  } else {
    pruneNamespaceBuckets(namespaceBuckets, now);
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
