import apiService from "./ApiService";

// config sample
export const UserPermissionApi = {
  getTicketById: (maNV: string) =>
    apiService.get(`/api/UserPermissions/${maNV}`),
  // POST FormData (nếu có file upload)
  //   createTicket: (data: FormData) =>
  //     apiService.post("/api/TicketLogs/create", data, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     }),
};
