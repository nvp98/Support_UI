import apiService from "./ApiService";
import type {
  NvQuanLyThietBi,
  NvThietBi,
  NvLoiSuCoTb,
  PhongBan,
  NhanVien,
  PagedResponse,
} from "../models/eportal";

export const phongBanApi = {
  getAll: (status?: number) =>
    apiService.get<PhongBan[]>(
      `/api/PhongBan${status !== undefined ? `?status=${status}` : ""}`
    ),
  getById: (id: number) => apiService.get<PhongBan>(`/api/PhongBan/${id}`),
  create: (data: Partial<PhongBan>) =>
    apiService.post<PhongBan>("/api/PhongBan", data),
  update: (id: number, data: Partial<PhongBan>) =>
    apiService.put<PhongBan>(`/api/PhongBan/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/PhongBan/${id}`),
};

export const thietBiApi = {
  getAll: (keyword?: string) =>
    apiService.get<NvThietBi[]>(
      `/api/ThietBi${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`
    ),
  getById: (id: number) => apiService.get<NvThietBi>(`/api/ThietBi/${id}`),
  create: (data: Partial<NvThietBi>) =>
    apiService.post<NvThietBi>("/api/ThietBi", data),
  update: (id: number, data: Partial<NvThietBi>) =>
    apiService.put<NvThietBi>(`/api/ThietBi/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/ThietBi/${id}`),
};

export const loiSuCoApi = {
  getAll: (keyword?: string) =>
    apiService.get<NvLoiSuCoTb[]>(
      `/api/LoiSuCo${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`
    ),
  getById: (id: number) =>
    apiService.get<NvLoiSuCoTb>(`/api/LoiSuCo/${id}`),
  create: (data: Partial<NvLoiSuCoTb>) =>
    apiService.post<NvLoiSuCoTb>("/api/LoiSuCo", data),
  update: (id: number, data: Partial<NvLoiSuCoTb>) =>
    apiService.put<NvLoiSuCoTb>(`/api/LoiSuCo/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/LoiSuCo/${id}`),
};

export const quanLyThietBiApi = {
  getList: (
    page = 1,
    pageSize = 20,
    filters: {
      idPhongBan?: number;
      idTb?: number;
      idSc?: number;
      status?: string;
      maNv?: string;
      serviceTag?: string;
      fromDate?: string;
      toDate?: string;
    } = {}
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters.idPhongBan !== undefined && {
        idPhongBan: filters.idPhongBan.toString(),
      }),
      ...(filters.idTb !== undefined && { idTb: filters.idTb.toString() }),
      ...(filters.idSc !== undefined && { idSc: filters.idSc.toString() }),
      ...(filters.status && { status: filters.status }),
      ...(filters.maNv && { maNv: filters.maNv }),
      ...(filters.serviceTag && { serviceTag: filters.serviceTag }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    }).toString();
    return apiService.get<PagedResponse<NvQuanLyThietBi>>(
      `/api/QuanLyThietBi?${params}`
    );
  },
  getById: (id: number) =>
    apiService.get<NvQuanLyThietBi>(`/api/QuanLyThietBi/${id}`),
  create: (data: Partial<NvQuanLyThietBi>) =>
    apiService.post<{ idQltb: number }>("/api/QuanLyThietBi", data),
  update: (id: number, data: Partial<NvQuanLyThietBi>) =>
    apiService.put<NvQuanLyThietBi>(`/api/QuanLyThietBi/${id}`, data),
  updateStatus: (
    id: number,
    data: {
      status: string;
      ngayXl?: string;
      ngayHt?: string;
      ngayNm?: string;
      ghiChu?: string;
      adminNm?: string;
    }
  ) =>
    apiService.put<NvQuanLyThietBi>(
      `/api/QuanLyThietBi/${id}/status`,
      data
    ),
  delete: (id: number) => apiService.delete(`/api/QuanLyThietBi/${id}`),
};

export const nhanVienApi = {
  getAll: (filters: { idPhongBan?: number; isGv?: boolean } = {}) => {
    const params = new URLSearchParams({
      ...(filters.idPhongBan !== undefined && {
        idPhongBan: filters.idPhongBan.toString(),
      }),
      ...(filters.isGv !== undefined && {
        isGv: filters.isGv.toString(),
      }),
    }).toString();
    return apiService.get<any[]>(`/api/NhanVien/all${params ? `?${params}` : ""}`);
  },
  // Danh sách nhân viên có phân trang + tìm kiếm (mã, tên, email), dùng cho Select tìm kiếm phía server
  search: (
    filters: {
      keyword?: string;
      idPhongBan?: number;
      isGv?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ) => {
    const params = new URLSearchParams({
      page: (filters.page ?? 1).toString(),
      pageSize: (filters.pageSize ?? 150).toString(),
      ...(filters.keyword && { keyword: filters.keyword }),
      ...(filters.idPhongBan !== undefined && {
        idPhongBan: filters.idPhongBan.toString(),
      }),
      ...(filters.isGv !== undefined && {
        isGv: filters.isGv.toString(),
      }),
    }).toString();
    return apiService.get<PagedResponse<NhanVien>>(`/api/NhanVien?${params}`);
  },
};
