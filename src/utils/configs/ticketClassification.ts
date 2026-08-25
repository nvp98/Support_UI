import type {
  TicketSubType,
  TicketType,
} from "../../models/ticketLog";

export interface TicketSubTypeOption {
  value: TicketSubType;
  label: string;
}

export interface TicketTypeOption {
  value: TicketType;
  label: string;
  color: string;
  children: TicketSubTypeOption[];
}

export const TICKET_CLASSIFICATIONS: TicketTypeOption[] = [
  {
    value: "SOFT",
    label: "Hỗ trợ phần mềm",
    color: "red",
    children: [
      { value: "EOFFICE", label: "EOffice" },
      { value: "MS365", label: "MS 365 (teams, mail,...)" },
      { value: "BK_SOFTWARE", label: "Phần mềm BK" },
      { value: "ACCESS_CONTROL", label: "AccessControl" },
      { value: "WINDOWS_INSTALL", label: "Cài Win" },
      { value: "OTHER_SOFTWARE", label: "Phần mềm khác" },
    ],
  },
  {
    value: "HARD",
    label: "Hỗ trợ phần cứng",
    color: "orange",
    children: [
      { value: "CAMERA", label: "Camera" },
      { value: "PRINTER", label: "Máy in" },
      { value: "RAM_REPLACEMENT", label: "Thay RAM" },
      { value: "DRIVE_REPLACEMENT", label: "Thay Ổ cứng" },
      { value: "OTHER_HARDWARE", label: "Phần cứng khác" },
    ],
  },
  {
    value: "SAP",
    label: "SAP",
    color: "cyan",
    children: [],
  },
];

export const TICKET_TYPE_OPTIONS = TICKET_CLASSIFICATIONS.map(
  ({ value, label }) => ({ value, label }),
);

export const getTicketSubTypeOptions = (
  ticketType?: string | null,
): TicketSubTypeOption[] =>
  TICKET_CLASSIFICATIONS.find((item) => item.value === ticketType)?.children ??
  [];

export const getTicketTypeLabel = (ticketType?: string | null) =>
  TICKET_CLASSIFICATIONS.find((item) => item.value === ticketType)?.label ??
  ticketType ??
  "—";

export const getTicketTypeColor = (ticketType?: string | null) =>
  TICKET_CLASSIFICATIONS.find((item) => item.value === ticketType)?.color ??
  "default";

export const getTicketSubTypeLabel = (
  ticketSubType?: string | null,
  ticketType?: string | null,
) => {
  if (!ticketSubType) return "Chưa phân loại chi tiết";

  const options = ticketType
    ? getTicketSubTypeOptions(ticketType)
    : TICKET_CLASSIFICATIONS.flatMap((item) => item.children);
  return (
    options.find((item) => item.value === ticketSubType)?.label ?? ticketSubType
  );
};
