import type { PagedResponse, TicketLog } from "../models/ticketLog";
import apiService from "./ApiService";

// config sample
export const ticketLogApi = {
  getTickets: (
    page = 1,
    pageSize = 10,
    filters: {
      usercode?: string;
      status?: number;
      department?: string;
      keyword?: string;
      fromDate?: string; // yyyy-MM-dd
      toDate?: string; // yyyy-MM-dd
      type?: string;
      userAssigneeCode?: string;
    } = {}
  ) => {
    const query = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters.status !== undefined && {
        status: filters.status.toString(),
      }),
      ...(filters.department && { department: filters.department }),
      ...(filters.keyword && { keyword: filters.keyword }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(filters.usercode && { usercode: filters.usercode }),
      ...(filters.type && { type: filters.type }),
      ...(filters.userAssigneeCode && {
        userAssigneeCode: filters.userAssigneeCode,
      }),
    }).toString();
    // return apiService.get(`/api/TicketLogs?${query}`);
    return apiService.get<PagedResponse<TicketLog>>(`/api/TicketLogs?${query}`);
  },
  getTicketById: (id: string) => apiService.get(`/api/TicketLogs/${id}`),
  // POST FormData (nếu có file upload)
  createTicket: (data: FormData) =>
    apiService.post("/api/TicketLogs/create", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // PUT: cập nhật tiếp nhận ticket
  receiveTicket: (id: number, data: any) =>
    apiService.put(`/api/TicketLogs/received/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // PUT: reset ticket
  resetticket: (id: number, data: any) =>
    apiService.put(`/api/TicketLogs/reset/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // PUT: cập nhật hoàn tất ticket
  completeTicket: (id: number, data: any) =>
    apiService.put(`/api/TicketLogs/completed/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // PUT: cập nhật hủy ticket
  cancelTicket: (id: number, data: any) =>
    apiService.put(`/api/TicketLogs/cancel/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),
};
