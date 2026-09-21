import { toast } from "sonner";
import { api } from "@/services/api";
import type { Post } from "@/types/api";

/** Publishing outlives the composer that started it: the work runs here, in
 *  module scope, so leaving the Space page does not cancel a post that is still
 *  uploading. The result is announced on `window` for whichever screen is still
 *  listening, and as a toast for the person, wherever they have got to. */

export const POST_PUBLISHED_EVENT = "wellstaq:post-published";
export const POST_FAILED_EVENT = "wellstaq:post-failed";

/** Everything the composer needs back if publishing fails, so a typed-out post
 *  is not lost. Attachments cannot be restored — the file inputs are gone — and
 *  the failure names the offending file instead. */
export interface PostDraft {
  content: string;
  location: string | null;
  branchId: string | null;
}

export interface BackgroundPost extends PostDraft {
  organizationId: string;
  /** For the toast: "Everyone", or the branch name. */
  audienceName: string;
  /** One per attachment, in the order they were added, each resolving to its
   *  stored URL. Already in flight by the time Post is pressed. */
  uploads: Array<Promise<string>>;
  mediaType?: string;
}

function failureMessage(error: unknown): string {
  // Upload failures and ApiError both carry a message already written for the
  // person; anything else gets the generic line.
  const message = error instanceof Error ? error.message.trim() : "";
  return message || "We couldn't publish the post. Try again.";
}

export async function publishPostInBackground(post: BackgroundPost): Promise<void> {
  const toastId = toast.loading(post.uploads.length > 0 ? "Uploading your post…" : "Posting…");
  const body = post.content + (post.location ? `\n📍 ${post.location}` : "");

  try {
    // Waiting here rather than in the composer is the point: Post can be pressed
    // the moment the files are chosen, and the last bytes land in the background.
    const mediaUrls = await Promise.all(post.uploads);
    const created = await api.post.createPost(post.organizationId, {
      branchId: post.branchId,
      content: body.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      mediaUrl: mediaUrls[0],
      mediaType: post.mediaType,
    });
    window.dispatchEvent(new CustomEvent<Post>(POST_PUBLISHED_EVENT, { detail: created }));
    toast.success(`Posted to ${post.audienceName}.`, { id: toastId });
  } catch (error) {
    toast.error(failureMessage(error), { id: toastId });
    window.dispatchEvent(new CustomEvent<PostDraft>(POST_FAILED_EVENT, {
      detail: { content: post.content, location: post.location, branchId: post.branchId },
    }));
  }
}
