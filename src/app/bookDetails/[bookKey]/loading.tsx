export default function Loading() {
  return (
    <div className="animate-pulse bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-48 md:w-56">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <div className="aspect-[2/3] w-full rounded-lg bg-muted"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div className="h-9 w-3/4 rounded-lg bg-muted"></div>

            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-muted"></div>
              <div className="h-5 w-1/3 rounded bg-muted"></div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-5 w-5 rounded bg-muted"></div>
                ))}
              </div>
              <div className="h-4 w-16 rounded bg-muted"></div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded bg-muted"></div>
                <div className="h-5 w-32 rounded bg-muted"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted"></div>
                <div className="h-4 w-full rounded bg-muted"></div>
                <div className="h-4 w-5/6 rounded bg-muted"></div>
                <div className="h-4 w-4/6 rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-1 rounded-full bg-muted"></div>
          <div className="h-6 w-40 rounded bg-muted"></div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
            <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
              <div className="aspect-square w-24 rounded-lg bg-muted sm:w-28"></div>
              <div className="mt-3 space-y-2 w-full">
                <div className="mx-auto h-5 w-24 rounded bg-muted sm:mx-0"></div>
                <div className="mx-auto h-3 w-20 rounded bg-muted sm:mx-0"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-full rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted"></div>
                  <div className="h-4 w-full rounded bg-muted"></div>
                  <div className="h-4 w-3/4 rounded bg-muted"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 mb-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-1 rounded-full bg-muted"></div>
          <div className="h-6 w-24 rounded bg-muted"></div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 h-5 w-32 rounded bg-muted"></div>
          <div className="mb-3 h-24 w-full rounded bg-muted"></div>
          <div className="h-10 w-28 rounded bg-muted"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded bg-muted"></div>
                  <div className="h-3 w-16 rounded bg-muted"></div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 w-4 rounded bg-muted"></div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted"></div>
                <div className="h-4 w-4/5 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
