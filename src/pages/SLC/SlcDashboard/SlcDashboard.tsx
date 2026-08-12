import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Card, Col, Row, Statistic, Table, Tag, Progress, Spin,
  Typography, Badge, Divider, Tooltip, Space, Slider,
} from "antd";
import {
  AppstoreOutlined, ProjectOutlined, CodeOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { slcDashboardApi } from "../../../services/slcApi";
import type { SlcDashboardSummary, ProjectProgressItem } from "../../../models/slc";
import { CR_STATUS_LABELS, PROJECT_STATUS_LABELS } from "../../../models/slc";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<number, string> = {
  0: "#8c8c8c", 1: "#1677ff", 2: "#52c41a", 3: "#faad14", 4: "#ff4d4f",
};
const STATUS_BG: Record<number, string> = {
  0: "#f5f5f5", 1: "#e6f4ff", 2: "#f6ffed", 3: "#fffbe6", 4: "#fff2f0",
};

const MONTH_COL_W = 58;
const ROW_H = 44;
const LABEL_W = 210;

// ─── Overview Gantt ────────────────────────────────────────────
function OverviewGantt({ projects }: { projects: ProjectProgressItem[] }) {
  // All hooks BEFORE any early return
  const allMonths = useMemo(() => {
    const withDates = projects.filter((p) => p.startDate && p.endDate);
    if (withDates.length === 0) return [];
    const all = withDates.flatMap((p) => [dayjs(p.startDate!), dayjs(p.endDate!)]);
    const minD = all.reduce((a, b) => (a.isBefore(b) ? a : b));
    const maxD = all.reduce((a, b) => (a.isAfter(b) ? a : b));
    const result: { start: dayjs.Dayjs; label: string; yearLabel: string }[] = [];
    let cur = minD.startOf("month");
    while (!cur.isAfter(maxD.endOf("month"))) {
      result.push({ start: cur.clone(), label: `T${cur.month() + 1}`, yearLabel: cur.format("YYYY") });
      cur = cur.add(1, "month");
    }
    return result;
  }, [projects]);

  // Range slider: [startIndex, endIndex] into allMonths
  const [range, setRange] = useState<[number, number]>([0, 0]);

  // Init / update range when months list changes
  useEffect(() => {
    if (allMonths.length > 0) {
      setRange((prev) => {
        const newEnd = allMonths.length - 1;
        // First init: set full range; subsequent: preserve user selection if valid
        if (prev[1] === 0 && prev[0] === 0) return [0, newEnd];
        return [Math.min(prev[0], newEnd), Math.min(prev[1], newEnd)];
      });
    }
  }, [allMonths.length]);

  // Drag-to-pan on the gantt area
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragState.current = { active: true, startX: e.pageX, scrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.style.cursor = "grabbing";
    scrollRef.current.style.userSelect = "none";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const s = dragState.current;
    if (!s.active || !scrollRef.current) return;
    scrollRef.current.scrollLeft = s.scrollLeft - (e.pageX - s.startX);
  };
  const stopDrag = () => {
    dragState.current.active = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
      scrollRef.current.style.userSelect = "";
    }
  };

  // ── Early return after all hooks ───────────────────
  const withDates = projects.filter((p) => p.startDate && p.endDate);
  if (withDates.length === 0 || allMonths.length === 0)
    return <Text type="secondary">Không có dữ liệu ngày tháng.</Text>;

  // ── Derived from range ─────────────────────────────
  const rStart = Math.max(0, range[0]);
  const rEnd = Math.min(allMonths.length - 1, Math.max(range[0], range[1]));
  const visibleMonths = allMonths.slice(rStart, rEnd + 1);
  if (visibleMonths.length === 0) return null;

  const gridStart = visibleMonths[0].start;
  const gridEnd = visibleMonths[visibleMonths.length - 1].start.endOf("month");
  const totalDays = gridEnd.diff(gridStart, "day") + 1;
  const totalWidth = visibleMonths.length * MONTH_COL_W;

  const toPx = (date: dayjs.Dayjs): number => {
    const d = Math.max(0, Math.min(totalDays, date.diff(gridStart, "day")));
    return (d / totalDays) * totalWidth;
  };

  const today = dayjs();
  const todayX = toPx(today);
  const todayInRange = !today.isBefore(gridStart, "day") && !today.isAfter(gridEnd, "day");

  // Year groups for header
  const yearGroups: { year: string; count: number }[] = [];
  visibleMonths.forEach((m) => {
    const last = yearGroups[yearGroups.length - 1];
    if (!last || last.year !== m.yearLabel) yearGroups.push({ year: m.yearLabel, count: 1 });
    else last.count++;
  });

  // Slider marks — show label every 3 months if > 12
  const sliderMarks: Record<number, React.ReactNode> = {};
  allMonths.forEach((m, i) => {
    if (allMonths.length <= 12 || i % 3 === 0 || i === allMonths.length - 1) {
      sliderMarks[i] = (
        <span style={{ fontSize: 9, color: "#8c8c8c" }}>
          {m.label}
          {(i === 0 || m.start.month() === 0) && (
            <span style={{ display: "block", color: "#bfbfbf", fontSize: 8 }}>{m.yearLabel}</span>
          )}
        </span>
      );
    }
  });

  return (
    <div>
      {/* ── Scrollable Gantt area ─────────────────── */}
      <div
        ref={scrollRef}
        style={{ overflowX: "auto", overflowY: "hidden", cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <div style={{ minWidth: LABEL_W + totalWidth, position: "relative" }}>

          {/* Header */}
          <div style={{ display: "flex" }}>
            <div style={{ width: LABEL_W, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {/* Year row */}
              <div style={{ display: "flex", height: 20 }}>
                {yearGroups.map((yg, i) => (
                  <div key={i} style={{
                    width: yg.count * MONTH_COL_W, height: 20,
                    background: "#e6f4ff", borderRight: "1px solid #91caff",
                    borderBottom: "1px solid #91caff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#0958d9", flexShrink: 0,
                  }}>
                    {yg.year}
                  </div>
                ))}
              </div>
              {/* Month row */}
              <div style={{ display: "flex", height: 22 }}>
                {visibleMonths.map((m, i) => (
                  <div key={i} style={{
                    width: MONTH_COL_W, height: 22, flexShrink: 0,
                    borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #e0e0e0",
                    background: today.isSame(m.start, "month") ? "#fff7e6" : "#fafafa",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11,
                    fontWeight: today.isSame(m.start, "month") ? 700 : 400,
                    color: today.isSame(m.start, "month") ? "#d46b08" : "#8c8c8c",
                  }}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project rows */}
          <div style={{ position: "relative" }}>
            {withDates.map((p, idx) => {
              const x1 = toPx(dayjs(p.startDate!));
              const x2 = toPx(dayjs(p.endDate!));
              const barW = Math.max(14, x2 - x1);
              const color = STATUS_COLOR[p.status];
              const goLiveX = p.goLiveDate ? toPx(dayjs(p.goLiveDate)) : null;
              const isDelayed = p.endDate && dayjs(p.endDate).isBefore(today, "day") && p.status !== 2 && p.status !== 4;

              const tooltipContent = (
                <div style={{ minWidth: 220, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ color: "#aaa", marginBottom: 8 }}>
                    {p.code}{p.softwareName && <span style={{ marginLeft: 8 }}>· {p.softwareName}</span>}
                  </div>
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ color: "#8c8c8c" }}>Thời gian: </span>
                    {p.startDate?.substring(0, 10)} → {p.endDate?.substring(0, 10)}
                  </div>
                  {p.goLiveDate && (
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ color: "#8c8c8c" }}>Go-live: </span>
                      <span style={{ color: "#722ed1", fontWeight: 700 }}>{p.goLiveDate.substring(0, 10)}</span>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#8c8c8c" }}>Modules: </span>
                    {p.moduleCount}
                    {isDelayed && <span style={{ color: "#ff7875", marginLeft: 10, fontWeight: 600 }}>⚠ Trễ hạn</span>}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#8c8c8c", fontSize: 11 }}>Tiến độ tổng thể</span>
                      <span style={{ fontWeight: 700, color: color }}>{Math.round(p.progress)}%</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 3, height: 6, marginTop: 3 }}>
                      <div style={{ width: `${p.progress}%`, height: "100%", background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );

              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", height: ROW_H,
                  background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                }}>
                  {/* Label */}
                  <div style={{ width: LABEL_W, flexShrink: 0, padding: "0 10px 0 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <Text strong style={{ fontSize: 12, maxWidth: 170 }} ellipsis={{ tooltip: p.name }}>
                        {p.name}
                      </Text>
                    </div>
                    <div style={{ paddingLeft: 14, marginTop: 2 }}>
                      <Tag style={{ fontSize: 10, padding: "0 4px", background: STATUS_BG[p.status], border: `1px solid ${color}60`, color }}>
                        {PROJECT_STATUS_LABELS[p.status]}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>{p.moduleCount} modules</Text>
                    </div>
                  </div>

                  {/* Bar area */}
                  <div style={{ flex: 1, position: "relative", height: "100%" }}>
                    {/* Month grid lines */}
                    {visibleMonths.map((_, i) => (
                      <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: i * MONTH_COL_W, width: 1, background: "#f0f0f0" }} />
                    ))}

                    {/* Today line */}
                    {todayInRange && (
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: Math.round(todayX), width: 2, background: "#ff4d4f", zIndex: 8, borderRadius: 1 }} />
                    )}

                    {/* Bar */}
                    <Tooltip title={tooltipContent} color="#1e2a3a" placement="top" mouseEnterDelay={0.1} overlayStyle={{ maxWidth: 280 }}>
                      <div style={{ position: "absolute", left: x1, width: barW, top: 10, height: 24, cursor: "pointer", zIndex: 2 }}>
                        <div style={{
                          width: "100%", height: "100%",
                          background: `${color}20`,
                          border: `1.5px solid ${isDelayed ? "#ff7875" : color}80`,
                          borderRadius: 5, overflow: "hidden",
                        }}>
                          <div style={{ width: `${p.progress}%`, height: "100%", background: color, opacity: p.status === 2 ? 1 : 0.75, transition: "width 0.4s ease" }} />
                        </div>
                        {barW > 40 && (
                          <span style={{ position: "absolute", left: 6, top: 4, fontSize: 10, fontWeight: 700, color: p.progress > 45 ? "#fff" : color, pointerEvents: "none", zIndex: 3 }}>
                            {Math.round(p.progress)}%
                          </span>
                        )}
                      </div>
                    </Tooltip>

                    {/* Go-live ◆ */}
                    {goLiveX !== null && goLiveX >= 0 && goLiveX <= totalWidth && (
                      <Tooltip title={<span><CalendarOutlined style={{ marginRight: 4 }} />Go-live: <strong>{p.goLiveDate?.substring(0, 10)}</strong></span>} placement="top">
                        <div style={{
                          position: "absolute", left: goLiveX - 7, top: 17,
                          width: 14, height: 14, background: "#722ed1",
                          transform: "rotate(45deg)", cursor: "pointer", zIndex: 9,
                          border: "1.5px solid #531dab", borderRadius: 2,
                        }} />
                      </Tooltip>
                    )}

                    {/* Delayed label */}
                    {isDelayed && x2 + 4 <= totalWidth && (
                      <span style={{ position: "absolute", left: x2 + 4, top: 14, fontSize: 10, color: "#ff4d4f", fontWeight: 600, whiteSpace: "nowrap", zIndex: 3 }}>
                        ⚠ Trễ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today label */}
          {todayInRange && (
            <div style={{ display: "flex" }}>
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              <div style={{ flex: 1, position: "relative", height: 18 }}>
                <span style={{ position: "absolute", left: Math.round(todayX) - 18, top: 2, fontSize: 10, color: "#ff4d4f", fontWeight: 700, whiteSpace: "nowrap" }}>
                  ▲ Hôm nay
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Time range slider ─────────────────────── */}
      {allMonths.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", marginTop: 8, paddingBottom: 4 }}>
          <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: 8 }}>
            <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
              {allMonths[rStart].label}/{allMonths[rStart].yearLabel}
              {" → "}
              {allMonths[rEnd].label}/{allMonths[rEnd].yearLabel}
            </Text>
          </div>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <Slider
              range
              min={0}
              max={allMonths.length - 1}
              value={[rStart, rEnd]}
              onChange={(val) => setRange(val as [number, number])}
              marks={sliderMarks}
              tooltip={{
                formatter: (v) => {
                  const m = allMonths[v ?? 0];
                  return m ? `${m.label}/${m.yearLabel}` : "";
                },
              }}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
const statusTableColor: Record<number, string> = {
  0: "#8c8c8c", 1: "#1890ff", 2: "#52c41a", 3: "#faad14", 4: "#ff4d4f",
};

export default function SlcDashboard() {
  const [data, setData] = useState<SlcDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    slcDashboardApi.getSummary().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;
  if (!data) return null;

  const projectColumns = [
    {
      title: "Dự án", dataIndex: "name", key: "name",
      render: (v: string, r: any) => (
        <span>{v} {r.isDelayed && <Badge color="red" text="Trễ" />}</span>
      ),
    },
    { title: "Phần mềm", dataIndex: "softwareName", key: "sw" },
    {
      title: "Trạng thái", dataIndex: "status", key: "status",
      render: (v: number) => <Tag color={statusTableColor[v]}>{PROJECT_STATUS_LABELS[v]}</Tag>,
    },
    {
      title: "Tiến độ", dataIndex: "progress", key: "progress",
      render: (v: number) => <Progress percent={Math.round(v)} size="small" />,
    },
    {
      title: "Go-live", dataIndex: "goLiveDate", key: "gl",
      render: (v: string) => v ? v.substring(0, 10) : "—",
    },
  ];

  const crStatusColumns = [
    {
      title: "Trạng thái", dataIndex: "status", key: "status",
      render: (v: number) => <Tag>{CR_STATUS_LABELS[v] ?? v}</Tag>,
    },
    { title: "Số lượng", dataIndex: "count", key: "count" },
  ];

  return (
    <div className="p-4">
      <Title level={4} className="mb-4">
        <AppstoreOutlined className="mr-2" />
        Dashboard - Vòng đời Phần mềm
      </Title>

      {/* KPI */}
      <Row gutter={[16, 16]} className="mb-4">
        {[
          { title: "Phần mềm",      value: data.softwareCount,   icon: <CodeOutlined />,             color: "#1890ff" },
          { title: "Dự án",         value: data.projectCount,    icon: <ProjectOutlined />,           color: "#722ed1" },
          { title: "Module",        value: data.moduleCount,     icon: <AppstoreOutlined />,          color: "#13c2c2" },
          { title: "Change Request",value: data.changeCount,     icon: <ExclamationCircleOutlined />, color: "#fa8c16" },
          { title: "CR Chờ xử lý", value: data.pendingChanges,  icon: <ClockCircleOutlined />,       color: "#eb2f96" },
          { title: "Dự án trễ",     value: data.delayedProjects, icon: <ExclamationCircleOutlined />, color: "#f5222d" },
          { title: "Module trễ",    value: data.delayedModules,  icon: <ExclamationCircleOutlined />, color: "#fa541c" },
          { title: "Task",          value: data.taskCount,       icon: <CheckCircleOutlined />,       color: "#52c41a" },
        ].map((item) => (
          <Col xs={12} sm={8} md={6} key={item.title}>
            <Card size="small" bordered={false} style={{ background: "#fafafa" }}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                valueStyle={{ color: item.color, fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Timeline Tổng quan */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card
            title={<Space><CalendarOutlined style={{ color: "#1677ff" }} /><span>Timeline Tổng quan Dự án</span></Space>}
            size="small"
            extra={
              <Space size={12} style={{ fontSize: 11 }}>
                {[
                  { color: "#8c8c8c", label: "Lập KH" },
                  { color: "#1677ff", label: "Đang TH" },
                  { color: "#52c41a", label: "Hoàn thành" },
                  { color: "#faad14", label: "Tạm dừng" },
                  { color: "#ff4d4f", label: "Hôm nay" },
                  { color: "#722ed1", label: "Go-live ◆" },
                ].map((item) => (
                  <Space key={item.label} size={4}>
                    <div style={{
                      width: item.color === "#ff4d4f" ? 2 : 12, height: 12,
                      background: item.color,
                      borderRadius: item.color === "#722ed1" ? 2 : 2,
                      transform: item.color === "#722ed1" ? "rotate(45deg)" : undefined,
                      display: "inline-block",
                    }} />
                    <span style={{ color: "#8c8c8c" }}>{item.label}</span>
                  </Space>
                ))}
              </Space>
            }
          >
            <OverviewGantt projects={data.projectProgress} />
          </Card>
        </Col>
      </Row>

      {/* Project table + CR stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Tiến độ Dự án" size="small">
            <Table dataSource={data.projectProgress} columns={projectColumns} rowKey="id" size="small" pagination={{ pageSize: 8 }} />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Change Request theo Trạng thái" size="small">
            <Table dataSource={data.changeByStatus} columns={crStatusColumns} rowKey="status" size="small" pagination={false} />
          </Card>

          <Divider />

          <Card title="Developer Workload" size="small" className="mt-2">
            {data.developerStats.map((dev) => (
              <div key={dev.assigneeCode} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{dev.assigneeName ?? dev.assigneeCode}</span>
                  <span className="text-gray-500">{dev.moduleCount} module</span>
                </div>
                <Progress percent={Math.round(dev.avgProgress)} size="small"
                  strokeColor={dev.avgProgress < 30 ? "#ff4d4f" : dev.avgProgress < 70 ? "#faad14" : "#52c41a"} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Bottom */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="Module có nhiều Change nhất" size="small">
            {data.topModulesByChange.map((item, idx) => (
              <div key={item.moduleId} className="flex justify-between mb-1 text-sm">
                <span>{idx + 1}. {item.moduleName}</span>
                <Tag color="orange">{item.changeCount} CR</Tag>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Lịch sử điều chỉnh Timeline" size="small">
            {data.recentAdjustments.map((adj) => (
              <div key={adj.id} className="mb-2 p-2 bg-gray-50 rounded text-xs">
                <div>
                  <Tag color={adj.adjustmentDays > 0 ? "red" : "green"}>
                    {adj.adjustmentDays > 0 ? `+${adj.adjustmentDays} ngày` : `${adj.adjustmentDays} ngày`}
                  </Tag>
                  <span className="font-medium">{adj.entityType} #{adj.entityId}</span>
                </div>
                <div className="text-gray-500 mt-1">{adj.reason}</div>
                <div className="text-gray-400">{adj.changedAt?.substring(0, 16)}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
