import { randomUUID } from "node:crypto";

// Device identity for the protected-video concurrent-device limit. A random id is
// stored in an httpOnly SameSite=Lax cookie set by the server; it is never derived
// from anything client-controlled, so a device can't forge another device's slot.
export const DEVICE_COOKIE = "cy_dev";

/** Return the existing device id, or mint a fresh random one. */
export function getOrCreateDeviceId(existing?: string): string {
  return existing && existing.length > 0 ? existing : randomUUID();
}
