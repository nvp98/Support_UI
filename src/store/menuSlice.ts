// store/menuSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MenuState {
  items: any[];
}

const initialState: MenuState = {
  items: [],
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setMenu: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
    },
  },
});

export const { setMenu } = menuSlice.actions;
export default menuSlice.reducer;
