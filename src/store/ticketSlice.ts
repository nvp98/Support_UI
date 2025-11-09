import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface TicketFilterState {
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  type?: string;
  userAssigneeCode?: string;
}

const initialState: TicketFilterState = {};

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    setTicketFilter: (state, action: PayloadAction<TicketFilterState>) => {
      return { ...state, ...action.payload };
    },
    clearTicketFilter: () => initialState,
  },
});

export const { setTicketFilter, clearTicketFilter } = ticketSlice.actions;
export default ticketSlice.reducer;
