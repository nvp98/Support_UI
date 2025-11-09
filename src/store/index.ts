import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import notificationReducer from "./NotificationSlice";
import loadingReducer from "./loadingSlice";
import menuReducer from "./menuSlice";
import ticketReducer from "./ticketSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
    loading: loadingReducer,
    menu: menuReducer,
    ticket: ticketReducer,
  },
});

// Kiểu dữ liệu cho useSelector & useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
