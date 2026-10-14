/* ═══════════════════════════════════════════════════════════════════════════
   CLOUDINARY — server-side only.

   Admin-uploaded images (client logos and work-card images) are hosted on
   Cloudinary. The API secret can sign uploads as well as delete assets, so it
   must never reach the browser. Everything here runs inside the upload route
   handler; do NOT import this from a "use client" file, or Next would inline
   the secret into the browser bundle.

   Deliberately dependency-free: the whole integration is the Cloudinary REST
   API plus a SHA-1 signature built with node:crypto. That keeps the install
   lean and the signed request easy to read.

   If the env vars are missing the app still runs — uploads return a clear
   error and the rest of the site is unaffected.
   ═══════════════════════════════════════════════════════════════════════ */

import "server-only";
import { createHash, randomBytes } from "node:crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/** Folder new uploads are filed under — the "veyra" key name. */
const FOLDER = process.env.CLOUDINARY_FOLDER ?? "veyra";

export const isCloudinaryConfigured = Boolean(
  CLOUD_NAME && API_KEY && API_SECRET
);

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

const API_BASE = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

/**
 * Cloudinary signs the request with a SHA-1 of every parameter (except `file`,
 * `api_key`, `cloud_name`, `resource_type` and `signature`), sorted
 * alphabetically and joined as `key=value&...`, with the API secret appended
 * raw. See https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
function sign(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + API_SECRET).digest("hex");
}

/**
 * Pulls the Cloudinary public id back out of a delivery URL so a removed image
 * can be destroyed. Returns null for anything that isn't one of our Cloudinary
 * assets — a bundled default such as /work/*.png, or a legacy Supabase URL —
 * which the caller then leaves untouched.
 */
export function cloudinaryPublicId(src: string): string | null {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (!/(^|\.)res\.cloudinary\.com$/i.test(url.hostname)) return null;

  const marker = "/image/upload/";
  const at = url.pathname.indexOf(marker);
  if (at === -1) return null;

  let rest = url.pathname.slice(at + marker.length);
  rest = rest.replace(/^v\d+\//, ""); // drop the version segment
  rest = rest.replace(/\.[A-Za-z0-9]+$/, ""); // drop the file extension
  if (!rest || rest.includes("..")) return null;
  return decodeURIComponent(rest);
}

type UploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

/**
 * Uploads an image and returns its public delivery URL.
 *
 * A fresh public id is generated per upload. That matters: re-uploading a logo
 * under the same name would leave any CDN or browser cache keyed on the old
 * URL serving the stale image. A unique id sidesteps it entirely.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured — see .env.local.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported image type "${file.type}". Use JPG, PNG, WebP, GIF, AVIF or SVG.`
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 4 MB.`
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `u-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const signature = sign({ folder: FOLDER, public_id: publicId, timestamp });

  const form = new FormData();
  form.append("file", new Blob([await file.arrayBuffer()], { type: file.type }), "upload");
  form.append("api_key", API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", FOLDER);
  form.append("public_id", publicId);
  form.append("signature", signature);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/image/upload`, { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach Cloudinary — check your connection.");
  }

  const data = (await res.json().catch(() => ({}))) as UploadResponse;
  if (!res.ok || !data.secure_url) {
    throw new Error(
      data.error?.message || `Cloudinary upload failed (HTTP ${res.status}).`
    );
  }
  return data.secure_url;
}

/** Best-effort removal of a previously uploaded image. */
export async function deleteImage(src: string): Promise<void> {
  if (!isCloudinaryConfigured) return;
  const publicId = cloudinaryPublicId(src);
  if (!publicId) return; // a bundled default or legacy URL — leave it alone

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: API_KEY,
    timestamp: String(timestamp),
    signature,
  });

  // The content is already saved by the time this runs, so a failure here must
  // not surface as a failed removal. Log it instead of swallowing it silently.
  try {
    const res = await fetch(`${API_BASE}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(
        `[veyra] could not delete "${publicId}": HTTP ${res.status} ${detail}`.trim()
      );
    }
  } catch (e) {
    console.warn(
      `[veyra] could not delete "${publicId}": ${
        e instanceof Error ? e.message : "network error"
      }`
    );
  }
}
