import { describe, expect, it } from "vitest";
import { deletePost, initialPosts, movePost, postsReducer, savePost } from "@/lib/calendar-store";

describe("calendar post reducer", () => {
  it("creates, updates, moves, and deletes posts without mutating prior state", () => {
    const created = { ...initialPosts[0], id: "new", title: "New campaign" };
    const afterCreate = postsReducer(initialPosts, savePost(created));
    expect(afterCreate).toHaveLength(initialPosts.length + 1);
    expect(initialPosts).toHaveLength(8);

    const afterUpdate = postsReducer(afterCreate, savePost({ ...created, title: "Updated campaign" }));
    expect(afterUpdate.find((post) => post.id === "new")?.title).toBe("Updated campaign");

    const afterMove = postsReducer(afterUpdate, movePost({ id: "new", date: "2026-09-20" }));
    expect(afterMove.find((post) => post.id === "new")?.date).toBe("2026-09-20");

    const afterDelete = postsReducer(afterMove, deletePost("new"));
    expect(afterDelete.some((post) => post.id === "new")).toBe(false);
  });
});
