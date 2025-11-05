import { Card, Row, Col, Button, Table } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { Column } from "@ant-design/charts";
const statusCards = [
  {
    title: "TICKET MỚI",
    value: 24,
    color: "#e8e195",
    // icon: <FileTextOutlined style={{ fontSize: 28, color: "#333" }} />,
    textColor: "#333",
  },
  {
    title: "ĐÃ HOÀN THÀNH",
    value: 156,
    color: "#a9e895",
    // icon: <CheckCircleFilled style={{ fontSize: 28, color: "#333" }} />,
    textColor: "#333",
  },
  {
    title: "ĐANG XỬ LÝ",
    value: 18,
    color: "#dcedf5",
    // icon: <ClockCircleFilled style={{ fontSize: 28, color: "#333" }} />,
    textColor: "#333",
  },
  {
    title: "QUÁ HẠN",
    value: 3,
    color: "#e8a095",
    // icon: <ExclamationCircleFilled style={{ fontSize: 28, color: "#333" }} />,
    textColor: "#333",
  },
];

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

const ticketData: Array<{
  ticketId: string;
  title: string;
  sender: string;
  department: string;
  priority: string;
  status: string;
  createDate: string;
}> = [
  {
    ticketId: "TK001",
    title: "Lỗi đăng nhập hệ thống",
    sender: "Nguyễn Văn A",
    department: "IT",
    priority: "Cao",
    status: "Chờ xử lý",
    createDate: "",
  },
  {
    ticketId: "TK001",
    title: "Lỗi đăng nhập hệ thống",
    sender: "Nguyễn Văn A",
    department: "IT",
    priority: "Cao",
    status: "Chờ xử lý",
    createDate: "",
  },
  {
    ticketId: "TK001",
    title: "Lỗi đăng nhập hệ thống",
    sender: "Nguyễn Văn A",
    department: "IT",
    priority: "Cao",
    status: "Chờ xử lý",
    createDate: "",
  },
  {
    ticketId: "TK001",
    title: "Lỗi đăng nhập hệ thống",
    sender: "Nguyễn Văn A",
    department: "IT",
    priority: "Cao",
    status: "Chờ xử lý",
    createDate: "",
  },
];

const Dashboard = () => {
  // Dữ liệu cho biểu đồ cột trạng thái ticket
  const statusChartData = [
    { type: "Chờ xử lý", value: 24 },
    { type: "Đang xử lý", value: 18 },
    { type: "Hoàn thành", value: 156 },
  ];

  // Dữ liệu cho biểu đồ Pie phân bổ phòng ban
  const departmentPieData = [
    { type: "IT", value: 40 },
    { type: "Kế toán", value: 30 },
    { type: "Nhân sự", value: 20 },
    { type: "Khác", value: 10 },
  ];

  const columnConfig = {
    data: statusChartData,
    xField: "type",
    yField: "value",
    color: ({ type }: { type: string }) => {
      if (type === "Chờ xử lý") return "#e8e195";
      if (type === "Đang xử lý") return "#dcedf5";
      if (type === "Hoàn thành") return "#a9e895";
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
    data: departmentPieData,
    xField: "type",
    yField: "value",
    color: ({ type }: { type: string }) => {
      if (type === "IT") return "#6fa8dc";
      if (type === "Kế toán") return "#93c47d";
      if (type === "Nhân sự") return "#ffd966";
      if (type === "Khác") return "#e06666";
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
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statusCards.map((card) => (
          <Col xs={24} sm={12} md={6} key={card.title}>
            <Card
              style={{
                background: card.color,
                color: card.textColor,
                borderRadius: 16,
                boxShadow: "0 2px 8px #e3e3e3",
                display: "flex",
                alignItems: "center",
                minHeight: 80,
                padding: "16px 24px",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: card.textColor,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: card.textColor,
                    }}
                  >
                    {card.value}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
        <Col xs={24} style={{ textAlign: "right", marginTop: 8 }}>
          <Button
            type="default"
            icon={<FileTextOutlined style={{ color: "#7b2ff2" }} />}
            style={{
              color: "#333",
              background: "#fff",
              border: "1px solid #e0e7ff",
            }}
          >
            Xuất báo cáo
          </Button>
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
            style={{ borderRadius: 16 }}
            bodyStyle={{ minHeight: 260, padding: 0 }}
          >
            <div
              style={{
                height: 220,
                background: "#fff",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Column {...columnConfig} height={180} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card
            title={
              <span style={{ color: "#3f51b5", fontWeight: 500 }}>
                Phân bổ theo phòng ban trong tháng
              </span>
            }
            style={{ borderRadius: 16 }}
            bodyStyle={{ minHeight: 260, padding: 0 }}
          >
            <div
              style={{
                height: 220,
                background: "#fff",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Column {...departmentColumnConfig} height={180} />
            </div>
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
          dataSource={ticketData}
          pagination={false}
          scroll={{ x: true }}
          bordered
          style={{ borderRadius: 8 }}
          rowClassName={() => "ant-table-row"}
          title={() => null}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
