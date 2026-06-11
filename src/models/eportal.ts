export interface PhongBan {
  idPhongBan: number;
  tenPhongBan: string;
  status?: number;
}

export interface Vitri {
  idViTri: number;
  tenViTri: string;
}

export interface NvThietBi {
  idTb: number;
  tenThietBi: string;
}

export interface NvLoiSuCoTb {
  idSc: number;
  tenLoiSc: string;
}

export interface NvQuanLyThietBi {
  idQltb: number;
  idPhongBan?: number;
  tenPhongBan?: string;
  serviceTag?: string;
  idTb?: number;
  tenThietBi?: string;
  maNv?: string;
  hoTenNv?: string;
  phone?: string;
  idSc?: number;
  tenLoiSc?: string;
  ngayLap?: string;
  status?: string;
  ngayXl?: string;
  ngayHt?: string;
  ngayNm?: string;
  ghiChu?: string;
  adminNm?: string;
  hoTenAdmin?: string;
}

export interface NhanVien {
  id: number;
  maNv: string;
  hoTen: string;
  hoTenKhongDau?: string;
  ngaySinh?: string;
  diaChi?: string;
  dienThoai?: string;
  ngayVaoLam?: string;
  idPhongBan?: number;
  tenPhongBan?: string;
  idViTri?: number;
  tenViTri?: string;
  isGv?: boolean;
  email?: string;
  idQuyen?: number;
  groupQuyen?: string;
}

export interface PagedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}
