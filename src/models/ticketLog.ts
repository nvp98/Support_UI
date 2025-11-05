// Một bản ghi Ticket
export interface TicketLog {
  ticketId: number;
  ticketCode: string;
  ticketTitle: string;
  ticketType: string;
  ticketContent?: string;
  ticketStatus: number;
  fileAttachments?: string;
  createdAt?: string;
  userCode?: string;
  userName?: string;
  userDepartment?: string;
  userContact?: string;
  userAssigneeCode?: string;
  userAssigneeName?: string;
  userAssigneeDepartment?: string;
  receivedAt?: string | null; // Thời gian tiếp nhận
  approvedAt?: string | null; // Thời gian hoàn thành
  note?: string;
}

// Response dạng phân trang
export interface PagedResponse<T> {
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}
