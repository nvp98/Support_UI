import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Typography,
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
  UploadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  DeleteTwoTone,
  CheckCircleTwoTone,
  PlusSquareTwoTone,
  EditTwoTone,
  EyeTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";

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
// import type { TicketLog } from "../../models/ticketLog";

const { Title } = Typography;
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
};

const typeConfig: Record<string, { color: string; text: string }> = {
  SOFT: { color: "red", text: "Hỗ trợ phần mềm" },
  HARD: { color: "orange", text: "Hỗ trợ phần cứng" },
  SAP: { color: "cyan", text: "SAP" },
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
  const [editModal, setEditModal] = useState<{ open: boolean; record?: any }>({
    open: false,
    record: undefined,
  });
  const [viewModal, setViewModal] = useState<{ open: boolean; record?: any }>({
    open: false,
    record: undefined,
  });
  const [editForm] = Form.useForm();
  const editEditorRef = useRef<any>(null); // Ref for TinyMCE editor

  // Thêm state cho bộ lọc ngày
  const [dateRange, setDateRange] = useState<any>(null);

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

  const handleDelete = async (key: string) => {
    try {
      setLoading(true);
      // TODO: Gọi API xóa ticket khi API này được implement
      // await ticketLogApi.deleteTicket(key);

      // Mock xóa ticket
      setTimeout(() => {
        setData((prev) => prev.filter((item) => item.key !== key));
        message.success("Đã xóa ticket!");
      }, 500);

      // Reload lại data từ server
      await fetchData(pagination.current, pagination.pageSize, {
        usercode: userObj?.maNV || "",
      });
    } catch (error) {
      console.error("❌ Lỗi xóa ticket:", error);
      message.error("Không thể xóa ticket. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (record: any) => {
    console.log("Edit record:", record);
    setEditModal({ open: true, record });
    editForm.setFieldsValue(record);
  };

  const handleEditFinish = (values: any) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === editModal.record.key ? { ...item, ...values } : item
      )
    );
    setEditModal({ open: false, record: undefined });
    console.log("Edited values:", values);
    message.success("Đã cập nhật ticket!");
  };

  // Xem chi tiết ticket
  const handleView = (record: any) => {
    setViewModal({ open: true, record });
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
          {/* Chỉ hiển thị nút Xóa khi ticket chưa được tiếp nhận (status = 0) */}
          {record.ticketStatus === 0 && (
            <Tooltip title="Xóa ticket">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa ticket này?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record.key)}
              >
                <Button
                  type="text"
                  icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditTwoTone twoToneColor="#1890ff" />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
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
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color || "default"}>
          {statusConfig[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: "Người hỗ trợ",
      dataIndex: "userAssigneeName",
      key: "userAssigneeName",
      width: 45,
      render: (assignee: string) =>
        assignee || <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 80,
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
            label="Tiêu đề ticket"
            name="ticketTitle"
            rules={[{ required: true, message: "Nhập tiêu đề ticket" }]}
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
          >
            <Editor
              onInit={(_evt, editor) => (editEditorRef.current = editor)}
              initialValue={editModal.record?.ticketContent}
              init={{
                height: 250,
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
                        "DD/MM/YYYY HH:mm"
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
    </div>
  );
}

function CreateTicketTab() {
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

        // ✅ 2️⃣ Gửi Teams webhook chạy nền (không ảnh hưởng UI)
        Promise.resolve(
          sendTeamsNotification({
            title: res.data.ticketTitle || "N/A",
            code: res.data.ticketCode || "N/A",
            creator: `${res.data.userCode}-${res.data.userName}` || "",
            department: `${res.data.userDepartment}` || "",
            status: res.data.ticketStatus === 0 ? "Chờ xử lý" : "",
            createdAt: res.data.createdAt || "",
          })
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
                  label="Tiêu đề ticket"
                  name="title"
                  rules={[
                    { required: true, message: "Vui lòng nhập tiêu đề ticket" },
                  ]}
                >
                  <Input placeholder="Nhập tiêu đề ticket" />
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
                multiple
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
                onClick={() => form.resetFields()}
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
  const [dateRange, setDateRange] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [note, setNote] = useState(""); // ✅ state để lưu nội dung ghi chú
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
  // useEffect(() => {
  //   fetchData(pagination.current, pagination.pageSize, {
  //     // usercode: userObj?.maNV || "",
  //   });
  // }, [activeTab]);

  useEffect(() => {
    // Nếu tab chưa active thì không chạy polling
    if (activeTab !== "all") return;

    let isActive = true;
    let timer: NodeJS.Timeout;

    const fetchLoop = async () => {
      const filterObj: any = {};

      if (searchText) filterObj.keyword = searchText;
      if (dateRange && dateRange.length === 2) {
        filterObj.fromDate = dateRange[0].format("YYYY-MM-DD");
        filterObj.toDate = dateRange[1].format("YYYY-MM-DD");
      }
      if (status !== "all") filterObj.status = status;
      if (type !== "all") filterObj.type = type;
      if (onlyMyTicket) filterObj.userAssigneeCode = userObj?.maNV;

      await fetchData(pagination.current, pagination.pageSize, filterObj);

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
        userAssigneeCode: userObj?.maNV, // 👈 Lấy từ user đăng nhập hiện tại
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

      // ✅ Gọi API "Hoàn tất ticket"
      await ticketLogApi.completeTicket(record.ticketId, {
        note: note || "hoàn thành!", // lấy từ input hoặc fallback
      });

      setCompleteModal({ open: false, record: undefined });
      setNote("");
      message.success("Ticket đã được hoàn tất!");

      // ✅ Reload lại data từ server để cập nhật đúng trạng thái và nút thao tác
      await fetchData(pagination.current, pagination.pageSize, filters);
    } catch (error: any) {
      console.error("Lỗi hoàn tất ticket:", error);
      message.error("Không thể hoàn tất ticket. Vui lòng thử lại!");
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

        // Tất cả người dùng đều thấy nút View
        const buttons = [
          <Button
            key="view"
            type="text"
            icon={<EyeTwoTone twoToneColor="#1890ff" />}
            onClick={() => handleView(record)}
          />,
        ];

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
              </Tooltip>
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
              </Tooltip>
            );
            buttons.push(
              <Popconfirm
                title="Hủy tiếp nhận ticket"
                description="Bạn có muốn hủy tiếp nhận ticket này?"
                onConfirm={() => handleConfirmReset(record)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  key="reset"
                  type="text"
                  icon={<CloseCircleTwoTone twoToneColor="#e60a02ff" />}
                  // onClick={() => handleComplete(record)}
                />
              </Popconfirm>
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
            />
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
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color || "default"}>
          {statusConfig[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: "Người hỗ trợ",
      dataIndex: "userAssigneeName",
      key: "userAssigneeName",
      width: 45,
      render: (assignee: string) =>
        assignee || <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 80,
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
              <Col span={24} style={{ marginTop: 8 }}>
                <p>
                  <strong>File đính kèm:</strong>{" "}
                  {viewModal.record.fileUrl ? (
                    <a
                      href={viewModal.record.fileUrl}
                      target="_blank"
                      rel="noreferrer"
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
                        "DD/MM/YYYY HH:mm"
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
    </div>
  );
}

const TicketProcessing = () => {
  const [activeTab, setActiveTab] = useState("all");
  console.log("Active Tab:", activeTab);

  // Dummy export function
  const handleExportExcel = () => {
    // Thay bằng logic export thực tế của bạn
    message.success("Xuất Excel thành công!");
  };

  // Chuyển sang tab tạo ticket mới
  const handleCreateTicketClick = () => {
    setActiveTab("create");
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Quản lý Ticket
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTicketClick}
            >
              Tạo ticket mới
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
              Xuất Excel
            </Button>
          </Space>
        </Col>
      </Row>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: "all",
            label: (
              <>
                <span style={{ marginRight: 6 }}>
                  <i className="fa fa-list" />
                </span>
                Tất cả ticket
              </>
            ),
            children: <AllTicketsTab activeTab={activeTab} />,
          },
          {
            key: "mine",
            label: (
              <>
                <span style={{ marginRight: 6 }}>
                  <i className="fa fa-user" />
                </span>
                Ticket của tôi
              </>
            ),
            children: <MyTicketsTab activeTab={activeTab} />,
          },
          {
            key: "create",
            label: (
              <>
                <span style={{ marginRight: 6 }}>
                  <i className="fa fa-plus-circle" />
                </span>
                Tạo ticket mới
              </>
            ),
            children: <CreateTicketTab />,
          },
        ]}
      />
    </div>
  );
};

export default TicketProcessing;
