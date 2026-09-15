import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PostStatus = "Scheduled" | "Draft" | "Review";
export type Channel = "Instagram" | "LinkedIn" | "X / Twitter";
export type CalendarPost = { id: string; title: string; caption: string; date: string; time: string; channel: Channel; status: PostStatus; tone: string };

const initialState: CalendarPost[] = [
  { id: "p1", date: "2026-09-14", time: "09:30", title: "Monday momentum", caption: "Three small ways to begin the week with focus.", channel: "Instagram", tone: "coral", status: "Scheduled" },
  { id: "p2", date: "2026-09-14", time: "14:00", title: "Founder note: why focus wins", caption: "A short reflection from the team.", channel: "LinkedIn", tone: "blue", status: "Draft" },
  { id: "p3", date: "2026-09-15", time: "11:00", title: "Product tips carousel", caption: "Five shortcuts for a faster workflow.", channel: "Instagram", tone: "violet", status: "Scheduled" },
  { id: "p4", date: "2026-09-16", time: "10:15", title: "Community spotlight", caption: "Meet the makers using Planora this month.", channel: "X / Twitter", tone: "cyan", status: "Review" },
  { id: "p5", date: "2026-09-17", time: "09:00", title: "September release notes", caption: "Everything new in this month's release.", channel: "LinkedIn", tone: "blue", status: "Scheduled" },
  { id: "p6", date: "2026-09-17", time: "15:30", title: "Behind the scenes", caption: "A quick studio tour with the design team.", channel: "Instagram", tone: "coral", status: "Draft" },
  { id: "p7", date: "2026-09-18", time: "12:00", title: "Weekly roundup", caption: "The links, launches, and lessons we saved.", channel: "X / Twitter", tone: "cyan", status: "Scheduled" },
  { id: "p8", date: "2026-09-21", time: "10:00", title: "Customer story: Northstar", caption: "How a small team planned a month in one afternoon.", channel: "LinkedIn", tone: "blue", status: "Scheduled" },
];

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    savePost: (state, action: PayloadAction<CalendarPost>) => {
      const index = state.findIndex((post) => post.id === action.payload.id);
      if (index >= 0) state[index] = action.payload; else state.push(action.payload);
    },
    movePost: (state, action: PayloadAction<{ id: string; date: string }>) => {
      const post = state.find((item) => item.id === action.payload.id);
      if (post) post.date = action.payload.date;
    },
    deletePost: (state, action: PayloadAction<string>) => state.filter((post) => post.id !== action.payload),
  },
});

export const { savePost, movePost, deletePost } = postsSlice.actions;
export const calendarStore = configureStore({ reducer: { posts: postsSlice.reducer } });
export type RootState = ReturnType<typeof calendarStore.getState>;
export type AppDispatch = typeof calendarStore.dispatch;
