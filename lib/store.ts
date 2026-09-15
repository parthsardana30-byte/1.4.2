import { configureStore } from "@reduxjs/toolkit";
import { platformsReducer } from "@/lib/features/platforms/platformsSlice";
import { postsReducer } from "@/lib/features/posts/postsSlice";

export const makeStore = () => configureStore({
  reducer: {
    posts: postsReducer,
    platforms: platformsReducer,
  },
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
