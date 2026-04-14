import { getClientAuth, hasFirebaseClientConfig } from "../firebase-config";
import type { WishlistItem, WishlistPayload } from "../types/Types";

async function getIdTokenOrThrow() {
  if (!hasFirebaseClientConfig()) {
    throw new Error("Missing Firebase client configuration");
  }

  const auth = getClientAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user.getIdToken();
}

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const idToken = await getIdTokenOrThrow();
  const response = await fetch("/api/wishlist", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to fetch wishlist");
  }

  const payload = (await response.json()) as WishlistItem[];
  return Array.isArray(payload) ? payload : [];
}

export async function addWishlistItem(data: WishlistPayload) {
  const idToken = await getIdTokenOrThrow();
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to add wishlist item");
  }

  return response.json();
}

export async function removeWishlistItem(bookID: string) {
  const idToken = await getIdTokenOrThrow();
  const response = await fetch(`/api/wishlist/${encodeURIComponent(bookID)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to remove wishlist item");
  }

  return response.json();
}

export async function isBookInWishlist(bookID: string): Promise<boolean> {
  const idToken = await getIdTokenOrThrow();
  const response = await fetch(`/api/wishlist/${encodeURIComponent(bookID)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to check wishlist");
  }

  const payload = (await response.json()) as { inWishlist?: boolean };
  return payload?.inWishlist === true;
}
