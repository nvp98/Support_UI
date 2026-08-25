export type TicketErrorClassification = "OLD" | "NEW";
export type TicketHandlerClassification = "IT" | "NT";
export type TicketType = "SOFT" | "HARD" | "SAP";
export type TicketSubType =
  | "EOFFICE"
  | "MS365"
  | "BK_SOFTWARE"
  | "ACCESS_CONTROL"
  | "WINDOWS_INSTALL"
  | "OTHER_SOFTWARE"
  | "CAMERA"
  | "PRINTER"
  | "RAM_REPLACEMENT"
  | "DRIVE_REPLACEMENT"
  | "OTHER_HARDWARE";

export interface CompleteTicketRequest {
  completedNote?: string;
  processingMinutes: number;
  errorClassification?: TicketErrorClassification;
  handlerClassification: TicketHandlerClassification;
}

// Một bản ghi Ticket
export interface TicketLog {
  ticketId: number;
  ticketCode: string;
  ticketTitle: string;
  ticketType: TicketType;
  ticketSubType?: TicketSubType | null;
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
  completedNote?: string | null;
  processingMinutes?: number | null;
  errorClassification?: TicketErrorClassification | null;
  handlerClassification?: TicketHandlerClassification | null;
}

// Response dạng phân trang
export interface PagedResponse<T> {
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}
