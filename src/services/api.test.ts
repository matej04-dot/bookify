import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFetch } from "./api";

function TestComponent({ url }: { url: string }) {
  const { data, loading, error } = useFetch<any>(url);
  if (loading) return React.createElement("div", null, "loading");
  if (error) return React.createElement("div", null, `error: ${String(error?.message ?? error)}`);
  return React.createElement("div", null, `data: ${JSON.stringify(data)}`);
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  (globalThis as any).fetch = undefined;
});

test("useFetch calls fetch and returns data for given URL", async () => {
  (globalThis as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, payload: { id: 1 } }),
  });

  render(React.createElement(TestComponent, { url: "/api/test-endpoint" }));

  await waitFor(() => expect(screen.getByText(/^data:/)).toBeInTheDocument());
  expect(screen.getByText(/"success":true/)).toBeInTheDocument();
  expect((globalThis as any).fetch).toHaveBeenCalledWith("/api/test-endpoint", expect.any(Object));
});

test("useFetch handles non-ok http response", async () => {
  (globalThis as any).fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    json: async () => ({}),
  });

  render(React.createElement(TestComponent, { url: "/api/error" }));

  await waitFor(() => expect(screen.getByText(/^error:/)).toBeInTheDocument());
  expect(screen.getByText(/500/)).toBeInTheDocument();
});

test("useFetch handles network error", async () => {
  (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error("network fail"));

  render(React.createElement(TestComponent, { url: "/api/fail" }));

  await waitFor(() => expect(screen.getByText(/^error:/)).toBeInTheDocument());
  expect(screen.getByText(/network fail/)).toBeInTheDocument();
});

test("useFetch does not update state after unmount", async () => {
  let resolveFetch: (v: any) => void;
  (globalThis as any).fetch = jest.fn().mockImplementation(
    () => new Promise((res) => (resolveFetch = res))
  );

  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { unmount } = render(React.createElement(TestComponent, { url: "/api/slow" }));
  unmount();
  resolveFetch!({ ok: true, json: async () => ({ late: true }) });

  await new Promise((r) => setTimeout(r, 20));
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
});