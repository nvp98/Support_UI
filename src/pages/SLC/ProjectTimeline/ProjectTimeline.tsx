import { useEffect, useState, useCallback } from "react";
import {
  Card, Button, Space, Select, Input, Progress, Modal, Form,
  DatePicker, InputNumber, Tooltip, Typography, Row, Col,
  Tag, Badge, message, Statistic, Empty, Spin, Pagination
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, CheckCircleFilled, ClockCircleFilled,
  PauseCircleFilled, MinusCircleFilled, RocketOutlined,
  CalendarOutlined, TeamOutlined
} from "@ant-design/icons";
import type { SlcProject, SlcModule, SoftwareCatalog } from "../../../models/slc";
import { PROJECT_STATUS_LABELS, MODULE_STATUS_LABELS } from "../../../models/slc";
import { projectApi, moduleApi, softwareApi } from "../../../services/slcApi";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const PROJECT_PAGE_SIZE = 10;

// ─── Colors ──────────────────────────────────────────────────
const MODULE_STATUS_BG: Record<number, string> = {
  0: "#e8e8e8", 1: "#1677ff", 2: "#52c41a", 3: "#faad14",
};
const MODULE_STATUS_ICON: Record<number, React.ReactNode> = {
  0: <MinusCircleFilled style={{ color: "#8c8c8c" }} />,
  1: <ClockCircleFilled style={{ color: "#1677ff" }} />,
  2: <CheckCircleFilled style={{ color: "#52c41a" }} />,
  3: <PauseCircleFilled style={{ color: "#faad14" }} />,
};
const PROJECT_BADGE: Record<number, any> = {
  0: "default", 1: "processing", 2: "success", 3: "warning", 4: "error",
};

// ─── Gantt helpers ────────────────────────────────────────────
const WEEK_COL_W = 52; // px per week-of-month column
const ROW_H = 36;      // px per module row (bar 28px + 8px gap)

type WeekSeg = {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  weekNum: number;       // 1–4 (week of month)
  monthLabel: string;
  isFirstOfMonth: boolean;
};

function buildWeekSegs(rangeStart: dayjs.Dayjs, rangeEnd: dayjs.Dayjs): WeekSeg[] {
  const segs: WeekSeg[] = [];
  let m = rangeStart.startOf("month");
  const limit = rangeEnd.startOf("month");
  while (!m.isAfter(limit)) {
    const dim = m.daysInMonth();
    const weekDefs: [number, number][] = [[1, 7], [8, 14], [15, 21], [22, dim]];
    weekDefs.forEach(([s, e], i) => {
      segs.push({
        start: m.date(s),
        end: m.date(Math.min(e, dim)),
        weekNum: i + 1,
        monthLabel: `Tháng ${m.month() + 1} / ${m.year()}`,
        isFirstOfMonth: i === 0,
      });
    });
    m = m.add(1, "month").startOf("month");
  }
  return segs;
}

function dateToPx(date: dayjs.Dayjs, segs: WeekSeg[]): number {
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (date.isBefore(s.start)) return i * WEEK_COL_W;
    if (!date.isAfter(s.end)) {
      const segDays = s.end.diff(s.start, "day") + 1;
      const off = date.diff(s.start, "day");
      return (i + off / segDays) * WEEK_COL_W;
    }
  }
  return segs.length * WEEK_COL_W;
}

// ─── Gantt bar component ──────────────────────────────────────
function GanttBar({
  modules,
  rangeStart,
  rangeEnd,
}: {
  modules: SlcModule[];
  rangeStart: dayjs.Dayjs;
  rangeEnd: dayjs.Dayjs;
}) {
  const segs = buildWeekSegs(rangeStart, rangeEnd);
  const totalWidth = segs.length * WEEK_COL_W;
  const today = dayjs();
  const todayX = dateToPx(today, segs);

  // Group by month for header row
  const monthGroups: { label: string; count: number }[] = [];
  segs.forEach((s) => {
    const last = monthGroups[monthGroups.length - 1];
    if (!last || last.label !== s.monthLabel)
      monthGroups.push({ label: s.monthLabel, count: 1 });
    else last.count++;
  });

  return (
    <div style={{ overflowX: "auto", overflowY: "visible" }}>
      <div style={{ width: totalWidth, minWidth: totalWidth, position: "relative" }}>

        {/* ── Header row 1: Month ─────────────────────── */}
        <div style={{ display: "flex", height: 24 }}>
          {monthGroups.map((mg, i) => (
            <div
              key={i}
              style={{
                width: mg.count * WEEK_COL_W,
                height: 24,
                background: "#f0f5ff",
                borderRight: "1px solid #adc6ff",
                borderBottom: "1px solid #adc6ff",
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "#2f54eb",
                whiteSpace: "nowrap",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {mg.label}
            </div>
          ))}
        </div>

        {/* ── Header row 2: Week of month ─────────────── */}
        <div style={{ display: "flex", height: 22 }}>
          {segs.map((s, i) => (
            <div
              key={i}
              style={{
                width: WEEK_COL_W,
                height: 22,
                flexShrink: 0,
                borderRight: "1px solid #f0f0f0",
                borderBottom: "1px solid #e0e0e0",
                borderLeft: s.isFirstOfMonth ? "1px solid #adc6ff" : undefined,
                background: s.isFirstOfMonth ? "#fafbff" : "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: "#595959", lineHeight: 1.2 }}>
                T{s.weekNum}
              </span>
              <span style={{ fontSize: 9, color: "#bfbfbf", lineHeight: 1.1 }}>
                {s.start.format("DD")}-{s.end.format("DD")}
              </span>
            </div>
          ))}
        </div>

        {/* ── Grid + Bars ─────────────────────────────── */}
        <div style={{ position: "relative", paddingTop: 4 }}>

          {/* Vertical grid lines per week */}
          {segs.map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: i * WEEK_COL_W,
                width: 1,
                background: s.isFirstOfMonth ? "#adc6ff" : "#f0f0f0",
                zIndex: 1,
              }}
            />
          ))}

          {/* Today's line */}
          {todayX >= 0 && todayX <= totalWidth && (
            <div
              style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: Math.round(todayX),
                width: 2,
                background: "#ff4d4f",
                zIndex: 10,
                borderRadius: 1,
              }}
            />
          )}

          {/* Module bars */}
          {modules.map((m) => {
            if (!m.startDate || !m.endDate) return null;
            const x1 = dateToPx(dayjs(m.startDate), segs);
            const x2 = dateToPx(dayjs(m.endDate), segs);
            const barW = Math.max(WEEK_COL_W * 0.2, x2 - x1);
            const color = MODULE_STATUS_BG[m.status] ?? "#1677ff";
            const isOnTrack = m.actualProgress >= m.plannedProgress;
            const isDelayed = m.endDate && dayjs(m.endDate).isBefore(dayjs(), "day") && m.status !== 2;
            const durationDays = dayjs(m.endDate).diff(dayjs(m.startDate), "day") + 1;
            const gap = m.actualProgress - m.plannedProgress;

            const tooltipContent = (
              <div style={{ minWidth: 230, fontSize: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {MODULE_STATUS_ICON[m.status]}
                  <span style={{ marginLeft: 5 }}>{m.name}</span>
                </div>
                <div style={{ color: "#aaa", fontSize: 11, marginBottom: 8 }}>
                  {m.code}{m.version && <span style={{ marginLeft: 8 }}>· {m.version}</span>}
                </div>

                <div style={{ marginBottom: 3 }}>
                  <span style={{ color: "#8c8c8c" }}>Thời gian: </span>
                  {m.startDate?.substring(0, 10)} → {m.endDate?.substring(0, 10)}
                  <span style={{ color: "#8c8c8c", marginLeft: 6 }}>({durationDays}d)</span>
                  {isDelayed && <span style={{ color: "#ff7875", marginLeft: 8, fontWeight: 600 }}>⚠ Trễ</span>}
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#8c8c8c" }}>Developer: </span>
                  {m.assigneeName ?? <span style={{ color: "#666" }}>Chưa phân công</span>}
                </div>

                <div style={{ marginBottom: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#8c8c8c", fontSize: 11 }}>Kế hoạch</span>
                    <span>{m.plannedProgress}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 3, height: 5 }}>
                    <div style={{ width: `${m.plannedProgress}%`, height: "100%", background: "rgba(255,255,255,0.45)", borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#8c8c8c", fontSize: 11 }}>Thực tế</span>
                    <span style={{ fontWeight: 700, color: color }}>{m.actualProgress}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 3, height: 5 }}>
                    <div style={{ width: `${m.actualProgress}%`, height: "100%", background: color, borderRadius: 3 }} />
                  </div>
                </div>

                <div style={{
                  padding: "3px 8px", borderRadius: 4, textAlign: "center", fontSize: 11, fontWeight: 600,
                  background: gap >= 0 ? "rgba(82,196,26,0.2)" : "rgba(255,77,79,0.2)",
                  color: gap >= 0 ? "#95de64" : "#ff7875",
                }}>
                  {gap >= 0 ? `✓ Đúng tiến độ (+${gap}%)` : `⚠ Chậm kế hoạch (${gap}%)`}
                </div>
              </div>
            );

            return (
              <Tooltip
                key={m.id}
                title={tooltipContent}
                color="#1e2a3a"
                placement="top"
                mouseEnterDelay={0.1}
                overlayStyle={{ maxWidth: 290 }}
              >
                <div style={{ position: "relative", height: ROW_H, cursor: "pointer" }}>
                  {/* Track */}
                  <div
                    style={{
                      position: "absolute",
                      left: x1, width: barW, top: 8, height: 20,
                      background: "#e8ecf0",
                      borderRadius: 5,
                      border: `1px solid ${isOnTrack ? "#b7eb8f" : "#ffb3b3"}`,
                      overflow: "hidden",
                      zIndex: 2,
                    }}
                  >
                    <div style={{ width: `${m.actualProgress}%`, height: "100%", background: color, opacity: m.status === 2 ? 1 : 0.82, transition: "width 0.35s ease" }} />
                    {m.plannedProgress > 0 && m.plannedProgress < 100 && (
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${m.plannedProgress}%`, width: 2, background: "rgba(0,0,0,0.25)", zIndex: 4 }} />
                    )}
                  </div>
                  {/* % label */}
                  {barW > 32 && (
                    <span style={{ position: "absolute", left: x1 + 5, top: 12, fontSize: 10, fontWeight: 600, color: m.actualProgress > 40 ? "#fff" : "#444", zIndex: 5, pointerEvents: "none", lineHeight: 1 }}>
                      {m.actualProgress}%
                    </span>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Module row item ──────────────────────────────────────────
function ModuleItem({
  m,
  onEdit,
  onDelete,
  onQuickProgress,
}: {
  m: SlcModule;
  onEdit: (m: SlcModule) => void;
  onDelete: (id: number) => void;
  onQuickProgress: (m: SlcModule) => void;
}) {
  const isDelayed =
    m.endDate &&
    dayjs(m.endDate).isBefore(dayjs(), "day") &&
    m.status !== 2;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderLeft: `4px solid ${MODULE_STATUS_BG[m.status] ?? "#e8e8e8"}`,
        background: "#fafafa",
        borderRadius: "0 6px 6px 0",
        marginBottom: 6,
      }}
    >
      <Row align="middle" gutter={8}>
        {/* Icon + Name */}
        <Col flex="auto">
          <Space align="center" size={6}>
            {MODULE_STATUS_ICON[m.status]}
            <div>
              <Text strong style={{ fontSize: 13 }}>{m.name}</Text>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                {m.code}
              </Text>
              {isDelayed && (
                <Tag color="error" style={{ marginLeft: 6, fontSize: 10 }}>Trễ</Tag>
              )}
            </div>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <TeamOutlined style={{ marginRight: 3 }} />
              {m.assigneeName ?? "—"}
              <span style={{ marginLeft: 12 }}>
                <CalendarOutlined style={{ marginRight: 3 }} />
                {m.startDate?.substring(0, 10) ?? "—"} → {m.endDate?.substring(0, 10) ?? "—"}
              </span>
              {m.version && (
                <Tag style={{ marginLeft: 8, fontSize: 10 }}>{m.version}</Tag>
              )}
            </Text>
          </div>
        </Col>

        {/* Progress */}
        <Col style={{ width: 160 }}>
          <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 2 }}>
            KH: {m.plannedProgress}% / TT: {m.actualProgress}%
          </div>
          <Progress
            percent={Math.round(m.actualProgress)}
            strokeColor={
              m.status === 2
                ? "#52c41a"
                : m.actualProgress < m.plannedProgress
                ? "#ff4d4f"
                : "#1677ff"
            }
            trailColor={m.status === 0 ? "#e8e8e8" : undefined}
            size="small"
            style={{ marginBottom: 0 }}
          />
        </Col>

        {/* Status tag */}
        <Col style={{ width: 110 }}>
          <Tag
            color={
              m.status === 2
                ? "success"
                : m.status === 1
                ? "processing"
                : m.status === 3
                ? "warning"
                : "default"
            }
            style={{ width: "100%", textAlign: "center" }}
          >
            {MODULE_STATUS_LABELS[m.status]}
          </Tag>
        </Col>

        {/* Actions */}
        <Col>
          <Space>
            <Tooltip title="Cập nhật tiến độ">
              <Button
                size="small"
                onClick={() => onQuickProgress(m)}
              >
                %
              </Button>
            </Tooltip>
            <Tooltip title="Sửa">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(m)} />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                size="small" danger icon={<DeleteOutlined />}
                onClick={() => onDelete(m.id)}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ProjectTimeline() {
  const [projects, setProjects] = useState<SlcProject[]>([]);
  const [softwares, setSoftwares] = useState<SoftwareCatalog[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectModules, setProjectModules] = useState<SlcModule[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotal, setProjectTotal] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<number | undefined>();

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingProject, setEditingProject] = useState<SlcProject | null>(null);
  const [editingModule, setEditingModule] = useState<SlcModule | null>(null);
  const [projectForm] = Form.useForm();
  const [moduleForm] = Form.useForm();

  // Quick progress update
  const [quickUpdateTarget, setQuickUpdateTarget] = useState<SlcModule | null>(null);
  const [quickProgress, setQuickProgress] = useState<number>(0);

  // ─ Data loaders ────────────────────────────────────────────
  const loadSoftwares = useCallback(async () => {
    const res = await softwareApi.getAll({ status: 1 });
    setSoftwares(res);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await projectApi.getAll({
        softwareId: softwareFilter,
        status: statusFilter,
        keyword: keyword || undefined,
        page: projectPage,
        pageSize: PROJECT_PAGE_SIZE,
      });
      setProjects(res.items);
      setProjectTotal(res.total);

      if (res.items.length === 0 && projectPage > 1 && res.total > 0) {
        setProjectPage(projectPage - 1);
      }
    } finally {
      setLoadingProjects(false);
    }
  }, [softwareFilter, statusFilter, keyword, projectPage]);

  const loadProjectModules = useCallback(async (projectId: number) => {
    setLoadingModules(true);
    try {
      const res = await moduleApi.getAll({ projectId, pageSize: 200 });
      setProjectModules(res.items);
    } finally {
      setLoadingModules(false);
    }
  }, []);

  useEffect(() => { loadSoftwares(); }, [loadSoftwares]);
  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => {
    if (selectedProjectId) loadProjectModules(selectedProjectId);
    else setProjectModules([]);
  }, [selectedProjectId, loadProjectModules]);

  // ─ Derived data ────────────────────────────────────────────
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const moduleStats = {
    total: projectModules.length,
    done: projectModules.filter((m) => m.status === 2).length,
    inProgress: projectModules.filter((m) => m.status === 1).length,
    notStarted: projectModules.filter((m) => m.status === 0).length,
    onHold: projectModules.filter((m) => m.status === 3).length,
  };

  const weightedProgress =
    projectModules.length > 0
      ? (() => {
          const totalW = projectModules.reduce((s, m) => s + m.weight, 0);
          return totalW > 0
            ? Math.round(
                projectModules.reduce((s, m) => s + m.actualProgress * m.weight, 0) / totalW
              )
            : 0;
        })()
      : 0;

  // Gantt date range
  const modulesWithDates = projectModules.filter((m) => m.startDate && m.endDate);
  const ganttStart =
    modulesWithDates.length > 0
      ? dayjs(
          modulesWithDates.reduce((min, m) =>
            dayjs(m.startDate!).isBefore(dayjs(min)) ? m.startDate! : min,
            modulesWithDates[0].startDate!
          )
        ).subtract(3, "day")
      : selectedProject?.startDate
      ? dayjs(selectedProject.startDate)
      : dayjs().startOf("month");

  const ganttEnd =
    modulesWithDates.length > 0
      ? dayjs(
          modulesWithDates.reduce((max, m) =>
            dayjs(m.endDate!).isAfter(dayjs(max)) ? m.endDate! : max,
            modulesWithDates[0].endDate!
          )
        ).add(3, "day")
      : selectedProject?.endDate
      ? dayjs(selectedProject.endDate)
      : dayjs().endOf("month");

  // ─ Handlers ────────────────────────────────────────────────
  const handleSaveProject = async (values: any) => {
    const data = {
      ...values,
      startDate: values.startDate?.format("YYYY-MM-DD"),
      endDate: values.endDate?.format("YYYY-MM-DD"),
      goLiveDate: values.goLiveDate?.format("YYYY-MM-DD"),
    };
    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, data);
        message.success("Cập nhật dự án thành công");
      } else {
        await projectApi.create(data);
        message.success("Tạo dự án thành công");
      }
      setShowProjectModal(false);
      projectForm.resetFields();
      setEditingProject(null);
      loadProjects();
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleSaveModule = async (values: any) => {
    const data = {
      ...values,
      startDate: values.startDate?.format("YYYY-MM-DD"),
      endDate: values.endDate?.format("YYYY-MM-DD"),
      projectId: selectedProjectId,
    };
    try {
      if (editingModule) {
        await moduleApi.update(editingModule.id, data);
        message.success("Cập nhật module thành công");
      } else {
        await moduleApi.create(data);
        message.success("Tạo module thành công");
      }
      setShowModuleModal(false);
      moduleForm.resetFields();
      setEditingModule(null);
      if (selectedProjectId) loadProjectModules(selectedProjectId);
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleDeleteProject = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa dự án?",
      content: "Tất cả module thuộc dự án cũng sẽ bị xóa.",
      onOk: async () => {
        try {
          await projectApi.delete(id);
          message.success("Đã xóa dự án");
          if (selectedProjectId === id) setSelectedProjectId(null);
          loadProjects();
        } catch (e: any) {
          message.error(e?.message ?? "Không thể xóa");
        }
      },
    });
  };

  const handleDeleteModule = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa module?",
      onOk: async () => {
        await moduleApi.delete(id);
        message.success("Đã xóa module");
        if (selectedProjectId) loadProjectModules(selectedProjectId);
      },
    });
  };

  const handleProgressUpdate = async (m: SlcModule, progress: number) => {
    const status = progress >= 100 ? 2 : progress > 0 ? 1 : m.status;
    await moduleApi.updateProgress(m.id, { actualProgress: progress, status });
    message.success(`Đã cập nhật: ${m.name}`);
    if (selectedProjectId) loadProjectModules(selectedProjectId);
  };

  const openQuickProgress = (m: SlcModule) => {
    setQuickUpdateTarget(m);
    setQuickProgress(m.actualProgress);
  };

  const openEditProject = (p: SlcProject) => {
    setEditingProject(p);
    projectForm.setFieldsValue({
      ...p,
      startDate: p.startDate ? dayjs(p.startDate) : null,
      endDate: p.endDate ? dayjs(p.endDate) : null,
      goLiveDate: p.goLiveDate ? dayjs(p.goLiveDate) : null,
    });
    setShowProjectModal(true);
  };

  const openEditModule = (m: SlcModule) => {
    setEditingModule(m);
    moduleForm.setFieldsValue({
      ...m,
      startDate: m.startDate ? dayjs(m.startDate) : null,
      endDate: m.endDate ? dayjs(m.endDate) : null,
    });
    setShowModuleModal(true);
  };

  // ─ Progress color ───────────────────────────────────────────
  const progressColor =
    weightedProgress >= 80
      ? "#52c41a"
      : weightedProgress >= 50
      ? "#1677ff"
      : weightedProgress >= 20
      ? "#faad14"
      : "#ff4d4f";

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 120px)", overflow: "hidden" }}>
      {/* ══════════════════════════════════════════════════════
          LEFT PANEL: Project List
         ══════════════════════════════════════════════════════ */}
      <div
        style={{
          width: 280,
          minWidth: 260,
          borderRight: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #f0f0f0" }}>
          <div className="flex items-center justify-between mb-2">
            <Text strong style={{ fontSize: 13 }}>Danh sách Dự án</Text>
            <Space>
              <Button
                size="small" type="primary" icon={<PlusOutlined />}
                onClick={() => { setEditingProject(null); projectForm.resetFields(); setShowProjectModal(true); }}
              />
              <Button
                size="small" icon={<ReloadOutlined />}
                onClick={loadProjects}
              />
            </Space>
          </div>
          <Search
            placeholder="Tìm dự án..."
            size="small"
            onSearch={(value) => {
              setSelectedProjectId(null);
              setProjectPage(1);
              setKeyword(value);
            }}
            onChange={(e) => {
              if (!e.target.value) {
                setSelectedProjectId(null);
                setProjectPage(1);
                setKeyword("");
              }
            }}
            allowClear
            style={{ marginBottom: 6 }}
          />
          <Row gutter={4}>
            <Col span={13}>
              <Select
                placeholder="Phần mềm"
                size="small"
                style={{ width: "100%" }}
                allowClear
                onChange={(value) => {
                  setSelectedProjectId(null);
                  setProjectPage(1);
                  setSoftwareFilter(value);
                }}
              >
                {softwares.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
              </Select>
            </Col>
            <Col span={11}>
              <Select
                placeholder="Trạng thái"
                size="small"
                style={{ width: "100%" }}
                allowClear
                onChange={(value) => {
                  setSelectedProjectId(null);
                  setProjectPage(1);
                  setStatusFilter(value);
                }}
              >
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                  <Option key={k} value={Number(k)}>{v}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        {/* Project list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {loadingProjects ? (
            <div className="flex justify-center pt-8"><Spin /></div>
          ) : projects.length === 0 ? (
            <Empty description="Chưa có dự án" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              const isDelayed =
                p.endDate && dayjs(p.endDate).isBefore(dayjs(), "day") &&
                p.status !== 2 && p.status !== 4;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  style={{
                    padding: "10px 10px",
                    marginBottom: 4,
                    borderRadius: 6,
                    cursor: "pointer",
                    border: `1px solid ${isSelected ? "#1677ff" : "#f0f0f0"}`,
                    background: isSelected ? "#e6f4ff" : "#fafafa",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Space size={4}>
                      <Badge status={PROJECT_BADGE[p.status]} />
                      <Text
                        strong={isSelected}
                        style={{ fontSize: 12, color: isSelected ? "#1677ff" : undefined }}
                      >
                        {p.name}
                      </Text>
                    </Space>
                    {isSelected && (
                      <Space size={2}>
                        <Tooltip title="Sửa">
                          <EditOutlined
                            style={{ color: "#8c8c8c", fontSize: 12 }}
                            onClick={(e) => { e.stopPropagation(); openEditProject(p); }}
                          />
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <DeleteOutlined
                            style={{ color: "#ff4d4f", fontSize: 12, marginLeft: 4 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                          />
                        </Tooltip>
                      </Space>
                    )}
                  </div>
                  <div className="flex items-center" style={{ marginTop: 3, minWidth: 0 }}>
                    <Tag
                      color="blue"
                      bordered={false}
                      style={{ marginRight: 5, fontSize: 10, lineHeight: "18px", maxWidth: 160 }}
                    >
                      {p.softwareName ?? "Chưa gán phần mềm"}
                    </Tag>
                    <Text type="secondary" ellipsis style={{ fontSize: 10, minWidth: 0 }}>
                      {p.code}
                    </Text>
                    {isDelayed && <Tag color="error" style={{ marginLeft: 4, fontSize: 10, padding: "0 4px" }}>Trễ</Tag>}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Progress
                      percent={Math.round(p.progress ?? 0)}
                      size="small"
                      strokeColor={
                        (p.progress ?? 0) >= 80 ? "#52c41a"
                        : (p.progress ?? 0) >= 40 ? "#1677ff"
                        : "#faad14"
                      }
                      format={(pct) => <span style={{ fontSize: 10 }}>{pct}%</span>}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "#8c8c8c", marginTop: 2 }}>
                    {p.moduleCount ?? 0} module
                    {p.goLiveDate && ` · Go-live: ${p.goLiveDate.substring(0, 10)}`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Project pagination */}
        {projectTotal > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              minHeight: 42,
              padding: "6px 10px",
              borderTop: "1px solid #f0f0f0",
              background: "#fff",
            }}
          >
            <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
              {projectTotal} dự án
            </Text>
            <Pagination
              simple
              size="small"
              current={projectPage}
              pageSize={PROJECT_PAGE_SIZE}
              total={projectTotal}
              showSizeChanger={false}
              onChange={(page) => {
                setSelectedProjectId(null);
                setProjectPage(page);
              }}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL: Project Detail
         ══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f8f9fa", padding: 16 }}>
        {!selectedProject ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Empty
              description={<Text type="secondary">Chọn một dự án để xem tiến độ chi tiết</Text>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            {/* ── Project Header ─────────────────────────────── */}
            <Card
              size="small"
              style={{ marginBottom: 12, borderRadius: 8 }}
              bodyStyle={{ padding: "14px 20px" }}
            >
              <Row align="middle" gutter={24}>
                <Col flex="auto">
                  <div className="flex items-center gap-3">
                    <RocketOutlined style={{ fontSize: 22, color: "#1677ff" }} />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{selectedProject.name}</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedProject.softwareName} · {selectedProject.code}
                        {selectedProject.version && ` · ${selectedProject.version}`}
                      </Text>
                    </div>
                    <Tag
                      color={
                        selectedProject.status === 2 ? "success"
                        : selectedProject.status === 1 ? "processing"
                        : selectedProject.status === 3 ? "warning"
                        : selectedProject.status === 4 ? "error"
                        : "default"
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {PROJECT_STATUS_LABELS[selectedProject.status]}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {selectedProject.startDate?.substring(0, 10) ?? "—"} →{" "}
                      {selectedProject.endDate?.substring(0, 10) ?? "—"}
                      {selectedProject.goLiveDate && (
                        <Tag color="blue" style={{ marginLeft: 12 }}>
                          Go-live: {selectedProject.goLiveDate.substring(0, 10)}
                        </Tag>
                      )}
                    </Text>
                  </div>
                </Col>

                {/* Overall Progress */}
                <Col style={{ minWidth: 200 }}>
                  <div style={{ textAlign: "center" }}>
                    <Text style={{ fontSize: 11, color: "#8c8c8c" }}>TIẾN ĐỘ TỔNG THỂ</Text>
                    <Progress
                      type="circle"
                      percent={weightedProgress}
                      size={80}
                      strokeColor={progressColor}
                      format={(pct) => (
                        <span style={{ fontSize: 16, fontWeight: 700, color: progressColor }}>
                          {pct}%
                        </span>
                      )}
                    />
                    <div style={{ fontSize: 10, color: "#8c8c8c", marginTop: 2 }}>
                      (tính theo trọng số)
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* ── Stats Row ───────────────────────────────────── */}
            <Row gutter={8} style={{ marginBottom: 12 }}>
              {[
                { label: "Tổng Module", value: moduleStats.total, color: "#1677ff", suffix: "module" },
                { label: "Hoàn thành", value: moduleStats.done, color: "#52c41a", suffix: "" },
                { label: "Đang thực hiện", value: moduleStats.inProgress, color: "#1677ff", suffix: "" },
                { label: "Chưa bắt đầu", value: moduleStats.notStarted, color: "#8c8c8c", suffix: "" },
                { label: "Tạm dừng", value: moduleStats.onHold, color: "#faad14", suffix: "" },
              ].map((s) => (
                <Col key={s.label} flex="1">
                  <Card
                    size="small"
                    style={{ borderRadius: 6, textAlign: "center" }}
                    bodyStyle={{ padding: "8px 4px" }}
                  >
                    <Statistic
                      title={<span style={{ fontSize: 11 }}>{s.label}</span>}
                      value={s.value}
                      valueStyle={{ fontSize: 22, color: s.color, fontWeight: 700 }}
                      suffix={s.suffix}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* ── Module List ─────────────────────────────────── */}
            <Card
              size="small"
              style={{ marginBottom: 12, borderRadius: 8 }}
              title={
                <Space>
                  <Text strong>Danh sách Module</Text>
                  <Tag>{moduleStats.total}</Tag>
                </Space>
              }
              extra={
                <Button
                  type="primary" size="small" icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingModule(null);
                    moduleForm.resetFields();
                    moduleForm.setFieldsValue({ projectId: selectedProjectId });
                    setShowModuleModal(true);
                  }}
                >
                  Thêm Module
                </Button>
              }
            >
              {loadingModules ? (
                <div className="flex justify-center py-4"><Spin /></div>
              ) : projectModules.length === 0 ? (
                <Empty
                  description="Chưa có module nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: "16px 0" }}
                />
              ) : (
                <div
                  style={{
                    maxHeight: 520,
                    overflowY: "auto",
                    paddingRight: 4,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#d9d9d9 transparent",
                  }}
                >
                  {/* Sort: InProgress first, then NotStarted, then Done, then OnHold */}
                  {[1, 0, 3, 2].flatMap((statusGroup) =>
                    projectModules
                      .filter((m) => m.status === statusGroup)
                      .map((m) => (
                        <ModuleItem
                          key={m.id}
                          m={m}
                          onEdit={openEditModule}
                          onDelete={handleDeleteModule}
                          onQuickProgress={openQuickProgress}
                        />
                      ))
                  )}
                </div>
              )}
            </Card>

            {/* ── Gantt Timeline ───────────────────────────────── */}
            {modulesWithDates.length > 0 && (
              <Card
                size="small"
                style={{ borderRadius: 8 }}
                title={<Text strong>Timeline Gantt</Text>}
                extra={
                  <Space style={{ fontSize: 11 }}>
                    {[
                      { color: "#e8e8e8", label: "Chưa bắt đầu" },
                      { color: "#1677ff", label: "Đang thực hiện" },
                      { color: "#52c41a", label: "Hoàn thành" },
                      { color: "#faad14", label: "Tạm dừng" },
                      { color: "#ff4d4f", label: "Hôm nay" },
                    ].map((item) => (
                      <Space key={item.label} size={3}>
                        <div style={{
                          width: item.color === "#ff4d4f" ? 2 : 12,
                          height: 12,
                          background: item.color,
                          borderRadius: item.color === "#ff4d4f" ? 0 : 2,
                          display: "inline-block",
                        }} />
                        <span style={{ color: "#8c8c8c" }}>{item.label}</span>
                      </Space>
                    ))}
                  </Space>
                }
              >
                <Row>
                  {/* Module name labels – heights must match GanttBar rows exactly */}
                  <Col style={{ width: 200, paddingRight: 8, flexShrink: 0 }}>
                    {/* Spacer for month header (24) + week header (22) + paddingTop (4) */}
                    <div style={{ height: 50 }} />
                    {modulesWithDates.map((m) => (
                      <Tooltip key={m.id} title={`${m.code} · ${m.startDate?.substring(0,10)} → ${m.endDate?.substring(0,10)}`} placement="right">
                        <div
                          style={{
                            height: ROW_H,
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                          }}
                        >
                          <Space size={4}>
                            {MODULE_STATUS_ICON[m.status]}
                            <Text
                              style={{ fontSize: 11, maxWidth: 160 }}
                              ellipsis
                            >
                              {m.name}
                            </Text>
                          </Space>
                        </div>
                      </Tooltip>
                    ))}
                  </Col>

                  {/* Gantt bars */}
                  <Col flex="auto" style={{ overflow: "hidden" }}>
                    <GanttBar
                      modules={modulesWithDates}
                      rangeStart={ganttStart}
                      rangeEnd={ganttEnd}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          Modals
         ══════════════════════════════════════════════════════ */}

      {/* Project Modal */}
      <Modal
        title={editingProject ? "Sửa Dự án" : "Thêm Dự án mới"}
        open={showProjectModal}
        onOk={() => projectForm.submit()}
        onCancel={() => { setShowProjectModal(false); setEditingProject(null); }}
        width={640}
        destroyOnClose
      >
        <Form form={projectForm} layout="vertical" onFinish={handleSaveProject}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Mã dự án" rules={[{ required: true }]}>
                <Input disabled={!!editingProject} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên dự án" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="softwareId" label="Phần mềm" rules={[{ required: true }]}>
                <Select>
                  {softwares.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái" initialValue={0}>
                <Select>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="version" label="Phiên bản">
                <Input placeholder="v1.0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="startDate" label="Bắt đầu">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endDate" label="Kết thúc">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="goLiveDate" label="Go-live">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="weight" label="Trọng số (cho tính tiến độ tổng)" initialValue={1}>
            <InputNumber min={0.1} max={100} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Module Modal */}
      <Modal
        title={editingModule ? "Sửa Module" : "Thêm Module"}
        open={showModuleModal}
        onOk={() => moduleForm.submit()}
        onCancel={() => { setShowModuleModal(false); setEditingModule(null); }}
        width={640}
        destroyOnClose
      >
        <Form form={moduleForm} layout="vertical" onFinish={handleSaveModule}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Mã module" rules={[{ required: true }]}>
                <Input disabled={!!editingModule} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên module" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="assigneeCode" label="Mã Developer"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigneeName" label="Tên Developer"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Ngày kết thúc">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái" initialValue={0}>
                <Select>
                  {Object.entries(MODULE_STATUS_LABELS).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="plannedProgress" label="KH (%)" initialValue={0}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="actualProgress" label="TT (%)" initialValue={0}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="weight" label="Trọng số" initialValue={1}>
                <InputNumber min={0.1} max={100} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="version" label="Phiên bản">
                <Input placeholder="v1.0" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Quick Progress Modal */}
      <Modal
        title={`Cập nhật tiến độ: ${quickUpdateTarget?.name}`}
        open={!!quickUpdateTarget}
        onOk={async () => {
          if (!quickUpdateTarget) return;
          await handleProgressUpdate(quickUpdateTarget, quickProgress);
          setQuickUpdateTarget(null);
        }}
        onCancel={() => setQuickUpdateTarget(null)}
        width={320}
        destroyOnClose
      >
        <div style={{ padding: "12px 0" }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#8c8c8c" }}>
            Kế hoạch: {quickUpdateTarget?.plannedProgress}% / Hiện tại: {quickUpdateTarget?.actualProgress}%
          </div>
          <InputNumber
            value={quickProgress}
            onChange={(v) => setQuickProgress(v ?? 0)}
            min={0} max={100} step={5}
            style={{ width: "100%" }}
            addonAfter="%"
            size="large"
          />
          <Progress
            percent={quickProgress}
            strokeColor={
              quickProgress >= 100 ? "#52c41a"
              : quickProgress >= (quickUpdateTarget?.plannedProgress ?? 0) ? "#1677ff"
              : "#faad14"
            }
            style={{ marginTop: 12 }}
          />
          {quickProgress >= 100 && (
            <div style={{ color: "#52c41a", fontSize: 12, marginTop: 4 }}>
              Sẽ tự động chuyển trạng thái → Hoàn thành
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
