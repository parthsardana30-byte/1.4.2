import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import { selectAllPosts, selectPostById, type PostCategory } from "./postsSlice";

export type PostFilter = "All" | PostCategory;

const selectSearchQuery = (_state: RootState, query: string) => query;
const selectCategoryFilter = (_state: RootState, _query: string, filter: PostFilter) => filter;

export const makeSelectFilteredPosts = () => createSelector(
  [selectAllPosts, selectSearchQuery, selectCategoryFilter],
  (posts, query, filter) => {
    const needle = query.trim().toLocaleLowerCase();
    return posts.filter((post) =>
      (filter === "All" || post.category === filter)
      && (!needle || `${post.title} ${post.content}`.toLocaleLowerCase().includes(needle)),
    );
  },
);

export const selectPostCategoryCounts = createSelector([selectAllPosts], (posts) => {
  const counts: Record<PostFilter, number> = {
    All: posts.length,
    Article: 0,
    Social: 0,
    Newsletter: 0,
    Notes: 0,
  };
  posts.forEach((post) => { counts[post.category] += 1; });
  return counts;
});

export const makeSelectPostMetrics = () => createSelector(
  [(state: RootState, postId: string) => selectPostById(state, postId)],
  (post) => {
    const words = post?.content.trim() ? post.content.trim().split(/\s+/).length : 0;
    return {
      words,
      characters: post?.content.length ?? 0,
      readingMinutes: words ? Math.max(1, Math.ceil(words / 220)) : 0,
    };
  },
);
