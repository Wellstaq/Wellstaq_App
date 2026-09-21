/** Shared upload vocabulary — one source of truth for the post and story
 *  composers, so the two cannot disagree about what is acceptable.
 *
 *  Every file in a batch is checked *before* any upload starts, so a bad file
 *  is refused at the picker (by name) rather than partway through the batch. */

/** The API allows 15 attachments per post (`media_urls`, maxItems: 15). */
export const MAX_POST_ATTACHMENTS = 15;

/** HANDOFF: the server does not document an upload size limit, and the
 *  presigned PUT goes to object storage rather than the API, so the real cap is
 *  not discoverable from the client. This mirrors the mobile app's 20 MB, which
 *  is tight for video — confirm the true limit with the API owner and set this
 *  constant from it. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type MediaKind = "image" | "video";

/** The `media_type` the API expects, derived from the file rather than assumed
 *  from which picker was used. */
export function mediaKindOf(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export interface UploadRejection {
  file: File;
  reason: string;
}

/** Checks every file up front. Returns the first rejection, naming the file, or
 *  null when the whole batch is safe to upload. */
export function findUploadRejection(
  files: File[],
  options: { allow?: MediaKind[] } = {},
): UploadRejection | null {
  const allow = options.allow ?? ["image", "video"];
  for (const file of files) {
    const kind = mediaKindOf(file);
    if (!kind || !allow.includes(kind)) {
      return {
        file,
        reason: `“${file.name}” isn’t a supported file. Choose ${allow.join(" or ")} files.`,
      };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        file,
        reason: `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      };
    }
  }
  return null;
}

/** A file chosen in the composer. `mediaUrl` stays null until its upload
 *  finishes, which is what the composer shows a spinner for. */
export interface PostAttachment {
  id: string;
  name: string;
  kind: MediaKind;
  previewUrl: string;
  mediaUrl: string | null;
}

const VIDEO_EXTENSION = /\.(mp4|mov|m4v|webm|ogv|avi|mkv)(\?|#|$)/i;
const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|svg)(\?|#|$)/i;

/** A post carries one `media_type` for the whole set, so per-attachment type is
 *  read from the URL first and only falls back to that shared value. */
export function looksLikeVideo(url: string, fallbackType?: string | null): boolean {
  if (VIDEO_EXTENSION.test(url)) return true;
  if (IMAGE_EXTENSION.test(url)) return false;
  return fallbackType === "video";
}

/** Attachments in render order: `media_urls` when present, else the legacy
 *  single `media_url`. */
export function postMediaUrls(post: { mediaUrls?: string[] | null; mediaUrl?: string | null }): string[] {
  if (post.mediaUrls?.length) return post.mediaUrls;
  return post.mediaUrl ? [post.mediaUrl] : [];
}
