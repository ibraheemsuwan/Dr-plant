import { beforeEach, describe, expect, it, vi } from "vitest";

// The feed is fetched through apiGet; replace the network with a canned server answer
const apiGet = vi.fn();
vi.mock("../api/http", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { fetchBlogFeed, fetchBlogPostsMerged } from "../api/services/blogAggregate";

const post = (id: number, extra: Record<string, unknown> = {}) => ({
  postId: id,
  userId: 7,
  authorName: "Salma Haddad",
  category: "Soil Health",
  title: `Post ${id}`,
  content: `Body ${id}`,
  imageUrl: null,
  createdAt: "2026-11-13T10:00:00Z",
  comments: [],
  likes: [],
  likeCount: 0,
  commentCount: 0,
  ...extra,
});

const page = (items: unknown[], extra: Record<string, unknown> = {}) => ({
  items,
  page: 1,
  pageSize: 6,
  total: items.length,
  totalPages: 1,
  ...extra,
});

beforeEach(() => apiGet.mockReset());

describe("fetchBlogFeed", () => {
  it("asks the server for one filtered page", async () => {
    apiGet.mockResolvedValue(page([]));

    await fetchBlogFeed({ page: 2, pageSize: 6, category: "Pest Control", userId: 7 });

    expect(apiGet).toHaveBeenCalledTimes(1);
    const url = String(apiGet.mock.calls[0][0]);
    expect(url).toContain("/Posts/feed?");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=6");
    expect(url).toContain("category=Pest+Control");
    expect(url).toContain("userId=7");
  });

  it("does not send the 'All' category or empty filters", async () => {
    apiGet.mockResolvedValue(page([]));
    await fetchBlogFeed({ page: 1, category: "All", search: "  " });
    const url = String(apiGet.mock.calls[0][0]);
    expect(url).not.toContain("category");
    expect(url).not.toContain("search");
  });

  it("turns each item into a post with its comments, likes and author", async () => {
    apiGet.mockResolvedValue(
      page(
        [
          post(11, {
            comments: [
              { commentId: 1, postId: 11, userId: 3, authorName: "Omar Khalil", text: "nice", createdAt: "2026-11-13T11:00:00Z" },
              { commentId: 2, postId: 11, userId: 7, authorName: "Salma Haddad", text: "thanks", createdAt: "2026-11-13T12:00:00Z" },
            ],
            likes: [{ likeId: 40, postId: 11, userId: 3, createdAt: "2026-11-13T11:00:00Z" }],
          }),
          post(12),
        ],
        { total: 14, totalPages: 3 },
      ),
    );

    const feed = await fetchBlogFeed({ page: 1 });

    expect(feed.total).toBe(14);
    expect(feed.totalPages).toBe(3);
    expect(feed.posts.map((p) => p.id)).toEqual([11, 12]);

    const first = feed.posts[0];
    expect(first.title).toBe("Post 11");
    expect(first.author).toBe("Salma Haddad");
    expect(first.category).toBe("Soil Health");
    expect(first.comments).toHaveLength(2);
    expect(first.comments[0].authorName).toBe("Omar Khalil");
    expect(first.comments[0].text).toBe("nice");
    expect(first.likes).toEqual(["3"]); // ids of the users who liked
    expect(feed.posts[1].comments).toHaveLength(0);
  });

  it("builds the like lookup needed to un-like (postId:userId -> likeId)", async () => {
    apiGet.mockResolvedValue(
      page([post(11, { likes: [{ likeId: 40, postId: 11, userId: 3 }, { likeId: 41, postId: 11, userId: 9 }] })]),
    );

    const feed = await fetchBlogFeed({ page: 1 });

    expect(feed.likeLookup.get("11:3")).toBe(40);
    expect(feed.likeLookup.get("11:9")).toBe(41);
    expect(feed.likeLookup.get("11:1")).toBeUndefined();
  });

  it("an empty page is a normal result", async () => {
    apiGet.mockResolvedValue(page([], { total: 0, totalPages: 0 }));
    const feed = await fetchBlogFeed({ page: 1 });
    expect(feed.posts).toEqual([]);
    expect(feed.totalPages).toBe(0);
  });
});

describe("fetchBlogPostsMerged (admin)", () => {
  it("walks the pages until the last one", async () => {
    apiGet
      .mockResolvedValueOnce(page([post(3), post(2)], { page: 1, totalPages: 2, total: 3 }))
      .mockResolvedValueOnce(page([post(1)], { page: 2, totalPages: 2, total: 3 }));

    const all = await fetchBlogPostsMerged();

    expect(all.map((p) => p.id)).toEqual([3, 2, 1]);
    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(String(apiGet.mock.calls[1][0])).toContain("page=2");
  });

  it("stops at the maximum instead of loading everything", async () => {
    apiGet.mockImplementation(async () =>
      page(Array.from({ length: 50 }, (_, i) => post(i + 1)), { totalPages: 100, total: 5000 }),
    );

    const all = await fetchBlogPostsMerged(120);

    expect(all).toHaveLength(120);
    expect(apiGet.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
