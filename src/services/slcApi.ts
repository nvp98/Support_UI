import ApiService from "./ApiService";
import type {
  SoftwareCatalog,
  SlcProject,
  BusinessProcess,
  ProcessStep,
  SlcModule,
  SlcModuleFormData,
  SlcTask,
  ChangeRequest,
  ChangeRevision,
  PagedResponse,
  SlcDashboardSummary,
} from "../models/slc";

const BASE = "/api";

// ─── Software Catalog ──────────────────────────────────────────────
export const softwareApi = {
  getAll: (params?: { status?: number; keyword?: string }) =>
    ApiService.get<SoftwareCatalog[]>(`${BASE}/SoftwareCatalog`, { params }),

  getById: (id: number) =>
    ApiService.get<SoftwareCatalog>(`${BASE}/SoftwareCatalog/${id}`),

  create: (data: Partial<SoftwareCatalog>) =>
    ApiService.post<SoftwareCatalog>(`${BASE}/SoftwareCatalog`, data),

  update: (id: number, data: Partial<SoftwareCatalog>) =>
    ApiService.put<SoftwareCatalog>(`${BASE}/SoftwareCatalog/${id}`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/SoftwareCatalog/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────────
export const projectApi = {
  getAll: (params?: {
    softwareId?: number;
    status?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => ApiService.get<PagedResponse<SlcProject>>(`${BASE}/SlcProject`, { params }),

  getById: (id: number) =>
    ApiService.get<SlcProject>(`${BASE}/SlcProject/${id}`),

  getProgress: (id: number) =>
    ApiService.get<{ progress: number; totalWeight: number; moduleCount: number; completedModules: number }>(
      `${BASE}/SlcProject/${id}/progress`
    ),

  create: (data: Partial<SlcProject>) =>
    ApiService.post<SlcProject>(`${BASE}/SlcProject`, data),

  update: (id: number, data: Partial<SlcProject>) =>
    ApiService.put<SlcProject>(`${BASE}/SlcProject/${id}`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/SlcProject/${id}`),
};

// ─── Business Process ──────────────────────────────────────────────
export const businessProcessApi = {
  getAll: (params?: { status?: number; keyword?: string }) =>
    ApiService.get<BusinessProcess[]>(`${BASE}/BusinessProcess`, { params }),

  getFlat: (params?: { status?: number }) =>
    ApiService.get<BusinessProcess[]>(`${BASE}/BusinessProcess/flat`, { params }),

  getById: (id: number) =>
    ApiService.get<BusinessProcess>(`${BASE}/BusinessProcess/${id}`),

  create: (data: Partial<BusinessProcess>) =>
    ApiService.post<BusinessProcess>(`${BASE}/BusinessProcess`, data),

  update: (id: number, data: Partial<BusinessProcess>) =>
    ApiService.put<BusinessProcess>(`${BASE}/BusinessProcess/${id}`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/BusinessProcess/${id}`),
};

// ─── Process Steps ─────────────────────────────────────────────────
export const processStepApi = {
  getAll: (params?: { businessProcessId?: number; status?: number }) =>
    ApiService.get<ProcessStep[]>(`${BASE}/ProcessStep`, { params }),

  getById: (id: number) =>
    ApiService.get<ProcessStep>(`${BASE}/ProcessStep/${id}`),

  create: (data: Partial<ProcessStep>) =>
    ApiService.post<ProcessStep>(`${BASE}/ProcessStep`, data),

  update: (id: number, data: Partial<ProcessStep>) =>
    ApiService.put<ProcessStep>(`${BASE}/ProcessStep/${id}`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/ProcessStep/${id}`),
};

// ─── Modules ───────────────────────────────────────────────────────
export const moduleApi = {
  getAll: (params?: {
    projectId?: number;
    status?: number;
    assigneeCode?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => ApiService.get<PagedResponse<SlcModule>>(`${BASE}/SlcModule`, { params }),

  getById: (id: number) =>
    ApiService.get<SlcModule>(`${BASE}/SlcModule/${id}`),

  create: (data: SlcModuleFormData) =>
    ApiService.post<SlcModule>(`${BASE}/SlcModule`, data),

  update: (id: number, data: SlcModuleFormData) =>
    ApiService.put<SlcModule>(`${BASE}/SlcModule/${id}`, data),

  updateProgress: (id: number, data: { actualProgress: number; status?: number }) =>
    ApiService.put<SlcModule>(`${BASE}/SlcModule/${id}/progress`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/SlcModule/${id}`),
};

// ─── Tasks ─────────────────────────────────────────────────────────
export const taskApi = {
  getAll: (params?: {
    moduleId?: number;
    status?: number;
    assigneeCode?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => ApiService.get<PagedResponse<SlcTask>>(`${BASE}/SlcTask`, { params }),

  getById: (id: number) =>
    ApiService.get<SlcTask>(`${BASE}/SlcTask/${id}`),

  create: (data: Partial<SlcTask>) =>
    ApiService.post<SlcTask>(`${BASE}/SlcTask`, data),

  update: (id: number, data: Partial<SlcTask>) =>
    ApiService.put<SlcTask>(`${BASE}/SlcTask/${id}`, data),

  delete: (id: number) =>
    ApiService.delete(`${BASE}/SlcTask/${id}`),
};

// ─── Change Requests ───────────────────────────────────────────────
export const changeRequestApi = {
  getAll: (params: {
    actorCode: string;
    projectId?: number;
    moduleId?: number;
    status?: number;
    priority?: number;
    requestorCode?: string;
    myRequest?: boolean;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) => ApiService.get<PagedResponse<ChangeRequest>>(`${BASE}/ChangeRequest`, { params }),

  getById: (id: number, actorCode: string) =>
    ApiService.get<ChangeRequest>(`${BASE}/ChangeRequest/${id}`, { params: { actorCode } }),

  create: (data: FormData) =>
    ApiService.post<ChangeRequest>(`${BASE}/ChangeRequest`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: number, data: FormData) =>
    ApiService.put<ChangeRequest>(`${BASE}/ChangeRequest/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  accept: (id: number, data: { actorCode: string; actorName: string; expectedCompletionDate: string }) =>
    ApiService.post<ChangeRequest>(`${BASE}/ChangeRequest/${id}/accept`, data),

  approve: (id: number, actor: { actorCode: string; actorName: string }) =>
    ApiService.post<ChangeRequest>(`${BASE}/ChangeRequest/${id}/approve`, actor),

  reject: (id: number, data: { actorCode: string; actorName: string; reason: string }) =>
    ApiService.post<ChangeRequest>(`${BASE}/ChangeRequest/${id}/reject`, data),

  complete: (id: number, actor: { actorCode: string; actorName: string }) =>
    ApiService.post<ChangeRequest>(`${BASE}/ChangeRequest/${id}/complete`, actor),

  addRevision: (id: number, data: Partial<ChangeRevision> & { actorCode: string; actorName: string }) =>
    ApiService.post<ChangeRevision>(`${BASE}/ChangeRequest/${id}/revisions`, data),

  delete: (id: number, actor: { actorCode: string; actorName: string }) =>
    ApiService.delete(`${BASE}/ChangeRequest/${id}`, { data: actor }),
};

// ─── Dashboard ─────────────────────────────────────────────────────
export const slcDashboardApi = {
  getSummary: () =>
    ApiService.get<SlcDashboardSummary>(`${BASE}/SlcDashboard/summary`),

  getTimeline: (params?: { projectId?: number; view?: string }) =>
    ApiService.get<any[]>(`${BASE}/SlcDashboard/timeline`, { params }),

  getKpi: (params?: { year?: number; month?: number }) =>
    ApiService.get<any>(`${BASE}/SlcDashboard/kpi`, { params }),
};
