import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Badge,
  Input,
  Select,
  Row,
  Col,
  // Typography,
  Tabs,
  Form,
  Upload,
  message,
  DatePicker,
  Popconfirm,
  Modal,
  Tooltip,
  Checkbox,
} from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  PlusOutlined,
  PlusCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  DeleteTwoTone,
  CheckCircleTwoTone,
  PlusSquareTwoTone,
  EditTwoTone,
  EyeTwoTone,
  CloseCircleTwoTone,
  CodeOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  Loading3QuartersOutlined,
  CheckCircleFilled,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
  IdcardOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import "./TicketProcessing.css";

// Core
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";

// Plugins tương ứng với config
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/table";
import "tinymce/plugins/lists";
import "tinymce/plugins/code";

// Skin UI
import "tinymce/skins/ui/oxide/skin.min.css";

// Ngôn ngữ (nếu cần)
import "tinymce-i18n/langs5/vi.js";
import { sendTeamsNotification } from "../../services/ApiService";
import { hideLoading, showLoading } from "../../store/loadingSlice";
import { ticketLogApi } from "../../services/TicketLogApi";
import { buildFormData } from "../../utils/configs/buildFormData";
import dayjs from "dayjs";
import { UploadApi } from "../../services/UploadApi";
import { clearTicketFilter, setTicketFilter } from "../../store/ticketSlice";
import type { RootState } from "../../store";
import supportStaffData from "../../utils/configs/json_info_user.json";
// import type { TicketLog } from "../../models/ticketLog";

// const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// const mockData = [
//   {
//     key: "1",
//     ticketId: "TK2609250001",
//     title: "Lỗi không thể đăng nhập hệ thống",
//     sender: "HPDQ00001 - Nguyễn Văn A",
//     department: "IT",
//     status: "new",
//     assignee: "",
//     createDate: "24/9/2025 14:09",
//   },
// ];

const statusConfig: Record<string, { color: string; text: string }> = {
  0: { color: "purple", text: "Chờ tiếp nhận" },
  1: { color: "pink", text: "Đang xử lý" },
  2: { color: "green", text: "Hoàn tất" },
  3: { color: "red", text: "Hủy" },
};

const renderTicketStatusIcon = (status: string | number) => {
  const statusKey = String(status);
  const config = statusConfig[statusKey] || { text: statusKey };

  let iconNode: ReactNode = <Tag color="default">?</Tag>;

  if (statusKey === "0") {
    iconNode = (
      <ClockCircleOutlined style={{ color: "#722ed1", fontSize: 16 }} />
    );
  } else if (statusKey === "1") {
    iconNode = (
      <Loading3QuartersOutlined
        spin
        style={{ color: "#eb2f96", fontSize: 16 }}
      />
    );
  } else if (statusKey === "2") {
    iconNode = (
      <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 17 }} />
    );
  } else if (statusKey === "3") {
    iconNode = (
      <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 17 }} />
    );
  }

  return (
    <Tooltip title={config.text}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          border: "1px solid #f0f0f0",
        }}
      >
        {iconNode}
      </span>
    </Tooltip>
  );
};

const typeConfig: Record<string, { color: string; text: string }> = {
  SOFT: { color: "red", text: "Hỗ trợ phần mềm" },
  HARD: { color: "orange", text: "Hỗ trợ phần cứng" },
  SAP: { color: "cyan", text: "SAP" },
};

const supportGroupConfig: Record<
  string,
  { color: string; text: string; icon: React.ReactNode; bgColor: string }
> = {
  SOFT: {
    color: "geekblue",
    text: "Hỗ trợ phần mềm",
    icon: <CodeOutlined />,
    bgColor: "#f0f5ff",
  },
  HARD: {
    color: "orange",
    text: "Hỗ trợ phần cứng",
    icon: <DesktopOutlined />,
    bgColor: "#fff7e6",
  },
  SAP: {
    color: "purple",
    text: "SAP",
    icon: <DatabaseOutlined />,
    bgColor: "#f9f0ff",
  },
};

const supportInfoByCode = new Map<
  string,
  { name: string; email?: string; chucVu?: string; phongBan?: string }
>();
const supportEmailByName = new Map<string, string>();

(supportStaffData.supportStaff || []).forEach((staff: any) => {
  supportInfoByCode.set(staff.maNhanVien, {
    name: staff.hoTen,
    email: staff.email,
    chucVu: staff.chucVu,
    phongBan: staff.phongBan,
  });
  if (staff.hoTen && staff.email) {
    supportEmailByName.set(staff.hoTen, staff.email);
  }
});

const renderSupportAssignee = (record: any) => {
  const assigneeName = record?.userAssigneeName;
  const assigneeCode = record?.userAssigneeCode;

  if (!assigneeName) {
    return <span style={{ color: "#aaa" }}>-</span>;
  }

  const emailFromCode = assigneeCode
    ? supportInfoByCode.get(assigneeCode)?.email
    : undefined;
  const email = emailFromCode || supportEmailByName.get(assigneeName);
  const chucVu = assigneeCode
    ? supportInfoByCode.get(assigneeCode)?.chucVu
    : undefined;
  const phongBan = assigneeCode
    ? supportInfoByCode.get(assigneeCode)?.phongBan
    : undefined;

  if (!email) {
    return assigneeName;
  }

  return (
    <Tooltip
      title={
        <div style={{ lineHeight: 1.8, width: 500 }}>
          <div>
            <UserOutlined /> {assigneeName}
          </div>
          <div>
            <MailOutlined /> {email}
          </div>
          <div>
            <IdcardOutlined /> {chucVu}
          </div>
          <div>
            <HomeOutlined /> {phongBan}
          </div>
        </div>
      }
    >
      <span>{assigneeName}</span>
    </Tooltip>
  );
};

// const departmentConfig: Record<string, { color: string; text: string }> = {
//   IT: { color: "cyan", text: "IT" },
//   "Hành chính": { color: "blue", text: "Hành chính" },
// };

function MyTicketsTab({ activeTab }: { activeTab: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [editModal, setEditModal] = useState<{ open: boolean; record?: any }>({
    open: false,
    record: undefined,
  });
  const [viewModal, setViewModal] = useState<{ open: boolean; record?: any }>({
    open: false,
    record: undefined,
  });
  const [addNoteModal, setAddNoteModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [editForm] = Form.useForm();
  const editEditorRef = useRef<any>(null); // Ref for TinyMCE editor
  const [note, setNote] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  // Thêm state cho bộ lọc ngày
  const [dateRange, setDateRange] = useState<any>(null);

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : {};
  const fetchData = async (page = 1, pageSize = 10, filters = {}) => {
    setLoading(true);
    try {
      console.log("Fetching tickets with filters:", filters);
      const res = await ticketLogApi.getTickets(page, pageSize, filters);
      setData(res.items);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.totalRecords,
      });
      setFilters(filters); // lưu filter hiện tại
    } catch (err) {
      console.error("Error fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize, {
      usercode: userObj?.maNV || "",
    });
  }, [activeTab]);

  // Xử lý khi nhấn nút Lọc
  const handleFilter = () => {
    const filterObj: any = {
      usercode: userObj?.maNV || "",
    };
    if (dateRange && dateRange.length === 2) {
      filterObj.fromDate = dateRange[0].format("YYYY-MM-DD");
      filterObj.toDate = dateRange[1].format("YYYY-MM-DD");
    }
    fetchData(1, pagination.pageSize, filterObj);
  };

  // Xử lý khi xóa bộ lọc
  const handleClearFilter = () => {
    setDateRange(null);
    fetchData(1, pagination.pageSize, {
      usercode: userObj?.maNV || "",
    });
  };

  // const handleDelete = async (key: string) => {
  //   try {
  //     setLoading(true);
  //     // TODO: Gọi API xóa ticket khi API này được implement
  //     // await ticketLogApi.deleteTicket(key);

  //     // Mock xóa ticket
  //     setTimeout(() => {
  //       setData((prev) => prev.filter((item) => item.key !== key));
  //       message.success("Đã xóa ticket!");
  //     }, 500);

  //     // Reload lại data từ server
  //     await fetchData(pagination.current, pagination.pageSize, {
  //       usercode: userObj?.maNV || "",
  //     });
  //   } catch (error) {
  //     console.error("❌ Lỗi xóa ticket:", error);
  //     message.error("Không thể xóa ticket. Vui lòng thử lại!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //  const handleDelete = (record: any) => {
  //   setCancelModal({ open: true, record });
  // };
  // thay handleDelete mở modal thành hàm xóa thực thi ngay
  const handleDelete = async (record: any) => {
    try {
      setLoading(true);
      // nếu API có deleteTicket dùng API, nếu không fallback xóa local
      if (ticketLogApi.deleteTicket) {
        await ticketLogApi.deleteTicket(record.ticketId);
        message.success("Đã xóa ticket!");
      } else {
        // fallback: mock xóa
        setData((prev) =>
          prev.filter((item) => item.ticketId !== record.ticketId),
        );
        message.success("Đã xóa ticket (mock)!");
      }
      // reload dữ liệu
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("Lỗi xóa ticket:", error);
      message.error("Không thể xóa ticket. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFinish = async () => {
    try {
      const record = cancelModal.record;
      if (!note.trim()) {
        message.error("Vui lòng nhập lý do hủy ticket!");
        return;
      }

      // ✅ Gọi API "Hoàn tất ticket"
      await ticketLogApi.cancelTicket(record.ticketId, {
        note: note.trim() || "Hủy!", // lấy từ input hoặc fallback
      });

      setCancelModal({ open: false, record: undefined });
      setNote("");
      message.success("Ticket đã được hủy!");

      // ✅ Reload lại data từ server để cập nhật đúng trạng thái và nút thao tác
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      message.error("Không thể hoàn tất ticket. Vui lòng thử lại!");
    }
  };

  const handleEdit = (record: any) => {
    setEditModal({ open: true, record });
    editForm.setFieldsValue(record);
  };

  const handleEditFinish = async (values: any) => {
    // setEditModal((prev) => ({
    //   ...prev,
    //   record: { ...prev.record, ...values },
    // }));
    // Gọi API cập nhật DB
    const payload = {
      ...editModal.record, // Lấy dữ liệu cũ (bao gồm id, user, v.v.)
      ...values, // Gộp giá trị mới từ form
    };
    // 🔹 Gọi API cập nhật DB
    const res = await ticketLogApi.UpdateTicket(payload.ticketId, payload);
    if (res?.message) {
      message.success(res?.message);
      setEditModal({ open: false, record: undefined });
      setData((prev) =>
        prev.map((item) =>
          item.key === editModal.record.key ? { ...item, ...values } : item,
        ),
      );
    } else {
      message.error("Cập nhật thất bại!");
    }
    // setEditModal({ open: false, record: undefined });
    // console.log("Edited values:", editModal.record, payload);
    // message.success("Đã cập nhật ticket!");
  };

  // Xem chi tiết ticket
  const handleView = (record: any) => {
    setViewModal({ open: true, record });
  };

  const handleOpenAddNote = (record: any) => {
    setAdditionalNote("");
    setAddNoteModal({ open: true, record });
  };

  const handleAddNoteFinish = async () => {
    try {
      const record = addNoteModal.record;
      if (!additionalNote.trim()) {
        message.error("Vui lòng nhập nội dung ghi chú!");
        return;
      }

      const latestNote = additionalNote.trim();

      const res = await ticketLogApi.noteTicket(record.ticketId, {
        ...record,
        note: latestNote,
      });

      if (res?.message) {
        message.success(res.message);
        setData((prev) =>
          prev.map((item) =>
            item.ticketId === record.ticketId
              ? { ...item, note: latestNote }
              : item,
          ),
        );
        setAddNoteModal({ open: false, record: undefined });
        setAdditionalNote("");
      } else {
        message.error("Cập nhật ghi chú thất bại!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật ghi chú:", error);
      message.error("Không thể thêm ghi chú. Vui lòng thử lại!");
    }
  };

  const columns = [
    {
      title: "Thao tác",
      key: "action",
      fixed: "left" as const,
      width: 50,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeTwoTone twoToneColor="#1890ff" />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {/* Chỉ hiển thị nút Xóa, edit khi ticket chưa được tiếp nhận (status = 0) */}
          {record.ticketStatus === 0 && (
            <>
              <Popconfirm
                title="Bạn có muốn xóa ticket này?"
                onConfirm={() => handleDelete(record)}
                okText="Có"
                cancelText="Không"
              >
                <Tooltip title="Xóa ticket">
                  <Button
                    type="text"
                    icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
                  />
                </Tooltip>
              </Popconfirm>
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<EditTwoTone twoToneColor="#1890ff" />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },

    {
      title: <b>Mã ticket</b>,
      dataIndex: "ticketCode",
      key: "ticketCode",
      fixed: "left" as const,
      render: (text: string, record: any) => (
        <b
          style={{ color: "#1976d2", cursor: "pointer" }}
          onClick={() => handleView(record)}
        >
          {text}
        </b>
      ),
      width: 100,
      // sorter: (a: TicketLog, b: TicketLog) => {
      //   // If ticketCode is numeric string, compare as numbers; otherwise, use localeCompare
      //   const aCode = a.ticketCode;
      //   const bCode = b.ticketCode;
      //   if (!isNaN(Number(aCode)) && !isNaN(Number(bCode))) {
      //     return Number(aCode) - Number(bCode);
      //   }
      //   return String(aCode).localeCompare(String(bCode));
      // },
    },
    {
      title: "Tiêu đề",
      dataIndex: "ticketTitle",
      key: "ticketTitle",
      width: 60,
      ellipsis: true,
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "ticketType",
      key: "ticketType",
      width: 40,
      ellipsis: true,
      render: (status: string) => (
        <text color={"default"}>{typeConfig[status]?.text || status}</text>
      ),
    },
    {
      title: "Người yêu cầu",
      dataIndex: "userName",
      key: "userName",
      width: 45,
      ellipsis: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 45,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "ticketStatus",
      key: "ticketStatus",
      width: 30,
      render: (status: string) => renderTicketStatusIcon(status),
    },
    {
      title: "Người hỗ trợ",
      dataIndex: "userAssigneeName",
      key: "userAssigneeName",
      width: 45,
      render: (_: string, record: any) => renderSupportAssignee(record),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 140,
      render: (value: string, record: any) => {
        const canAddNote =
          record.ticketStatus === 1 &&
          userObj?.maNV === record.userAssigneeCode;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>
              {value || <span style={{ color: "#aaa" }}>-</span>}
            </span>
            {canAddNote && (
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                style={{ padding: 0, height: "auto", width: "fit-content" }}
                onClick={() => handleOpenAddNote(record)}
              >
                Thêm ghi chú
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: "Thời gian tiếp nhận",
      dataIndex: "receivedAt",
      key: "receivedAt",
      width: 40,
      render: (value: string) =>
        value ? (
          dayjs(value).format("DD/MM/YYYY HH:mm")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "approvedAt",
      key: "approvedAt",
      width: 40,
      render: (value: string) =>
        value ? (
          dayjs(value).format("DD/MM/YYYY HH:mm")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4}>
            <Input placeholder="Mã ticket, tiêu đề..." allowClear />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select defaultValue="all" style={{ width: "100%" }}>
              <Option value="all">Tất cả</Option>
              <Option value="0">Chờ tiếp nhận</Option>
              <Option value="1">Đang xử lý</Option>
              <Option value="2">Hoàn tất</Option>
              <Option value="3">Hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select defaultValue="all" style={{ width: "100%" }}>
              <Option value="SOFT">Hỗ trợ phần mềm</Option>
              <Option value="HARD">Hỗ trợ phần cứng</Option>
              <Option value="SAP">SAP</Option>
            </Select>
          </Col>

          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleFilter}
            >
              Lọc
            </Button>
          </Col>
          <Col>
            <Button onClick={handleClearFilter}>Xóa bộ lọc</Button>
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          // pagination={{
          //   total: data.length,
          //   pageSize: pagination.pageSize,
          //   showSizeChanger: true,
          //   showQuickJumper: true,
          //   showTotal: (total, range) =>
          //     `${range[0]}-${range[1]} của ${total} ticket`,
          // }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize, filters), // phân trang
          }}
          scroll={{ x: "max-content", y: 500 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={12} align="right">
                <span style={{ fontWeight: 500 }}>
                  Tổng: {pagination.total} ticket
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
      <Modal
        open={editModal.open}
        title="Chỉnh sửa ticket"
        onCancel={() => setEditModal({ open: false, record: undefined })}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={handleEditFinish}
          initialValues={editModal.record}
        >
          <Form.Item
            label="Tiêu đề yêu cầu"
            name="ticketTitle"
            rules={[{ required: true, message: "Nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Loại yêu cầu"
            name="ticketType"
            rules={[{ required: true, message: "Chọn loại yêu cầu" }]}
          >
            <Select>
              <Option value="SOFT">Hỗ trợ phần mềm</Option>
              <Option value="HARD">Hỗ trợ phần cứng</Option>
              <Option value="SAP">SAP</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Nội dung yêu cầu"
            name="ticketContent"
            rules={[{ required: true, message: "Nhập nội dung yêu cầu" }]}
            /* Nối Form <-> TinyMCE */
            valuePropName="value" // Form sẽ inject prop "value" cho Editor
            trigger="onEditorChange" // Form lắng nghe sự kiện onEditorChange
            getValueFromEvent={(content) => content} // Lấy đúng chuỗi HTML
          >
            <Editor
              onInit={(_evt, editor) => (editEditorRef.current = editor)}
              // value={editModal.record?.ticketContent || ""}
              // onEditorChange={(content) => {
              //   // setEditModal((prev) => ({
              //   //   ...prev,
              //   //   record: { ...prev.record, ticketContent: content },
              //   // }));
              //   console.log("Content changed:", content);
              //   editForm.setFieldsValue({ ticketContent: content });
              // }}
              init={{
                height: 250,
                skin_url: "/tinymce/skins/ui/oxide",
                content_css: "/tinymce/skins/content/default/content.min.css",
                language: "vi",
                plugins: "link image table lists code",
                toolbar:
                  "undo redo | bold italic | alignleft aligncenter alignright | image | code",
                paste_data_images: true,
                automatic_uploads: true,
                convert_urls: false,
                relative_urls: false,
                remove_script_host: false,
                images_upload_url: UploadApi.postLinkImages,
                branding: false,
                menubar: true,
              }}
            />
          </Form.Item>
          <Form.Item label="Thông tin liên hệ" name="userContact">
            <Input />
          </Form.Item>
          <Form.Item label="Người yêu cầu" name="userName">
            <Input disabled />
          </Form.Item>
          {/* <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={2} disabled />
          </Form.Item> */}
          {/* Nếu muốn chỉnh sửa file đính kèm, có thể thêm Upload ở đây */}
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => setEditModal({ open: false, record: undefined })}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={addNoteModal.open}
        title="Thêm ghi chú ticket"
        onCancel={() => setAddNoteModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setAddNoteModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleAddNoteFinish}>
            Lưu ghi chú
          </Button>,
        ]}
        destroyOnClose
      >
        <p style={{ marginBottom: 8 }}>
          <b>{addNoteModal.record?.ticketCode}</b> -{" "}
          {addNoteModal.record?.ticketTitle}
        </p>
        <Input.TextArea
          rows={4}
          placeholder="Nhập ghi chú bổ sung"
          value={additionalNote}
          onChange={(e) => setAdditionalNote(e.target.value)}
        />
      </Modal>
      <Modal
        open={viewModal.open}
        title="Chi tiết ticket"
        onCancel={() => setViewModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="close"
            onClick={() => setViewModal({ open: false, record: undefined })}
          >
            Đóng
          </Button>,
        ]}
        destroyOnClose
        width={800}
      >
        {viewModal.record && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Mã ticket:</strong> {viewModal.record.ticketCode}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <Tag
                    color={statusConfig[viewModal.record.ticketStatus]?.color}
                  >
                    {statusConfig[viewModal.record.ticketStatus]?.text}
                  </Tag>
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <p>
                  <strong>Tiêu đề:</strong> {viewModal.record.ticketTitle}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <p>
                  <strong>Nội dung yêu cầu:</strong>
                </p>
                <div
                  style={{
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    padding: 12,
                    minHeight: 100,
                    maxHeight: 400,
                    overflow: "auto",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: viewModal.record.ticketContent,
                  }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24} style={{ marginTop: 8 }}>
                <p>
                  <strong>File đính kèm:</strong>{" "}
                  {viewModal.record.fileUrl ? (
                    <a
                      href={viewModal.record.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#d21919ff", fontWeight: 500 }}
                    >
                      Xem file đính kèm
                    </a>
                  ) : (
                    ""
                  )}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Loại yêu cầu:</strong>{" "}
                  <Tag color={typeConfig[viewModal.record.ticketType]?.color}>
                    {typeConfig[viewModal.record.ticketType]?.text}
                  </Tag>
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Ngày tạo:</strong>{" "}
                  {viewModal.record.createdAt
                    ? dayjs(viewModal.record.createdAt).format(
                        "DD/MM/YYYY HH:mm",
                      )
                    : "-"}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Người yêu cầu:</strong> {viewModal.record.userName}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Phòng ban:</strong>{" "}
                  {viewModal.record.userDepartment || "-"}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Người hỗ trợ:</strong>{" "}
                  {viewModal.record.userAssigneeName || "-"}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Thông tin liên hệ:</strong>{" "}
                  {viewModal.record.userContact || "-"}
                </p>
              </Col>
            </Row>
            {viewModal.record.note && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <p>
                    <strong>Ghi chú:</strong>
                  </p>
                  <div
                    style={{
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      padding: 12,
                      background: "#fafafa",
                    }}
                  >
                    {viewModal.record.note}
                  </div>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={cancelModal.open}
        title="Xác nhận hủy ticket"
        onCancel={() => setCancelModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setCancelModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleCancelFinish}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
      >
        <p>
          <b>{cancelModal.record?.title || cancelModal.record?.ticketTitle}</b>
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Nhập ghi chú (bắt buộc)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
      </Modal>
    </div>
  );
}

function CreateTicketTab({
  onClose,
  onCreated,
}: {
  onClose?: () => void;
  onCreated?: () => void;
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const editorRef = useRef<any>(null); // <- khai báo editorRef

  const handleUploadChange = ({ fileList }: any) => setFileList(fileList);

  const handleFinish = async (values: any) => {
    try {
      dispatch(showLoading()); // bật loading
      // lấy content trực tiếp từ editorRef
      await editorRef.current?.uploadImages();
      const html = editorRef.current?.getContent({ format: "html" }) || "";
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : {};

      // const payload = {
      //   ...values,
      //   content: html,
      //   UploadedFiles: fileList.map((file) => file),
      // };
      const payload = {
        ticketTitle: values.title || "",
        ticketType: values.type || "",
        ticketContent: html || "", // nội dung rich text
        uploadedFile: fileList?.length > 0 ? fileList[0] : null, // 1 file
        userCode: userObj.maNV || "",
        userName: userObj.hoTen || "",
        userDepartment: userObj.phongBan || "",
        userContact: values.contact || "",
        userAssigneeCode: values.userAssigneeCode || "",
        userAssigneeName: values.userAssigneeName || "",
        userAssigneeDepartment: values.userAssigneeDepartment || "",
        approvedAt: values.approvedAt || null,
        note: values.note || "",
      };
      // gọi API tạo ticket
      const formData = buildFormData(payload, fileList);
      console.log("formData:", formData);
      const res = await ticketLogApi.createTicket(formData);
      // message.success("Tạo ticket thành công!");
      if (res.status === 200 || res.status === 201) {
        // Gửi thông báo qua Teams
        // await sendTeamsNotification({
        //   title: res.data.ticketTitle || "N/A",
        //   code: res.data.ticketCode || "N/A",
        //   creator: `${res.data.userCode}-${res.data.userName}` || "",
        //   department: `${res.data.userDepartment}` || "",
        //   status: res.data.ticketStatus === 0 ? "Chờ xử lý" : "",
        //   createdAt: res.data.createdAt || "",
        // });
        message.success("Tạo ticket thành công!");
        // Reset form + editor
        form.resetFields();
        editorRef.current?.setContent("");
        setFileList([]);
        onCreated?.();

        // ✅ 2️⃣ Gửi Teams webhook chạy nền (không ảnh hưởng UI)
        Promise.resolve(
          sendTeamsNotification({
            title: res.data.ticketTitle || "N/A",
            code: res.data.ticketCode || "N/A",
            creator: `${res.data.userCode}-${res.data.userName}` || "",
            department: `${res.data.userDepartment}` || "",
            status: res.data.ticketStatus === 0 ? "Chờ xử lý" : "",
            createdAt: res.data.createdAt || "",
          }),
        )
          .then(() => console.log("Đã gửi thông báo Teams "))
          .catch((err) => console.error(" Gửi Teams thất bại:", err));
      } else {
        message.error("Tạo ticket thất bại!");
      }
    } catch (err: any) {
      console.error("Lỗi API:", err);
      message.error("Có lỗi xảy ra khi tạo ticket!");
    } finally {
      dispatch(hideLoading()); // tắt loading
    }
  };
  // const [editorContent, setEditorContent] = useState("");
  return (
    <Row gutter={24}>
      <Col xs={24} md={16}>
        <Card>
          <Form
            layout="vertical"
            form={form}
            onFinish={handleFinish}
            initialValues={{}}
          >
            <Row gutter={16}>
              <Col span={12} xs={24} sm={24} md={12}>
                <Form.Item
                  label="Tiêu đề yêu cầu"
                  name="title"
                  rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                >
                  <Input placeholder="Nhập tiêu đề" />
                </Form.Item>
              </Col>
              <Col span={12} xs={24} sm={24} md={12}>
                <Form.Item
                  label="Loại yêu cầu"
                  name="type"
                  rules={[
                    { required: true, message: "Vui lòng chọn loại yêu cầu" },
                  ]}
                >
                  <Select placeholder="Chọn loại yêu cầu">
                    <Option value="SOFT">Hỗ trợ phần mềm</Option>
                    <Option value="HARD">Hỗ trợ phần cứng</Option>
                    <Option value="SAP">SAP</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Thông tin liên hệ"
              name="contact"
              rules={[
                { required: true, message: "Vui lòng điền thông tin liên hệ" },
              ]}
            >
              <Input placeholder="Số điện thoại hoặc email liên hệ để được hỗ trợ kịp thời" />
            </Form.Item>
            <Form.Item
              label="Nội dung yêu cầu (* Gửi thêm Ultraview nếu cần hỗ trợ từ xa)"
              name="content"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung yêu cầu" },
              ]}
              // valuePropName="value"
              trigger="onEditorChange"
              getValueFromEvent={(content) => content} // TinyMCE trả về string
            >
              <Editor
                // apiKey="rzsn39pti8yr2pniyzk0arzlqvt44afffisehf0j8gagrb07"
                onInit={(_evt, editor) => (editorRef.current = editor)}
                init={{
                  height: 250,
                  skin_url: "/tinymce/skins/ui/oxide",
                  content_css: "/tinymce/skins/content/default/content.min.css",
                  language: "vi",
                  plugins: "link image table lists code",
                  toolbar:
                    "undo redo | bold italic | alignleft aligncenter alignright | image | code",
                  paste_data_images: true, // cho phép dán ảnh từ clipboard
                  automatic_uploads: true, // tự động upload ảnh
                  convert_urls: false, // giữ nguyên URL trả về
                  relative_urls: false, // không chuyển sang dạng relative
                  remove_script_host: false, // giữ nguyên host trong URL
                  images_upload_url: UploadApi.postLinkImages, // URL upload ảnh (nếu có)
                  branding: false,
                  menubar: true,
                }}
              />
            </Form.Item>

            <Form.Item label="File đính kèm" name="attachments">
              <Upload
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false}
                // multiple
                // accept=".pdf,.doc,.docx,.jpg,.png,.gif,"
              >
                <Button icon={<UploadOutlined />}>Choose Files</Button>
              </Upload>
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                Hỗ trợ file: PDF, DOC, DOCX, JPG, PNG, GIF,... (tối đa 10MB mỗi
                file)
              </div>
            </Form.Item>

            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Button
                style={{ marginRight: 8 }}
                onClick={() => {
                  form.resetFields();
                  onClose?.();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Tạo ticket
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card
            title={<span style={{ color: "#1976d2" }}>Hướng dẫn</span>}
            bordered={false}
            style={{ background: "#f8fdff" }}
          >
            <div
              style={{
                background: "#e3f6fd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <p style={{ marginBottom: 8, fontWeight: 500 }}>
                <InfoCircleOutlined
                  style={{ color: "#1890ff", marginRight: 6 }}
                />
                Lưu ý quan trọng:
              </p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>Điền đầy đủ thông tin bắt buộc</li>
                <li>Mô tả chi tiết vấn đề gặp phải</li>
                <li>Chọn đúng loại yêu cầu</li>
                <li>Đính kèm file liên quan nếu có</li>
                <li>Điền số điện thoại hoặc email để hỗ trợ kịp thời </li>
              </ul>
            </div>
            <div
              style={{ background: "#fff7e6", borderRadius: 8, padding: 12 }}
            >
              <p style={{ marginBottom: 8, fontWeight: 500 }}>
                <ClockCircleOutlined
                  style={{ color: "#faad14", marginRight: 6 }}
                />
                Thời gian phản hồi:
              </p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>
                  <b>Cao</b>: 2 giờ
                </li>
                <li>
                  <b>Trung bình</b>: 8 giờ
                </li>
                <li>
                  <b>Thấp</b>: 24 giờ
                </li>
              </ul>
            </div>
          </Card>
        </Space>
      </Col>
    </Row>
  );
}

function AllTicketsTab({ activeTab }: { activeTab: string }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [data, setData] = useState<any[]>([]);
  const [processModal, setProcessModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [completeModal, setCompleteModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [addNoteModal, setAddNoteModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  // Modal cho hành vi Xóa / Hủy ticket (giống MyTicketsTab)
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    record?: any;
  }>({
    open: false,
    record: undefined,
  });
  const [dateRange, setDateRange] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [note, setNote] = useState(""); // ✅ state để lưu nội dung ghi chú
  const [additionalNote, setAdditionalNote] = useState("");
  const [onlyMyTicket, setOnlyMyTicket] = useState(false);

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : {};

  const fetchData = async (page = 1, pageSize = 10, filters = {}) => {
    setLoading(true);
    try {
      const res = await ticketLogApi.getTickets(page, pageSize, filters);
      setData(res.items);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.totalRecords,
      });
      setFilters(filters); // lưu filter hiện tại
    } catch (err) {
      console.error("Error fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh mỗi 60s khi đang ở tab "Tất cả ticket"
  const isEqual = (a: any[], b: any[]) =>
    JSON.stringify(a) === JSON.stringify(b);

  const fetchAutoData = async (
    page = 1,
    pageSize = 10,
    filters = {},
    isSilent = false,
  ) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await ticketLogApi.getTickets(page, pageSize, filters);

      // 🚀 chỉ update nếu data thay đổi
      requestAnimationFrame(() => {
        setData((prev) => (isEqual(prev, res.items) ? prev : res.items));
      });
      // setData((prev) => {
      //   if (isEqual(prev, res.items)) return prev;
      //   return res.items;
      // });

      // 🚀 chỉ update pagination nếu cần
      setPagination((prev) => {
        if (
          prev.current === page &&
          prev.pageSize === pageSize &&
          prev.total === res.totalRecords
        ) {
          return prev;
        }

        return {
          current: page,
          pageSize: pageSize,
          total: res.totalRecords,
        };
      });

      setFilters(filters);
    } catch (err) {
      console.error("Error fetch tickets:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };
  // useEffect(() => {
  //   fetchData(pagination.current, pagination.pageSize, {
  //     // usercode: userObj?.maNV || "",
  //   });
  // }, [activeTab]);

  useEffect(() => {
    // Nếu tab chưa active thì không chạy polling
    if (activeTab !== "all") return;

    let isActive = true;
    let timer: ReturnType<typeof setTimeout>;
    const filterObj: any = {};

    if (searchText) filterObj.keyword = searchText;
    if (dateRange && dateRange.length === 2) {
      filterObj.fromDate = dateRange[0].format("YYYY-MM-DD");
      filterObj.toDate = dateRange[1].format("YYYY-MM-DD");
    }
    if (status !== "all") filterObj.status = status;
    if (type !== "all") filterObj.type = type;
    if (onlyMyTicket) filterObj.userAssigneeCode = userObj?.maNV;
    // Lưu filter vào Redux để component cha dùng export
    if (filterObj && Object.keys(filterObj).length > 0)
      dispatch(setTicketFilter(filterObj));
    else dispatch(clearTicketFilter());

    const fetchLoop = async () => {
      // await fetchData(pagination.current, pagination.pageSize, filterObj);
      await fetchAutoData(
        pagination.current,
        pagination.pageSize,
        filterObj,
        true,
      );
      if (isActive) {
        timer = setTimeout(fetchLoop, 30000); // Gọi lại sau 30s
      }
    };

    fetchLoop(); // Gọi lần đầu

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer); // Dọn dẹp timeout
    };
  }, [
    activeTab, // tab hiện tại
    searchText,
    dateRange,
    status,
    type,
    onlyMyTicket,
    pagination.current,
    pagination.pageSize,
  ]);

  // Tiếp nhận xử lý
  const handleProcess = (record: any) => {
    setProcessModal({ open: true, record });
  };

  // const handleProcessFinish = () => {
  //   setData((prev) =>
  //     prev.map((item) =>
  //       item.key === processModal.record.key
  //         ? { ...item, status: "processing" }
  //         : item
  //     )
  //   );
  //   setProcessModal({ open: false, record: undefined });
  //   message.success("Đã tiếp nhận xử lý ticket!");
  // };

  const handleProcessFinish = async () => {
    try {
      const record = processModal.record;
      // Gọi API "Tiếp nhận ticket"
      await ticketLogApi.receiveTicket(record.ticketId, {
        userAssigneeCode: userObj?.maNV, // Lấy từ user đăng nhập hiện tại
        userAssigneeName: userObj?.hoTen,
        userAssigneeDepartment: userObj?.phongBan,
        note: "Đã tiếp nhận xử lý ticket",
      });

      setProcessModal({ open: false, record: undefined });
      message.success("Đã tiếp nhận xử lý ticket!");

      // ✅ Reload lại data từ server để cập nhật đúng trạng thái và nút thao tác
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("❌ Lỗi tiếp nhận ticket:", error);
      message.error("Không thể tiếp nhận ticket. Vui lòng thử lại!");
    }
  };

  // Xác nhận hoàn tất
  const handleComplete = (record: any) => {
    setCompleteModal({ open: true, record });
  };
  const handleCompleteFinish = async () => {
    try {
      const record = completeModal.record;
      const newNoteText = note.trim() || "hoàn thành!";
      const latestNote = newNoteText;

      // ✅ Gọi API "Hoàn tất ticket"
      await ticketLogApi.completeTicket(record.ticketId, {
        note: latestNote,
      });

      setCompleteModal({ open: false, record: undefined });
      setNote("");
      message.success("Ticket đã được hoàn tất!");

      setData((prev) =>
        prev.map((item) =>
          item.ticketId === record.ticketId
            ? {
                ...item,
                note: latestNote,
                approvedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      // ✅ Reload lại data từ server để cập nhật đúng trạng thái và nút thao tác
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("Lỗi hoàn tất ticket:", error);
      message.error("Không thể hoàn tất ticket. Vui lòng thử lại!");
    }
  };

  // Xóa / Hủy ticket (mở modal nhập lý do) - tương tự MyTicketsTab
  const handleDelete = (record: any) => {
    setCancelModal({ open: true, record });
  };

  const handleCancelFinish = async () => {
    try {
      const record = cancelModal.record;
      if (!note.trim()) {
        message.error("Vui lòng nhập lý do hủy ticket!");
        return;
      }

      const latestNote = note.trim();

      // Gọi API hủy ticket
      await ticketLogApi.cancelTicket(record.ticketId, {
        note: latestNote,
        userAssigneeCode: userObj?.maNV || "",
        userAssigneeName: userObj?.hoTen || "",
        userAssigneeDepartment: userObj?.phongBan || "",
      });

      setCancelModal({ open: false, record: undefined });
      setNote("");
      message.success("Ticket đã được hủy!");

      setData((prev) =>
        prev.map((item) =>
          item.ticketId === record.ticketId
            ? { ...item, note: latestNote }
            : item,
        ),
      );

      // Reload lại dữ liệu
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("Lỗi hủy ticket:", error);
      message.error("Không thể hủy ticket. Vui lòng thử lại!");
    }
  };

  // const handleFilter = () => {
  //   const filterObj: any = {};

  //   if (searchText) filterObj.keyword = searchText;
  //   if (dateRange && dateRange.length === 2) {
  //     filterObj.fromDate = dateRange[0].format("YYYY-MM-DD");
  //     filterObj.toDate = dateRange[1].format("YYYY-MM-DD");
  //   }
  //   if (status !== "all") filterObj.status = status;
  //   if (type !== "all") filterObj.type = type;
  //   if (onlyMyTicket) filterObj.userAssigneeCode = userObj?.maNV;
  //   fetchData(1, pagination.pageSize, filterObj);
  // };
  const handleClearFilter = () => {
    setSearchText("");
    setDateRange(null);
    setStatus("all");
    setType("all");
    setOnlyMyTicket(false);
    const filterObj: any = {};
    dispatch(clearTicketFilter());
    fetchData(1, pagination.pageSize, filterObj);
  };

  const handleConfirmReset = async (record: any) => {
    try {
      // const record = processModal.record;
      // Gọi API "Tiếp nhận ticket"
      await ticketLogApi.resetticket(record.ticketId, {
        userAssigneeCode: userObj?.maNV, // 👈 Lấy từ user đăng nhập hiện tại
        userAssigneeName: userObj?.hoTen,
        userAssigneeDepartment: userObj?.phongBan,
        // note: "Đã tiếp nhận xử lý ticket",
      });

      setProcessModal({ open: false, record: undefined });
      message.success("Đã reset ticket!");

      // ✅ Reload lại data từ server để cập nhật đúng trạng thái và nút thao tác
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("❌ Lỗi tiếp nhận ticket:", error);
      message.error("Không thể tiếp nhận ticket. Vui lòng thử lại!");
    }
  };

  // Xem chi tiết ticket
  const handleView = (record: any) => {
    setViewModal({ open: true, record });
  };

  const handleOpenAddNote = (record: any) => {
    setAdditionalNote("");
    setAddNoteModal({ open: true, record });
  };

  const handleAddNoteFinish = async () => {
    try {
      const record = addNoteModal.record;
      if (!additionalNote.trim()) {
        message.error("Vui lòng nhập nội dung ghi chú!");
        return;
      }

      const authorName = userObj?.hoTen || userObj?.maNV || "Người hỗ trợ";
      const timestamp = dayjs().format("DD/MM/YYYY HH:mm");
      const currentNote = record?.note ? `${record.note}\n` : "";
      const appendedNote = `${currentNote}[${timestamp}] ${authorName}: ${additionalNote.trim()}`;

      const res = await ticketLogApi.noteTicket(record.ticketId, {
        ...record,
        note: appendedNote,
      });

      if (res?.message) {
        message.success(res.message);
        setData((prev) =>
          prev.map((item) =>
            item.ticketId === record.ticketId
              ? { ...item, note: appendedNote }
              : item,
          ),
        );
        setAddNoteModal({ open: false, record: undefined });
        setAdditionalNote("");
      } else {
        message.error("Cập nhật ghi chú thất bại!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật ghi chú:", error);
      message.error("Không thể thêm ghi chú. Vui lòng thử lại!");
    }
  };

  const columns = [
    {
      title: "Thao tác",
      key: "action",
      fixed: "left" as const,
      width: 40,
      render: (_: any, record: any) => {
        const isAdmin = userObj.role === "admin";
        const isAssignee =
          record.ticketStatus === 1 &&
          userObj?.maNV === record.userAssigneeCode;
        // const isOwner = userObj?.maNV === record.userCode;

        // Tất cả người dùng đều thấy nút View
        const buttons = [
          <Tooltip title="Xem chi tiết">
            <Button
              key="view"
              type="text"
              icon={<EyeTwoTone twoToneColor="#1890ff" />}
              onClick={() => handleView(record)}
            />
          </Tooltip>,
        ];

        // Thêm nút Xóa (chức năng giống MyTicketsTab) - chỉ khi chưa tiếp nhận (ticketStatus === 0)
        // Cho phép user chủ ticket xóa
        if (record.ticketStatus === 0 && isAdmin) {
          buttons.push(
            <Tooltip title="Xóa ticket">
              <Button
                key="delete"
                type="text"
                icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>,
          );
        }

        // Admin: nút Tiếp nhận và Hoàn tất
        if (isAdmin) {
          // Nút Tiếp nhận - chỉ hiển thị khi ticketStatus = 0
          if (record.ticketStatus === 0) {
            buttons.push(
              <Tooltip title="Tiếp nhận xử lý">
                <Button
                  key="process"
                  type="text"
                  icon={<PlusSquareTwoTone twoToneColor="#1890ff" />}
                  onClick={() => handleProcess(record)}
                />
              </Tooltip>,
            );
          }
          // Nút Hoàn tất - chỉ hiển thị nếu admin đó là người đã tiếp nhận
          if (isAssignee) {
            buttons.push(
              <Tooltip title="Xác nhận hoàn tất">
                <Button
                  key="complete"
                  type="text"
                  icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                  onClick={() => handleComplete(record)}
                />
              </Tooltip>,
            );
            buttons.push(
              <Popconfirm
                title="Hủy tiếp nhận ticket"
                description="Bạn có muốn hủy tiếp nhận ticket này?"
                onConfirm={() => handleConfirmReset(record)}
                okText="Có"
                cancelText="Không"
              >
                <Tooltip title="Hủy tiếp nhận ticket">
                  <Button
                    key="reset"
                    type="text"
                    icon={<CloseCircleTwoTone twoToneColor="#e60a02ff" />}
                    // onClick={() => handleComplete(record)}
                  />
                </Tooltip>
              </Popconfirm>,
            );
          }
        }

        // User thường: chỉ hiển thị nút Hoàn tất nếu là người đang xử lý
        if (!isAdmin && isAssignee) {
          buttons.push(
            <Button
              key="complete"
              type="text"
              icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
              onClick={() => handleComplete(record)}
            />,
          );
        }

        return <Space size={1}>{buttons}</Space>;
      },
    },
    {
      title: <b>Mã ticket</b>,
      dataIndex: "ticketCode",
      key: "ticketCode",
      fixed: "left" as const,
      render: (text: string, record: any) => (
        <b
          style={{ color: "#1976d2", cursor: "pointer" }}
          onClick={() => handleView(record)}
        >
          {text}
        </b>
      ),
      width: 50,
      // sorter: (a: TicketLog, b: TicketLog) => {
      //   // If ticketCode is numeric string, compare as numbers; otherwise, use localeCompare
      //   const aCode = a.ticketCode;
      //   const bCode = b.ticketCode;
      //   if (!isNaN(Number(aCode)) && !isNaN(Number(bCode))) {
      //     return Number(aCode) - Number(bCode);
      //   }
      //   return String(aCode).localeCompare(String(bCode));
      // },
    },
    {
      title: "Tiêu đề",
      dataIndex: "ticketTitle",
      key: "ticketTitle",
      width: 60,
      ellipsis: true,
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "ticketType",
      key: "ticketType",
      width: 40,
      ellipsis: true,
      render: (status: string) => (
        <text color={"default"}>{typeConfig[status]?.text || status}</text>
      ),
    },
    {
      title: "Người yêu cầu",
      dataIndex: "userName",
      key: "userName",
      width: 45,
      ellipsis: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 45,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "ticketStatus",
      key: "ticketStatus",
      width: 30,
      render: (status: string) => renderTicketStatusIcon(status),
    },
    {
      title: "Người hỗ trợ",
      dataIndex: "userAssigneeName",
      key: "userAssigneeName",
      width: 45,
      render: (_: string, record: any) => renderSupportAssignee(record),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 80,
      render: (value: string, record: any) => {
        const canAddNote =
          record.ticketStatus === 1 &&
          userObj?.maNV === record.userAssigneeCode;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>
              {value || <span style={{ color: "#aaa" }}>-</span>}
            </span>
            {canAddNote && (
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                style={{ padding: 0, height: "auto", width: "fit-content" }}
                onClick={() => handleOpenAddNote(record)}
              >
                Thêm ghi chú
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: "Thời gian tiếp nhận",
      dataIndex: "receivedAt",
      key: "receivedAt",
      width: 40,
      render: (value: string) =>
        value ? (
          dayjs(value).format("DD/MM/YYYY HH:mm")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
    {
      title: "Thời gian hoàn thành",
      dataIndex: "approvedAt",
      key: "approvedAt",
      width: 40,
      render: (value: string) =>
        value ? (
          dayjs(value).format("DD/MM/YYYY HH:mm")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 8 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Mã ticket, tiêu đề..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              value={status}
              style={{ width: "100%" }}
              onChange={setStatus}
            >
              <Option value="all">Tất cả</Option>
              <Option value="0">Chờ tiếp nhận</Option>
              <Option value="1">Đang xử lý</Option>
              <Option value="2">Hoàn tất</Option>
              <Option value="3">Hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select value={type} style={{ width: "100%" }} onChange={setType}>
              <Option value="all">Tất cả</Option>
              <Option value="SOFT">Hỗ trợ phần mềm</Option>
              <Option value="HARD">Hỗ trợ phần cứng</Option>
              <Option value="SAP">SAP</Option>
            </Select>
          </Col>
          <Col>
            <Checkbox
              checked={onlyMyTicket}
              onChange={(e) => {
                const checked = e.target.checked;
                setOnlyMyTicket(checked);
              }}
            >
              Ticket của tôi
            </Checkbox>
          </Col>
          {/* <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleFilter}
            >
              Lọc
            </Button>
          </Col> */}
          <Col>
            <Button onClick={handleClearFilter}>Xóa bộ lọc</Button>
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          rowKey="ticketId"
          columns={columns}
          dataSource={data}
          loading={loading}
          // pagination={{
          //   total: data.length,
          //   pageSize: 10,
          //   showSizeChanger: true,
          //   showQuickJumper: true,
          //   showTotal: (total, range) =>
          //     `${range[0]}-${range[1]} của ${total} ticket`,
          // }}
          showSorterTooltip={{ target: "sorter-icon" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize, filters), // phân trang
          }}
          scroll={{ x: 1500, y: 600 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={11} align="right">
                <span style={{ fontWeight: 500 }}>
                  Tổng: {pagination.total} ticket
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
      <Modal
        open={processModal.open}
        title="Tiếp nhận xử lý ticket"
        onCancel={() => setProcessModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setProcessModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleProcessFinish}>
            Tiếp nhận xử lý
          </Button>,
        ]}
        destroyOnClose
      >
        <p>Bạn có chắc chắn muốn tiếp nhận xử lý ticket này?</p>
        <p>
          <b>{processModal.record?.title}</b>
        </p>
      </Modal>
      <Modal
        open={completeModal.open}
        title="Xác nhận hoàn tất ticket"
        onCancel={() => setCompleteModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setCompleteModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleCompleteFinish}>
            Xác nhận hoàn tất
          </Button>,
        ]}
        destroyOnClose
      >
        <p>Bạn có chắc chắn muốn xác nhận hoàn tất ticket này?</p>
        <p>
          <b>{completeModal.record?.title}</b>
        </p>
        {/* ✅ Ô nhập ghi chú */}
        <Input.TextArea
          rows={3}
          placeholder="Nhập ghi chú hoàn tất (bắt buộc)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
      {/* Modal Xóa / Hủy ticket (dùng chung như MyTicketsTab) */}
      <Modal
        open={cancelModal.open}
        title="Xác nhận hủy ticket"
        onCancel={() => setCancelModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setCancelModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleCancelFinish}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
      >
        <p>
          {/* <b>{cancelModal.record?.title || cancelModal.record?.ticketTitle}</b> */}
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Nhập ghi chú (bắt buộc)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
      </Modal>
      <Modal
        open={addNoteModal.open}
        title="Thêm ghi chú ticket"
        onCancel={() => setAddNoteModal({ open: false, record: undefined })}
        footer={[
          <Button
            key="cancel"
            onClick={() => setAddNoteModal({ open: false, record: undefined })}
          >
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleAddNoteFinish}>
            Lưu ghi chú
          </Button>,
        ]}
        destroyOnClose
      >
        <p style={{ marginBottom: 8 }}>
          <b>{addNoteModal.record?.ticketCode}</b> -{" "}
          {addNoteModal.record?.ticketTitle}
        </p>
        <Input.TextArea
          rows={4}
          placeholder="Nhập ghi chú bổ sung"
          value={additionalNote}
          onChange={(e) => setAdditionalNote(e.target.value)}
        />
      </Modal>
      <Modal
        open={viewModal.open}
        title="Chi tiết ticket"
        onCancel={() => setViewModal({ open: false, record: undefined })}
        footer={[
          ...(userObj.role === "admin" &&
          Number(viewModal.record?.ticketStatus) === 0
            ? [
                <Button
                  key="receive"
                  type="primary"
                  icon={<PlusSquareTwoTone twoToneColor="#1890ff" />}
                  onClick={() => {
                    const record = viewModal.record;
                    if (!record) return;
                    setViewModal({ open: false, record: undefined });
                    handleProcess(record);
                  }}
                >
                  Tiếp nhận xử lý
                </Button>,
                <Button
                  key="cancel-ticket"
                  danger
                  icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
                  onClick={() => {
                    const record = viewModal.record;
                    if (!record) return;
                    setViewModal({ open: false, record: undefined });
                    handleDelete(record);
                  }}
                >
                  Hủy ticket
                </Button>,
              ]
            : []),
          <Button
            key="close"
            onClick={() => setViewModal({ open: false, record: undefined })}
          >
            Đóng
          </Button>,
        ]}
        destroyOnClose
        width={800}
      >
        {viewModal.record && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Mã ticket:</strong> {viewModal.record.ticketCode}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <Tag
                    color={statusConfig[viewModal.record.ticketStatus]?.color}
                  >
                    {statusConfig[viewModal.record.ticketStatus]?.text}
                  </Tag>
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <p>
                  <strong>Tiêu đề:</strong> {viewModal.record.ticketTitle}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <p>
                  <strong>Nội dung yêu cầu:</strong>
                </p>
                <div
                  style={{
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    padding: 12,
                    minHeight: 100,
                    maxHeight: 400,
                    overflow: "auto",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: viewModal.record.ticketContent,
                  }}
                />
              </Col>
              <Col span={24} style={{ marginTop: 8 }}>
                <p>
                  <strong>File đính kèm:</strong>{" "}
                  {viewModal.record.fileUrl ? (
                    <a
                      href={viewModal.record.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#d21919ff", fontWeight: 500 }}
                    >
                      Xem file đính kèm
                    </a>
                  ) : (
                    ""
                  )}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Loại yêu cầu:</strong>{" "}
                  <Tag color={typeConfig[viewModal.record.ticketType]?.color}>
                    {typeConfig[viewModal.record.ticketType]?.text}
                  </Tag>
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Ngày tạo:</strong>{" "}
                  {viewModal.record.createdAt
                    ? dayjs(viewModal.record.createdAt).format(
                        "DD/MM/YYYY HH:mm",
                      )
                    : "-"}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Người yêu cầu:</strong> {viewModal.record.userCode} -{" "}
                  {viewModal.record.userName}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Phòng ban:</strong>{" "}
                  {viewModal.record.userDepartment || "-"}
                </p>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p>
                  <strong>Người hỗ trợ:</strong>{" "}
                  {viewModal.record.userAssigneeName || "-"}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Thông tin liên hệ:</strong>{" "}
                  {viewModal.record.userContact || "-"}
                </p>
              </Col>
            </Row>
            {viewModal.record.note && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <p>
                    <strong>Ghi chú:</strong>
                  </p>
                  <div
                    style={{
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      padding: 12,
                      background: "#fafafa",
                    }}
                  >
                    {viewModal.record.note}
                  </div>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

const TicketProcessing = () => {
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdmin = userObj.role === "admin";

  const [activeTab, setActiveTab] = useState(isAdmin ? "all" : "mine");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [todaySupportSummary, setTodaySupportSummary] = useState<
    Record<
      string,
      Array<{
        email: string;
        avatar?: string;
        code: string;
        name: string;
        count: number;
      }>
    >
  >({ SOFT: [], HARD: [], SAP: [] });
  // const [todayWaitingCount, setTodayWaitingCount] = useState(0);
  // const [todayCreatedCount, setTodayCreatedCount] = useState(0);
  const [todayWaitingByType, setTodayWaitingByType] = useState<
    Record<string, number>
  >({ SOFT: 0, HARD: 0, SAP: 0 });
  // const [todayCreatedByType, setTodayCreatedByType] = useState<Record<string, number>>({
  //   SOFT: 0,
  //   HARD: 0,
  //   SAP: 0,
  // });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSupportList, setShowSupportList] = useState(true);
  const ticketFilter = useSelector((state: RootState) => state.ticket);

  const fetchTodaySupportSummary = async () => {
    setSummaryLoading(true);
    try {
      const today = dayjs()
        .subtract(1, "month")
        .startOf("month")
        .format("YYYY-MM-DD");
      const denngay = dayjs().add(1, "day").format("YYYY-MM-DD");
      const firstPage = await ticketLogApi.getTickets(1, 200, {
        fromDate: today,
        toDate: denngay,
      });

      let allItems = [...(firstPage.items || [])];
      for (let page = 2; page <= (firstPage.totalPages || 1); page += 1) {
        const nextPage = await ticketLogApi.getTickets(page, 200, {
          fromDate: today,
          toDate: denngay,
        });
        allItems = allItems.concat(nextPage.items || []);
      }

      const now = dayjs();
      const createdToday = allItems.filter((ticket: any) =>
        ticket?.createdAt ? dayjs(ticket.createdAt).isSame(now, "day") : false,
      );
      const waitingToday = allItems.filter(
        (ticket: any) => Number(ticket?.ticketStatus) === 1,
      );

      const waitingByType = waitingToday.reduce(
        (acc: Record<string, number>, ticket: any) => {
          const ticketType = ticket?.ticketType;
          if (ticketType && acc[ticketType] !== undefined) {
            acc[ticketType] += 1;
          }
          return acc;
        },
        { SOFT: 0, HARD: 0, SAP: 0 },
      );

      const createdByType = createdToday.reduce(
        (acc: Record<string, number>, ticket: any) => {
          const ticketType = ticket?.ticketType;
          if (ticketType && acc[ticketType] !== undefined) {
            acc[ticketType] += 1;
          }
          return acc;
        },
        { SOFT: 0, HARD: 0, SAP: 0 },
      );

      // const waitingCount = waitingToday.length;
      // const createdCount = createdToday.length;

      // setTodayWaitingCount(waitingCount);
      // setTodayCreatedCount(createdCount);
      setTodayWaitingByType(waitingByType);
      // setTodayCreatedByType(createdByType);

      // Tạo mapping từ maNhanVien -> staff info từ json_info_user
      const staffGroupMap = new Map<
        string,
        {
          maNhomHoTro: string;
          hoTen: string;
          email: string;
          avatar?: string;
        }
      >();
      (supportStaffData.supportStaff || []).forEach((staff: any) => {
        staffGroupMap.set(staff.maNhanVien, {
          maNhomHoTro: staff.maNhomHoTro,
          hoTen: staff.hoTen,
          email: staff.email,
          avatar: staff.avatar,
        });
      });

      // Group theo maNhomHoTro - khởi tạo với TẤT CẢ staff từ json
      const summaryByGroup: Record<
        string,
        Map<
          string,
          {
            code: string;
            name: string;
            count: number;
            email: string;
            avatar?: string;
          }
        >
      > = {
        SOFT: new Map(),
        HARD: new Map(),
        SAP: new Map(),
      };

      // Bước 1: Thêm tất cả staff từ json config vào summaryByGroup với count = 0
      (supportStaffData.supportStaff || []).forEach((staff: any) => {
        const group = staff.maNhomHoTro;
        const key = `${staff.maNhanVien}-${staff.hoTen}`;
        if (summaryByGroup[group] && !summaryByGroup[group].has(key)) {
          summaryByGroup[group].set(key, {
            code: staff.maNhanVien,
            name: staff.hoTen,
            count: 0,
            email: staff.email,
            avatar: staff.avatar,
          });
        }
      });

      // Bước 2: Đếm tickets cho mỗi staff
      allItems
        .filter((x) => x.ticketStatus === 1)
        .forEach((ticket: any) => {
          const hasAssignee = !!ticket?.userAssigneeCode;
          if (!hasAssignee) return;

          const code = ticket.userAssigneeCode;
          const name = ticket.userAssigneeName || "Chưa rõ";
          const staffInfo = staffGroupMap.get(code);
          const group = staffInfo?.maNhomHoTro || "SOFT";
          const key = `${code}-${name}`;

          // Nếu staff chưa trong map, thêm vào (trường hợp staff không trong json)
          if (!summaryByGroup[group].has(key)) {
            summaryByGroup[group].set(key, {
              code,
              name,
              count: 0,
              email: staffInfo?.email || "",
              avatar: staffInfo?.avatar,
            });
          }
          const current = summaryByGroup[group].get(key)!;
          current.count += 1;
        });

      // Convert Map thành Array và sort (những người có tickets ở trước)
      const finalSummary: Record<
        string,
        Array<{
          code: string;
          name: string;
          count: number;
          email: string;
          avatar?: string;
        }>
      > = {
        SOFT: Array.from(summaryByGroup.SOFT.values()).sort(
          (a, b) => b.count - a.count,
        ),
        HARD: Array.from(summaryByGroup.HARD.values()).sort(
          (a, b) => b.count - a.count,
        ),
        SAP: Array.from(summaryByGroup.SAP.values()).sort(
          (a, b) => b.count - a.count,
        ),
      };

      setTodaySupportSummary(finalSummary);
    } catch (error) {
      console.error("Error fetch today support summary:", error);
      setTodaySupportSummary({ SOFT: [], HARD: [], SAP: [] });
      // setTodayWaitingCount(0);
      // setTodayCreatedCount(0);
      setTodayWaitingByType({ SOFT: 0, HARD: 0, SAP: 0 });
      // setTodayCreatedByType({ SOFT: 0, HARD: 0, SAP: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySupportSummary();
    const timer = setInterval(() => {
      fetchTodaySupportSummary();
    }, 30000);

    return () => clearInterval(timer);
  }, []);
  // Dummy export function
  const handleExportExcel = async () => {
    try {
      const response = await ticketLogApi.exportExcel(ticketFilter);

      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TicketLogs_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Excel failed:", error);
      message.error("Xuất file thất bại!");
    }
  };
  // Chuyển sang tab tạo ticket mới
  const handleCreateTicketClick = () => {
    setCreateModalOpen(true);
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          {/* <Title level={2} style={{ margin: 0 }}>
            Quản lý Yêu cầu hỗ trợ
          </Title> */}
        </Col>
        <Col></Col>
      </Row>

      <Card loading={summaryLoading} style={{ marginBottom: 16 }}>
        {/* <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col>
            <Tag color="gold">
              Chờ tiếp nhận xử lý: <b>{todayWaitingCount}</b>
            </Tag>
          </Col>
          <Col>
            <Tag color="geekblue">
              Ticket đã được tạo: <b>{todayCreatedCount}</b>
            </Tag>
          </Col>
        </Row> */}

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Đang xử lý</div>
            {Object.entries(todayWaitingByType).map(([type, count]) => (
              <Tag
                key={`waiting-${type}`}
                color={typeConfig[type]?.color || "default"}
              >
                {typeConfig[type]?.text || type}: {count}
              </Tag>
            ))}
          </Col>
          {/* <Col xs={24} md={12}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              Ticket được tạo trong ngày
            </div>
            {Object.entries(todayCreatedByType).map(([type, count]) => (
              <Tag
                key={`created-${type}`}
                color={typeConfig[type]?.color || "default"}
              >
                {typeConfig[type]?.text || type}: {count}
              </Tag>
            ))}
          </Col> */}
        </Row>

        <Row style={{ marginBottom: 12 }}>
          <Col>
            <Button
              type="default"
              icon={
                showSupportList ? <EyeInvisibleOutlined /> : <EyeOutlined />
              }
              onClick={() => setShowSupportList((prev) => !prev)}
            >
              {showSupportList
                ? "Ẩn danh sách người hỗ trợ"
                : "Hiện danh sách người hỗ trợ"}
            </Button>
          </Col>
        </Row>

        {showSupportList &&
        Object.values(todaySupportSummary).flat().length > 0 ? (
          <Row gutter={[16, 16]}>
            {(["SOFT", "HARD", "SAP"] as const).map((group) => {
              const staffList = todaySupportSummary[group] || [];
              const totalCount = staffList.reduce(
                (sum, item) => sum + item.count,
                0,
              );

              return (
                <Col xs={24} sm={24} md={8} key={group}>
                  <Card
                    style={{
                      background: supportGroupConfig[group]?.bgColor,
                      borderLeft: `4px solid ${supportGroupConfig[group]?.color}`,
                      borderRadius: 8,
                      height: 250,
                      display: "flex",
                      flexDirection: "column",
                    }}
                    bodyStyle={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      padding: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                        paddingBottom: 8,
                        borderBottom: `1px solid ${supportGroupConfig[group]?.color}33`,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          marginRight: 8,
                          color: supportGroupConfig[group]?.color,
                        }}
                      >
                        {supportGroupConfig[group]?.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: supportGroupConfig[group]?.color,
                          }}
                        >
                          {supportGroupConfig[group]?.text} - {totalCount} đang
                          xử lý
                        </div>
                        {/* <div style={{ fontSize: 11, color: "#999" }}>
                          {totalCount} yêu cầu
                        </div> */}
                      </div>
                    </div>

                    {staffList.length > 0 ? (
                      <div
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          overflowX: "hidden",
                          paddingRight: 4,
                        }}
                      >
                        {staffList.map((item) => (
                          <div
                            key={`${item.code}-${item.name}`}
                            style={{
                              padding: 8,
                              marginBottom: 8,
                              borderRadius: 4,
                              background: "white",
                              border: `1px solid ${supportGroupConfig[group]?.color}22`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              opacity: item.count > 0 ? 1 : 0.7,
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Tooltip
                                title={
                                  item.avatar ? (
                                    <img
                                      src={item.avatar}
                                      alt={item.name}
                                      style={{
                                        width: 120,
                                        height: 120,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                      }}
                                    />
                                  ) : (
                                    "Chua co avatar"
                                  )
                                }
                              >
                                <Avatar
                                  size={22}
                                  src={item.avatar || undefined}
                                  icon={<UserOutlined />}
                                  style={{
                                    flexShrink: 0,
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                {item.name} (
                                <span
                                  style={{
                                    color: "#d21919ff",
                                    fontWeight: 500,
                                  }}
                                >
                                  {item.email}
                                </span>
                                )
                              </div>
                              {/* <div style={{ fontSize: 11, color: "#666" }}>
                                {item.email}
                              </div> */}
                            </div>
                            <Tooltip
                              title={
                                item.count > 0
                                  ? `${item.count} yêu cầu đang xử lý`
                                  : "Không có yêu cầu đang xử lý"
                              }
                            >
                              <Badge
                                count={item.count > 0 ? item.count : 0}
                                overflowCount={99}
                                color={item.count > 0 ? "#fa8c16" : "#52c41a"}
                                size="small"
                              >
                                <span
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      item.count > 0 ? "#fff7e6" : "#f6ffed",
                                    border:
                                      item.count > 0
                                        ? "1px solid #ffd591"
                                        : "1px solid #b7eb8f",
                                  }}
                                >
                                  {item.count > 0 ? (
                                    <Loading3QuartersOutlined
                                      spin
                                      style={{ color: "#fa8c16", fontSize: 14 }}
                                    />
                                  ) : (
                                    <CheckCircleFilled
                                      style={{ color: "#52c41a", fontSize: 14 }}
                                    />
                                  )}
                                </span>
                              </Badge>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: 11 }}>
                        Chưa có nhân viên
                      </span>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : showSupportList ? (
          <span style={{ color: "#888" }}>
            Chưa có nhân viên nào tiếp nhận ticket trong ngày.
          </span>
        ) : (
          <span style={{ color: "#888" }}>
            Danh sách người hỗ trợ đang được ẩn.
          </span>
        )}
      </Card>

      <Modal
        open={createModalOpen}
        title="Tạo yêu cầu mới"
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <CreateTicketTab
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
          }}
        />
      </Modal>

      <Space style={{}}>
        <Button
          className="ticket-create-request-button"
          type="primary"
          size="large"
          icon={<PlusCircleOutlined />}
          onClick={handleCreateTicketClick}
          style={{
            height: 44,
            padding: "0 22px",
            borderRadius: 999,
            fontWeight: 700,
            border: "1px solid rgba(255, 255, 255, 0.32)",
            background:
              "linear-gradient(135deg, #1677ff 0%, #2f54eb 45%, #13c2c2 100%)",
            boxShadow:
              "0 14px 30px rgba(22, 119, 255, 0.38), 0 0 0 1px rgba(22, 119, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
          }}
        >
          Tạo yêu cầu hỗ trợ
        </Button>
        {userObj.role === "admin" && (
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        )}
      </Space>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          ...(isAdmin
            ? [
                {
                  key: "all",
                  label: (
                    <>
                      <span style={{ marginRight: 6 }}>
                        <i className="fa fa-list" />
                      </span>
                      Tất cả yêu cầu
                    </>
                  ),
                  children: <AllTicketsTab activeTab={activeTab} />,
                },
              ]
            : []),
          {
            key: "mine",
            label: (
              <>
                <span style={{ marginRight: 6 }}>
                  <i className="fa fa-user" />
                </span>
                Yêu cầu của tôi
              </>
            ),
            children: <MyTicketsTab activeTab={activeTab} />,
          },
        ]}
      />
    </div>
  );
};

export default TicketProcessing;
