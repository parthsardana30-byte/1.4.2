import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export type PlatformKey = "x" | "instagram" | "linkedin" | "facebook";

export type Platform = {
  id: PlatformKey;
  name: string;
  handle: string;
  characterLimit: number;
  mediaLimit: number;
  hashtagLimit: number;
  color: string;
  pale: string;
};

const platformsAdapter = createEntityAdapter<Platform>();

const initialState = platformsAdapter.setAll(
  platformsAdapter.getInitialState(),
  [
    { id: "x", name: "X / Twitter", handle: "@northstarstudio", characterLimit: 280, mediaLimit: 4, hashtagLimit: 10, color: "#111827", pale: "#eef0f3" },
    { id: "instagram", name: "Instagram", handle: "@northstar.studio", characterLimit: 2200, mediaLimit: 10, hashtagLimit: 30, color: "#d92d76", pale: "#fff0f6" },
    { id: "linkedin", name: "LinkedIn", handle: "Northstar Studio", characterLimit: 3000, mediaLimit: 9, hashtagLimit: 30, color: "#1269a8", pale: "#eaf6ff" },
    { id: "facebook", name: "Facebook", handle: "Northstar Studio", characterLimit: 63206, mediaLimit: 10, hashtagLimit: 30, color: "#3158b8", pale: "#edf2ff" },
  ],
);

const platformsSlice = createSlice({
  name: "platforms",
  initialState,
  reducers: {
    platformAdded: platformsAdapter.addOne,
    platformUpdated: platformsAdapter.updateOne,
    platformRemoved: platformsAdapter.removeOne,
  },
});

export const { platformAdded, platformUpdated, platformRemoved } = platformsSlice.actions;
export const platformsReducer = platformsSlice.reducer;

export const {
  selectAll: selectAllPlatforms,
  selectById: selectPlatformById,
} = platformsAdapter.getSelectors((state: RootState) => state.platforms);
