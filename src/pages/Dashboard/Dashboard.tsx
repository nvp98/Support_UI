import React from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  DatePicker,
  Segmented,
  Spin,
  Select,
} from "antd";
import { Column, Pie } from "@ant-design/charts";
import dayjs from "dayjs";
import { ticketLogApi } from "../../services/TicketLogApi";
import type { TicketLog } from "../../models/ticketLog";
import {
  getTicketSubTypeOptions,
  getTicketTypeLabel,
  TICKET_TYPE_OPTIONS,
} from "../../utils/configs/ticketClassification";
const { RangePicker } = DatePicker;

const ticketColumns = [
  {
    title: <span style={{ color: "#000" }}>Mã ticket</span>,
    dataIndex: "ticketId",
    key: "ticketId",
    width: 110,
    render: (text: string) => <b>{text}</b>,
  },
  {
    title: <span style={{ color: "#000" }}>Tiêu đề</span>,
    dataIndex: "title",
    key: "title",
    width: 220,
    ellipsis: true,
  },
  {
    title: <span style={{ color: "#000" }}>Người gửi</span>,
    dataIndex: "sender",
    key: "sender",
    width: 140,
  },
  {
    title: <span style={{ color: "#000" }}>Phòng ban</span>,
    dataIndex: "department",
    key: "department",
    width: 110,
  },
  {
    title: <span style={{ color: "#000" }}>Mức độ</span>,
    dataIndex: "priority",
    key: "priority",
    width: 100,
  },
  {
    title: <span style={{ color: "#000" }}>Trạng thái</span>,
    dataIndex: "status",
    key: "status",
    width: 110,
  },
  {
    title: <span style={{ color: "#000" }}>Ngày tạo</span>,
    dataIndex: "createDate",
    key: "createDate",
    width: 140,
  },
  {
    title: <span style={{ color: "#000" }}>Thao tác</span>,
    key: "action",
    width: 90,
    render: () => <Button type="link">Xem</Button>,
  },
];

const formatPeriod = (d: dayjs.Dayjs, g: string) => {
  if (g === "Ngày") return d.format("DD/MM");
  if (g === "Tuần") {
    const start = d.subtract(d.day(), "day");
    return `Tuần ${start.format("DD/MM")}`;
  }
  return d.format("MM/YYYY");
};

const Dashboard = () => {
  const [loading, setLoading] = React.useState(false);
  const [granularity, setGranularity] = React.useState<string>("Tháng");
  const [dateRange, setDateRange] = React.useState<any>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [tickets, setTickets] = React.useState<TicketLog[]>([]);
  const [statusChartData, setStatusChartData] = React.useState<any[]>([]);
  const [departmentData, setDepartmentData] = React.useState<any[]>([]);
  const [typeData, setTypeData] = React.useState<any[]>([]);
  const [assigneePeriodData, setAssigneePeriodData] = React.useState<any[]>([]);
  const [yearTypeData, setYearTypeData] = React.useState<any[]>([]);
  const [monthOverallData, setMonthOverallData] = React.useState<any[]>([]);
  const [monthStatusData, setMonthStatusData] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [departmentFilter, setDepartmentFilter] = React.useState<
    string | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [subTypeFilter, setSubTypeFilter] = React.useState<
    string | undefined
  >(undefined);
  const [statusFilter, setStatusFilter] = React.useState<number | undefined>(
    undefined,
  );

  const palette = [
    "#1890ff",
    "#13c2c2",
    "#fa8c16",
    "#eb2f96",
    "#52c41a",
    "#fa541c",
    "#2f54eb",
    "#a0d911",
    "#722ed1",
    "#d81e06",
  ];
  const mkGetColor = () => {
    const map: Record<string, string> = {};
    let i = 0;
    return (key: string) => {
      if (!map[key]) {
        map[key] = palette[i % palette.length];
        i += 1;
      }
      return map[key];
    };
  };
  const getTypeColor = mkGetColor();
  const getDeptColor = mkGetColor();
  const getAssigneeColor = mkGetColor();
  const getXColor = mkGetColor();
  const cardAccent = {
    dept: { background: "#f0f5ff", border: "1px solid #adc6ff" },
    type: { background: "#fff0f6", border: "1px solid #ffadd2" },
    assignee: { background: "#f6ffed", border: "1px solid #b7eb8f" },
    year: { background: "#e6fffb", border: "1px solid #87e8de" },
    month: { background: "#fff7e6", border: "1px solid #ffd591" },
    monthStatus: { background: "#f9f0ff", border: "1px solid #d3adf7" },
  } as const;

  const fetchAll = async (from: string, to: string) => {
    setLoading(true);
    try {
      const pageSize = 500;
      let page = 1;
      let items: TicketLog[] = [];
      while (true) {
        const res = await ticketLogApi.getTickets(page, pageSize, {
          fromDate: from,
          toDate: to,
        });
        items = items.concat(res.items || []);
        if (page * pageSize >= (res.totalRecords || 0)) break;
        page += 1;
      }
      setTickets(items);
      computeStats(items);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (items: TicketLog[]) => {
    const filtered = items.filter((it) => {
      const depOk = departmentFilter
        ? (it.userDepartment || "") === departmentFilter
        : true;
      const typeOk = typeFilter ? (it.ticketType || "") === typeFilter : true;
      const subTypeOk = subTypeFilter
        ? (it.ticketSubType || "") === subTypeFilter
        : true;
      const statusOk =
        statusFilter !== undefined
          ? Number(it.ticketStatus) === Number(statusFilter)
          : true;
      return depOk && typeOk && subTypeOk && statusOk;
    });
    setTotalCount(filtered.length);
    const statusCounts: Record<string, number> = {
      "Chờ tiếp nhận": 0,
      "Đang xử lý": 0,
      "Hoàn tất": 0,
      "Quá hạn": 0,
    };
    filtered.forEach((it) => {
      if (it.ticketStatus === 0) statusCounts["Chờ tiếp nhận"] += 1;
      else if (it.ticketStatus === 1) statusCounts["Đang xử lý"] += 1;
      else if (it.ticketStatus === 2) statusCounts["Hoàn tất"] += 1;
      if (it.createdAt && it.ticketStatus !== 2) {
        const diff = dayjs().diff(dayjs(it.createdAt), "day");
        if (diff > 7) statusCounts["Quá hạn"] += 1;
      }
    });
    setStatusChartData([
      { type: "Chờ xử lý", value: statusCounts["Chờ tiếp nhận"] },
      { type: "Đang xử lý", value: statusCounts["Đang xử lý"] },
      { type: "Hoàn thành", value: statusCounts["Hoàn tất"] },
    ]);
    const deptMap: Record<string, number> = {};
    filtered.forEach((it) => {
      const k = it.userDepartment || "Khác";
      deptMap[k] = (deptMap[k] || 0) + 1;
    });
    setDepartmentData(
      Object.entries(deptMap).map(([type, value]) => ({ type, value })),
    );
    const typeMap: Record<string, number> = {};
    filtered.forEach((it) => {
      const k = it.ticketType ? getTicketTypeLabel(it.ticketType) : "Khác";
      typeMap[k] = (typeMap[k] || 0) + 1;
    });
    setTypeData(
      Object.entries(typeMap).map(([type, value]) => ({ type, value })),
    );
    const ap: any[] = [];
    filtered.forEach((it) => {
      const t = it.receivedAt || it.createdAt || null;
      if (!t) return;
      const d = dayjs(t);
      const label = formatPeriod(d, granularity);
      const assignee = it.userAssigneeName || "Chưa gán";
      ap.push({ period: label, assignee, value: 1 });
    });
    const keyMap: Record<string, number> = {};
    ap.forEach((r) => {
      const k = `${r.period}|${r.assignee}`;
      keyMap[k] = (keyMap[k] || 0) + 1;
    });
    setAssigneePeriodData(
      Object.entries(keyMap).map(([k, v]) => {
        const [period, assignee] = k.split("|");
        return { period, assignee, value: v };
      }),
    );
    const yearType: Record<string, number> = {};
    filtered.forEach((it) => {
      const y = (
        it.createdAt ? dayjs(it.createdAt).year() : dayjs().year()
      ).toString();
      const tp = it.ticketType ? getTicketTypeLabel(it.ticketType) : "Khác";
      const k = `${y}|${tp}`;
      yearType[k] = (yearType[k] || 0) + 1;
    });
    setYearTypeData(
      Object.entries(yearType).map(([k, v]) => {
        const [year, tp] = k.split("|");
        return { year, type: tp, value: v };
      }),
    );
    const monthOverall: Record<string, number> = {};
    const monthStatus: Record<string, number> = {};
    filtered.forEach((it) => {
      const d = it.createdAt ? dayjs(it.createdAt) : dayjs();
      const m = d.format("YYYY MMM");
      monthOverall[m] = (monthOverall[m] || 0) + 1;
      const s = Number(it.ticketStatus);
      const k = `${m}|${s}`;
      monthStatus[k] = (monthStatus[k] || 0) + 1;
    });
    setMonthOverallData(
      Object.entries(monthOverall).map(([month, value]) => ({ month, value })),
    );
    setMonthStatusData(
      Object.entries(monthStatus).map(([k, v]) => {
        const [month, s] = k.split("|");
        const st = ["Chờ tiếp nhận", "Đang xử lý", "Hoàn tất", "Hủy"][
          Number(s) || 0
        ];
        return { month, status: st, value: v };
      }),
    );
  };

  React.useEffect(() => {
    const from = dateRange?.[0]?.format("YYYY-MM-DD");
    const to = dateRange?.[1]?.format("YYYY-MM-DD");
    if (from && to) fetchAll(from, to);
  }, [dateRange]);

  React.useEffect(() => {
    computeStats(tickets);
  }, [
    granularity,
    departmentFilter,
    typeFilter,
    subTypeFilter,
    statusFilter,
  ]);

  const columnConfig = {
    data: statusChartData,
    xField: "type",
    yField: "value",
    color: ({ type }: { type: string }) => {
      if (type === "Chờ xử lý") return "#ffd666";
      if (type === "Đang xử lý") return "#69c0ff";
      if (type === "Hoàn thành") return "#95de64";
      return "#ccc";
    },
    columnWidthRatio: 0.6,
    label: {
      position: "middle",
      style: { fill: "#333", fontSize: 14, fontWeight: 600 },
    },
    xAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
    yAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
    legend: false,
  };
  const departmentColumnConfig = {
    data: departmentData,
    xField: "type",
    yField: "value",
    color: ({ type }: { type: string }) => getDeptColor(type),
    columnWidthRatio: 0.6,
    label: {
      position: "middle",
      style: { fill: "#333", fontSize: 14, fontWeight: 600 },
    },
    xAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
    yAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
    legend: false,
  };
  // const typeColumnConfig  = {
  //   data: typeData,
  //   xField: "type",
  //   yField: "value",
  //   color: ({ type }: { type: string }) => getTypeColor(type),
  //   columnWidthRatio: 0.6,
  //   label: {
  //     position: "middle",
  //     style: { fill: "#333", fontSize: 14, fontWeight: 600 },
  //   },
  //   xAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
  //   yAxis: { label: { style: { fill: "#333", fontWeight: 500 } } },
  //   legend: false,
  // };
  const assigneeGroupConfig = {
    data: assigneePeriodData,
    xField: "period",
    yField: "value",
    seriesField: "assignee",
    isGroup: true,
    color: ({ assignee }: { assignee: string }) => getAssigneeColor(assignee),
    columnWidthRatio: 0.6,
    label: { position: "middle" },
  };
  const yearTypeConfig = {
    data: yearTypeData,
    xField: "year",
    yField: "value",
    seriesField: "type",
    isGroup: true,
    color: ({ type }: { type: string }) => getTypeColor(type),
  };
  const monthOverallConfig = {
    data: monthOverallData,
    xField: "month",
    yField: "value",
    color: ({ month }: { month: string }) => getXColor(month),
  };
  const monthStatusStackConfig = {
    data: monthStatusData,
    xField: "month",
    yField: "value",
    seriesField: "status",
    isStack: true,
    color: ({ status }: { status: string }) => {
      const m: Record<string, string> = {
        "Chờ tiếp nhận": "#ffd666",
        "Đang xử lý": "#69c0ff",
        "Hoàn tất": "#95de64",
        Hủy: "#ff7875",
      };
      return m[status] || "#ccc";
    },
  };
  const typeDonutConfig = {
    data: typeData.map((d) => ({ type: d.type, value: d.value })),
    angleField: "value",
    colorField: "type",
    color: ({ type }: { type: string }) => getTypeColor(type),
    radius: 0.9,
    innerRadius: 0.6,
    label: {
      type: "inner",
      offset: "-50%",
      content: ({ percent }: any) => `${Math.round(percent * 100)}%`,
      style: { textAlign: "center" },
    },
    legend: true,
  };
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          {
            label: "Chờ xử lý",
            value:
              statusChartData.find((x) => x.type === "Chờ xử lý")?.value || 0,
            style: {
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              borderLeft: "6px solid #ffd666",
            },
            text: { color: "#ad8b00" },
          },
          {
            label: "Đang xử lý",
            value:
              statusChartData.find((x) => x.type === "Đang xử lý")?.value || 0,
            style: {
              background: "#e6f7ff",
              border: "1px solid #91d5ff",
              borderLeft: "6px solid #69c0ff",
            },
            text: { color: "#096dd9" },
          },
          {
            label: "Hoàn thành",
            value:
              statusChartData.find((x) => x.type === "Hoàn thành")?.value || 0,
            style: {
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderLeft: "6px solid #95de64",
            },
            text: { color: "#237804" },
          },
        ].map((c) => (
          <Col xs={24} sm={12} md={6} key={c.label}>
            <Card
              style={{ borderRadius: 16, ...c.style }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ fontWeight: 600, fontSize: 16, ...c.text }}>
                {c.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, ...c.text }}>
                {c.value}
              </div>
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: 16,
              background: "#f0f5ff",
              border: "1px solid #adc6ff",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ fontWeight: 600, fontSize: 16, color: "#1d39c4" }}>
              Tổng số yêu cầu
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1d39c4" }}>
              {totalCount}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={8}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Segmented
            options={["Ngày", "Tuần", "Tháng"]}
            value={granularity}
            onChange={(v) => setGranularity(String(v))}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder="Bộ phận"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            style={{ width: "100%" }}
            options={[
              ...new Set(tickets.map((t) => t.userDepartment || "Khác")),
            ].map((d) => ({ label: d, value: d }))}
          />
        </Col>
        <Col xs={24} md={3}>
          <Select
            allowClear
            placeholder="Loại yêu cầu"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setSubTypeFilter(undefined);
            }}
            style={{ width: "100%" }}
            options={TICKET_TYPE_OPTIONS}
          />
        </Col>
        <Col xs={24} md={3}>
          <Select
            allowClear
            placeholder="Hạng mục hỗ trợ"
            value={subTypeFilter}
            onChange={setSubTypeFilter}
            style={{ width: "100%" }}
            options={getTicketSubTypeOptions(typeFilter)}
          />
        </Col>
        <Col xs={24} md={3}>
          <Select
            allowClear
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: "100%" }}
            options={[
              { label: "Chờ tiếp nhận", value: 0 },
              { label: "Đang xử lý", value: 1 },
              { label: "Hoàn tất", value: 2 },
              { label: "Hủy", value: 3 },
            ]}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Thống kê ticket theo tháng
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.month,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...columnConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Phân bổ theo phòng ban
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.dept,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...departmentColumnConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Theo loại yêu cầu
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.type,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Pie {...typeDonutConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Theo người tiếp nhận
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.assignee,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...assigneeGroupConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Theo năm
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.year,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...yearTypeConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Theo tháng
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.month,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...monthOverallConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Theo tháng theo trạng thái
              </span>
            }
            style={{
              borderRadius: 16,
              ...cardAccent.monthStatus,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ minHeight: 220, padding: 0 }}
          >
            <Spin spinning={loading}>
              <div
                style={{
                  height: 220,
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Column {...monthStatusStackConfig} height={160} />
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: "#3f51b5", fontWeight: 500 }}>
            Ticket gần đây
          </span>
        }
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={ticketColumns}
          dataSource={tickets.slice(0, 10).map((t) => ({
            ticketId: String(t.ticketCode),
            title: t.ticketTitle,
            sender: `${t.userCode || ""} - ${t.userName || ""}`,
            department: t.userDepartment || "",
            priority: "",
            status: ["Chờ xử lý", "Đang xử lý", "Hoàn thành", "Hủy"][
              Number(t.ticketStatus) || 0
            ],
            createDate: t.createdAt || "",
          }))}
          pagination={false}
          scroll={{ x: true }}
          bordered
          style={{ borderRadius: 8 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
