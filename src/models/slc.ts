// ============================================================
// Software Lifecycle Management (SLC) - TypeScript Models
// ============================================================

export interface SoftwareCatalog {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: number; // 1=Active, 0=Inactive
  createdAt: string;
  createdBy?: string;
}

export interface SlcProject {
  id: number;
  code: string;
  name: string;
  softwareId: number;
  softwareName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goLiveDate?: string;
  version?: string;
  // 0=Planning, 1=InProgress, 2=Completed, 3=OnHold, 4=Cancelled
  status: number;
  weight: number;
  createdAt: string;
  createdBy?: string;
  moduleCount?: number;
  progress?: number;
}

export interface BusinessProcess {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number;
  orderIndex: number;
  status: number;
  createdAt: string;
  children?: BusinessProcess[];
  processSteps?: ProcessStep[];
}

export interface ProcessStep {
  id: number;
  code: string;
  name: string;
  businessProcessId: number;
  businessProcessName?: string;
  description?: string;
  orderIndex: number;
  status: number;
  createdAt: string;
}

export interface SlcModule {
  id: number;
  code: string;
  name: string;
  projectId: number;
  projectName?: string;
  softwareName?: string;
  description?: string;
  assigneeCode?: string;
  assigneeName?: string;
  startDate?: string;
  endDate?: string;
  plannedProgress: number;
  actualProgress: number;
  weight: number;
  // 0=NotStarted, 1=InProgress, 2=Completed, 3=OnHold
  status: number;
  version?: string;
  createdAt: string;
  createdBy?: string;
  processSteps?: { processStepId: number; processStepName?: string }[];
}

export interface SlcModuleFormData {
  code: string;
  name: string;
  projectId: number;
  description?: string;
  assigneeCode?: string;
  assigneeName?: string;
  startDate?: string;
  endDate?: string;
  plannedProgress: number;
  actualProgress: number;
  weight: number;
  status: number;
  version?: string;
  createdBy?: string;
  processStepIds?: number[];
}

export interface SlcTask {
  id: number;
  code: string;
  name: string;
  moduleId: number;
  moduleName?: string;
  description?: string;
  assigneeCode?: string;
  assigneeName?: string;
  startDate?: string;
  endDate?: string;
  // 1=Low, 2=Medium, 3=High, 4=Critical
  priority: number;
  // 0=NotStarted, 1=InProgress, 2=Completed, 3=Blocked
  status: number;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
}

export interface ChangeRequest {
  id: number;
  code: string;
  title: string;
  content?: string;
  reason?: string;
  // 1=Low, 2=Medium, 3=High, 4=Critical
  priority: number;
  moduleId?: number;
  moduleName?: string;
  projectId?: number;
  projectName?: string;
  requestorCode?: string;
  requestorName?: string;
  requestorDept?: string;
  approverCode?: string;
  approverName?: string;
  developerCode?: string;
  developerName?: string;
  // 0=Draft, 1=PendingApproval, 2=Approved, 3=Analysis,
  // 4=Estimating, 5=Development, 6=Testing, 7=Confirming, 8=Deploying,
  // 9=Completed, 10=Rejected
  status: number;
  impactTimeline: boolean;
  impactDays: number;
  impactVersion?: string;
  impactModules?: string;
  currentRevision: number;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  revisions?: ChangeRevision[];
  revisionCount?: number;
}

export interface ChangeRevision {
  id: number;
  changeRequestId: number;
  revisionNumber: number;
  content?: string;
  reason?: string;
  requestorCode?: string;
  requestorName?: string;
  approverCode?: string;
  approverName?: string;
  impactAssessment?: string;
  impactTimeline: boolean;
  impactDays: number;
  impactVersion?: string;
  // 0=Pending, 1=Approved, 2=Rejected
  status: number;
  createdAt: string;
  approvedAt?: string;
}

export interface TimelineAdjustment {
  id: number;
  entityType: string;
  entityId: number;
  previousStartDate?: string;
  previousEndDate?: string;
  newStartDate?: string;
  newEndDate?: string;
  adjustmentDays: number;
  reason?: string;
  changeRequestId?: number;
  changedBy?: string;
  changedByName?: string;
  changedAt: string;
}

export interface SlcDashboardSummary {
  softwareCount: number;
  projectCount: number;
  moduleCount: number;
  taskCount: number;
  changeCount: number;
  pendingChanges: number;
  delayedProjects: number;
  delayedModules: number;
  projectProgress: ProjectProgressItem[];
  developerStats: DeveloperStat[];
  topModulesByChange: { moduleId: number; moduleName: string; changeCount: number }[];
  changeByStatus: { status: number; count: number }[];
  recentAdjustments: TimelineAdjustment[];
}

export interface ProjectProgressItem {
  id: number;
  code: string;
  name: string;
  softwareName?: string;
  status: number;
  startDate?: string;
  endDate?: string;
  goLiveDate?: string;
  progress: number;
  moduleCount: number;
  isDelayed: boolean;
}

export interface DeveloperStat {
  assigneeCode: string;
  assigneeName?: string;
  moduleCount: number;
  avgProgress: number;
}

export interface PagedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

// Label helpers
export const PROJECT_STATUS_LABELS: Record<number, string> = {
  0: 'Lập kế hoạch',
  1: 'Đang thực hiện',
  2: 'Hoàn thành',
  3: 'Tạm dừng',
  4: 'Đã hủy',
};

export const MODULE_STATUS_LABELS: Record<number, string> = {
  0: 'Chưa bắt đầu',
  1: 'Đang thực hiện',
  2: 'Hoàn thành',
  3: 'Tạm dừng',
};

export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'Chưa bắt đầu',
  1: 'Đang thực hiện',
  2: 'Hoàn thành',
  3: 'Bị chặn',
};

export const CR_STATUS_LABELS: Record<number, string> = {
  0: 'Bản nháp',
  1: 'Chờ phê duyệt',
  2: 'Đã phê duyệt',
  3: 'Phân tích',
  4: 'Ước lượng',
  5: 'Đang phát triển',
  6: 'Kiểm thử',
  7: 'Xác nhận',
  8: 'Triển khai',
  9: 'Hoàn thành',
  10: 'Từ chối',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Thấp',
  2: 'Trung bình',
  3: 'Cao',
  4: 'Khẩn cấp',
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: 'default',
  2: 'blue',
  3: 'orange',
  4: 'red',
};

export const CR_STATUS_COLORS: Record<number, string> = {
  0: 'default',
  1: 'gold',
  2: 'green',
  3: 'blue',
  4: 'cyan',
  5: 'purple',
  6: 'geekblue',
  7: 'lime',
  8: 'orange',
  9: 'success',
  10: 'error',
};
