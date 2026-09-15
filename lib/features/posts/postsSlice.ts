import { createAsyncThunk, createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlatformKey } from "@/lib/features/platforms/platformsSlice";
import type { RootState } from "@/lib/store";

export type PostCategory = "Article" | "Social" | "Newsletter" | "Notes";
export type RequestStatus = "idle" | "loading" | "saving" | "saved" | "deleting" | "failed";

export type Post = {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  platformIds: PlatformKey[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "draftly-redux-posts-v1";
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const seedPosts: Post[] = [
  { id: "launch-story", title: "The story behind our spring launch", content: "A product launch is never just one big moment. It is hundreds of small decisions, thoughtful conversations, and quiet breakthroughs that finally meet the world together.\n\nFor our spring collection, we started with one question: what would it look like to make everyday work feel lighter?", category: "Article", platformIds: ["linkedin", "facebook"], createdAt: "2026-09-12T10:00:00.000Z", updatedAt: "2026-09-15T07:45:00.000Z" },
  { id: "community-update", title: "September community update", content: "A quick look at what our community made, learned, and shared this month.", category: "Newsletter", platformIds: ["instagram", "facebook"], createdAt: "2026-09-11T12:00:00.000Z", updatedAt: "2026-09-14T16:20:00.000Z" },
  { id: "process-notes", title: "Design process notes", content: "Keep the first review focused on direction, not polish. Collect decisions in one place.", category: "Notes", platformIds: [], createdAt: "2026-09-10T09:00:00.000Z", updatedAt: "2026-09-13T11:05:00.000Z" },
];

const postsAdapter = createEntityAdapter<Post>({ sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt) });
const initialState = postsAdapter.getInitialState({ status: "idle" as RequestStatus, activeRequestId: null as string | null, error: null as string | null });

export const hydratePosts = createAsyncThunk("posts/hydrate", async () => {
  await wait(420);
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedPosts;
  const parsed: unknown = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed as Post[] : seedPosts;
});

export const savePost = createAsyncThunk("posts/save", async (postId: string, { getState, rejectWithValue }) => {
  await wait(520);
  const state = getState() as RootState;
  const post = state.posts.entities[postId];
  if (!post) return rejectWithValue("Post not found.");
  const savedAt = new Date().toISOString();
  const posts = Object.values(state.posts.entities).map((item) => item.id === postId ? { ...item, updatedAt: savedAt } : item);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return { postId, savedAt };
});

export const deletePost = createAsyncThunk("posts/delete", async (postId: string, { getState }) => {
  await wait(430);
  const remaining = Object.values((getState() as RootState).posts.entities).filter((post) => post.id !== postId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return postId;
});

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    postCreated: {
      reducer: postsAdapter.addOne,
      prepare() {
        const timestamp = new Date().toISOString();
        return { payload: { id: crypto.randomUUID(), title: "", content: "", category: "Article" as const, platformIds: [] as PlatformKey[], createdAt: timestamp, updatedAt: timestamp } };
      },
    },
    postUpdated(state, action: PayloadAction<{ id: string; changes: Partial<Pick<Post, "title" | "content" | "category" | "platformIds">> }>) {
      postsAdapter.updateOne(state, action.payload);
      state.status = "idle";
      state.error = null;
    },
    requestStatusReset(state) { if (state.status !== "loading") state.status = "idle"; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydratePosts.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(hydratePosts.fulfilled, (state, action) => { postsAdapter.setAll(state, action.payload); state.status = "idle"; })
      .addCase(hydratePosts.rejected, (state, action) => { postsAdapter.setAll(state, seedPosts); state.status = "failed"; state.error = action.error.message ?? "Saved posts could not be read."; })
      .addCase(savePost.pending, (state, action) => { state.status = "saving"; state.activeRequestId = action.meta.arg; state.error = null; })
      .addCase(savePost.fulfilled, (state, action) => { postsAdapter.updateOne(state, { id: action.payload.postId, changes: { updatedAt: action.payload.savedAt } }); state.status = "saved"; state.activeRequestId = null; })
      .addCase(savePost.rejected, (state, action) => { state.status = "failed"; state.error = String(action.payload ?? action.error.message ?? "Unable to save post."); state.activeRequestId = null; })
      .addCase(deletePost.pending, (state, action) => { state.status = "deleting"; state.activeRequestId = action.meta.arg; })
      .addCase(deletePost.fulfilled, (state, action) => { postsAdapter.removeOne(state, action.payload); state.status = "idle"; state.activeRequestId = null; })
      .addCase(deletePost.rejected, (state, action) => { state.status = "failed"; state.error = action.error.message ?? "Unable to delete post."; state.activeRequestId = null; });
  },
});

export const { postCreated, postUpdated, requestStatusReset } = postsSlice.actions;
export const postsReducer = postsSlice.reducer;
export const { selectAll: selectAllPosts, selectById: selectPostById, selectTotal: selectPostCount } = postsAdapter.getSelectors((state: RootState) => state.posts);
export const selectPostsStatus = (state: RootState) => state.posts.status;
export const selectPostsError = (state: RootState) => state.posts.error;
