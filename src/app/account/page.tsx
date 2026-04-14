import AccountDetails from "@/components/AccountDetails";
import { getServerViewer } from "@/lib/server-auth";
import { redirect } from "next/navigation";

async function accountDetails() {
  const viewer = await getServerViewer();
  if (!viewer) {
    redirect("/login?from=/account");
  }

  if (viewer.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border border-red-300/60 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-red-800">
            Account suspended
          </h2>
          <p className="mb-3 text-red-700">
            Your account is currently suspended and account management is
            unavailable.
          </p>
          {viewer.bannedReason && (
            <p className="rounded-lg border border-red-200/70 bg-white/70 px-3 py-2 text-sm text-red-700">
              Reason: {viewer.bannedReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <AccountDetails />
    </>
  );
}

export default accountDetails;
