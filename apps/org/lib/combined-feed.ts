import type { Post, PostListResponse } from "@/types/api";

/** Merge authorized feeds chronologically without repeating General posts. */
export function createCombinedFeedLoader(loaders: Array<(offset: number) => Promise<PostListResponse>>, limit = 20) {
  const sources = loaders.map((load) => ({ load, offset: 0, done: false, buffer: [] as Post[] }));
  const items: Post[] = [];
  const seen = new Set<string>();
  let pending = Promise.resolve();
  async function fill(source: typeof sources[number]) {
    if (source.done || source.buffer.length) return;
    const page = await source.load(source.offset);
    const next = page.offset + page.items.length;
    source.done = !page.items.length || next <= source.offset || next >= page.total;
    source.offset = next;
    source.buffer = page.items;
  }
  return (offset: number): Promise<PostListResponse> => {
    const result = pending.then(async () => {
      while (items.length < offset + limit) {
        await Promise.all(sources.map(fill));
        const available = sources.filter((source) => source.buffer.length);
        if (!available.length) break;
        available.sort((a, b) => Date.parse(b.buffer[0].createdAt) - Date.parse(a.buffer[0].createdAt) || b.buffer[0].id.localeCompare(a.buffer[0].id));
        const post = available[0].buffer.shift()!;
        if (!seen.has(post.id)) { seen.add(post.id); items.push(post); }
      }
      const hasMore = sources.some((source) => source.buffer.length || !source.done);
      return { items: items.slice(offset, offset + limit), offset, limit, total: items.length + (hasMore ? 1 : 0) };
    });
    pending = result.then(() => {}, () => {});
    return result;
  };
}
