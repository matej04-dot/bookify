/**
 * Performance monitoring utilities
 * Koristi se za praćenje cache hit rate i response times
 */

export const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  responseTimes: [] as number[],
};

export function trackCacheHit() {
  performanceMetrics.cacheHits++;
  performanceMetrics.totalRequests++;
}

export function trackCacheMiss() {
  performanceMetrics.cacheMisses++;
  performanceMetrics.totalRequests++;
}

export function trackResponseTime(time: number) {
  performanceMetrics.responseTimes.push(time);
}

export function getCacheHitRate(): number {
  if (performanceMetrics.totalRequests === 0) return 0;
  return (
    (performanceMetrics.cacheHits / performanceMetrics.totalRequests) * 100
  );
}

export function getAverageResponseTime(): number {
  if (performanceMetrics.responseTimes.length === 0) return 0;
  const sum = performanceMetrics.responseTimes.reduce((a, b) => a + b, 0);
  return sum / performanceMetrics.responseTimes.length;
}

export function resetMetrics() {
  performanceMetrics.cacheHits = 0;
  performanceMetrics.cacheMisses = 0;
  performanceMetrics.totalRequests = 0;
  performanceMetrics.responseTimes = [];
}

export function getMetricsReport() {
  return {
    cacheHitRate: `${getCacheHitRate().toFixed(2)}%`,
    averageResponseTime: `${getAverageResponseTime().toFixed(2)}ms`,
    totalRequests: performanceMetrics.totalRequests,
    cacheHits: performanceMetrics.cacheHits,
    cacheMisses: performanceMetrics.cacheMisses,
  };
}

// Development only - log metrics
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    (window as any).getPerformanceMetrics = getMetricsReport;
    console.log(
      "📊 Performance metrics available via window.getPerformanceMetrics()"
    );
  }
}
