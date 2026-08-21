import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  StopOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Editor, type IAllProps } from "@tinymce/tinymce-react";
import type { Editor as TinyMceEditor } from "tinymce";
import dayjs from "dayjs";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/table";
import "tinymce/plugins/lists";
import "tinymce/plugins/code";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce-i18n/langs5/vi.js";
import type {
  ChangeRequest,
  ChangeRequestAction,
  ChangeRevision,
  SlcModule,
  SlcProject,
} from "../../../models/slc";
import {
  CR_STATUS_COLORS,
  CR_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "../../../models/slc";
import type { NhanVien } from "../../../models/eportal";
import { changeRequestApi, moduleApi, projectApi } from "../../../services/slcApi";
import { nhanVienApi } from "../../../services/EPortalApi";
import { UploadApi } from "../../../services/UploadApi";
import RichHtmlPreview from "./RichHtmlPreview";
import "./ChangeManagement.css";

const { Search, TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const RICH_TEXT_EDITOR_OPTIONS: NonNullable<IAllProps["init"]> = {
  height: 250,
  skin: false,
  content_css: false,
  content_style: "body { font-family: Arial, sans-serif; font-size: 14px; overflow-wrap: anywhere; } img { height: auto; max-width: 100%; } table { border-collapse: collapse; max-width: 100%; }",
  language: "vi",
  plugins: "link image table lists code",
  toolbar: "undo redo | bold italic | alignleft aligncenter alignright | image | code",
  paste_data_images: true,
  automatic_uploads: true,
  convert_urls: false,
  relative_urls: false,
  remove_script_host: false,
  images_upload_url: UploadApi.postLinkImages,
  branding: false,
  menubar: true,
};

const WORKFLOW_STEPS = [
  "Tạo yêu cầu",
  "Tiếp nhận và dự kiến hoàn thành",
  "Xác nhận hoặc từ chối",
  "Triển khai và hoàn thành",
];

const hasAction = (cr: ChangeRequest, action: ChangeRequestAction) =>
  cr.allowedActions?.includes(action) ?? false;

const getWorkflowStep = (status: number) => {
  if (status === 4) return 4;
  if (status === 5) return 2;
  return Math.min(status, 3);
};

type ApiError = { message?: string; title?: string; status?: number };
const asApiError = (error: unknown): ApiError =>
  typeof error === "object" && error !== null ? error as ApiError : { message: String(error) };

const formatDateTime = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—");
const formatDate = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY") : "—");
const formatPerson = (name?: string, code?: string) =>
  name ? `${name}${code ? ` (${code})` : ""}` : code ?? "—";

const EMPLOYEE_SEARCH_DEBOUNCE_MS = 400;
const EMPLOYEE_PAGE_SIZE = 150;

type EmployeeOption = Pick<NhanVien, "maNv" | "hoTen" | "tenPhongBan">;

export default function ChangeManagement() {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : {};
  const actorCode = user.maNV;
  const actorName = user.hoTen;
  const [items, setItems] = useState<ChangeRequest[]>([]);
  const [projects, setProjects] = useState<SlcProject[]>([]);
  const [modules, setModules] = useState<SlcModule[]>([]);
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  // Nhân viên đang được chọn trên form (giữ lại để hiển thị đúng dù không nằm trong danh sách đã tải/tìm kiếm)
  const [pinnedEmployee, setPinnedEmployee] = useState<EmployeeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<number>();
  const [priorityFilter, setPriorityFilter] = useState<number>();
  const [projectFilter, setProjectFilter] = useState<number>();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [accepting, setAccepting] = useState<ChangeRequest | null>(null);
  const [rejecting, setRejecting] = useState<ChangeRequest | null>(null);
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [editing, setEditing] = useState<ChangeRequest | null>(null);
  const [commandLoading, setCommandLoading] = useState(false);

  const [form] = Form.useForm();
  const [revisionForm] = Form.useForm();
  const [acceptForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const beforeChangeEditorRef = useRef<TinyMceEditor | null>(null);
  const changeEditorRef = useRef<TinyMceEditor | null>(null);

  const clearFormEditorRefs = () => {
    beforeChangeEditorRef.current = null;
    changeEditorRef.current = null;
  };

  const loadProjects = useCallback(async () => {
    try {
      const result = await projectApi.getAll({ pageSize: 100 });
      setProjects(result.items);
    } catch (error: unknown) {
      message.error(`Không tải được danh sách dự án: ${asApiError(error).message ?? "Lỗi không xác định"}`);
    }
  }, []);

  const loadModules = useCallback(async (projectId?: number) => {
    try {
      const result = await moduleApi.getAll({ projectId, pageSize: 200 });
      setModules(result.items);
    } catch {
      setModules([]);
    }
  }, []);

  const employeeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchEmployees = useCallback(async (keyword?: string) => {
    setEmployeeLoading(true);
    try {
      const result = await nhanVienApi.search({ keyword, pageSize: EMPLOYEE_PAGE_SIZE });
      setEmployees(result.items);
    } catch (error: unknown) {
      message.error(`Không tải được danh sách nhân viên: ${asApiError(error).message ?? "Lỗi không xác định"}`);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const handleEmployeeSearch = useCallback((keyword: string) => {
    if (employeeSearchTimeoutRef.current) clearTimeout(employeeSearchTimeoutRef.current);
    employeeSearchTimeoutRef.current = setTimeout(() => {
      searchEmployees(keyword.trim() || undefined);
    }, EMPLOYEE_SEARCH_DEBOUNCE_MS);
  }, [searchEmployees]);

  useEffect(() => () => {
    if (employeeSearchTimeoutRef.current) clearTimeout(employeeSearchTimeoutRef.current);
  }, []);

  // Luôn giữ nhân viên đang chọn trong danh sách option, kể cả khi không nằm trong 150 bản ghi vừa tải/tìm kiếm
  const employeeOptions = useMemo(() => {
    const merged = new Map<string, EmployeeOption>();
    employees.forEach((employee) => {
      if (employee.maNv) merged.set(employee.maNv, employee);
    });
    if (pinnedEmployee?.maNv && !merged.has(pinnedEmployee.maNv)) {
      merged.set(pinnedEmployee.maNv, pinnedEmployee);
    }
    return Array.from(merged.values());
  }, [employees, pinnedEmployee]);

  const load = useCallback(async () => {
    if (!actorCode) return;
    setLoading(true);
    try {
      const result = await changeRequestApi.getAll({
        actorCode,
        projectId: projectFilter,
        status: statusFilter,
        priority: priorityFilter,
        keyword: keyword || undefined,
        page,
        pageSize: 15,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (error: unknown) {
      message.error(asApiError(error).message ?? "Không tải được danh sách Change Request");
    } finally {
      setLoading(false);
    }
  }, [actorCode, keyword, page, priorityFilter, projectFilter, statusFilter]);

  const reloadDetail = useCallback(async (id: number) => {
    const detail = await changeRequestApi.getById(id, actorCode);
    setSelected(detail);
    return detail;
  }, [actorCode]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    searchEmployees();
  }, [searchEmployees]);

  useEffect(() => { load(); }, [load]);

  const handleRequestorChange = (employeeCode?: string) => {
    const employee = employeeOptions.find((item) => item.maNv === employeeCode);
    setPinnedEmployee(employee ?? null);
    form.setFieldsValue({
      requestorCode: employee?.maNv,
      requestorName: employee?.hoTen,
      requestorDept: employee?.tenPhongBan,
    });
  };

  const refreshAfterCommand = async (id: number) => {
    await load();
    if (showDetailDrawer && selected?.id === id) await reloadDetail(id);
  };

  const runCommand = async (
    cr: ChangeRequest,
    request: () => Promise<unknown>,
    successMessage: string,
  ): Promise<boolean> => {
    setCommandLoading(true);
    try {
      await request();
      message.success(successMessage);
      await refreshAfterCommand(cr.id);
      return true;
    } catch (error: unknown) {
      const apiError = asApiError(error);
      if (apiError.status === 409) {
        message.warning("Change Request đã được người khác xử lý. Dữ liệu sẽ được tải lại.");
      } else if (apiError.status === 403) {
        message.error("Bạn không có quyền thực hiện thao tác này.");
      } else {
        message.error(apiError.message ?? apiError.title ?? "Không thể thực hiện thao tác");
      }
      await refreshAfterCommand(cr.id).catch(() => undefined);
      return false;
    } finally {
      setCommandLoading(false);
    }
  };

  const handleSave = async (values: Partial<ChangeRequest>) => {
    setCommandLoading(true);
    try {
      await Promise.all([
        beforeChangeEditorRef.current?.uploadImages(),
        changeEditorRef.current?.uploadImages(),
      ]);
      const payload = {
        ...values,
        beforeChangeContent: beforeChangeEditorRef.current?.getContent({ format: "html" }) ?? values.beforeChangeContent,
        content: changeEditorRef.current?.getContent({ format: "html" }) ?? values.content,
        actorCode,
        actorName,
      };
      if (editing) {
        await changeRequestApi.update(editing.id, payload);
        message.success("Cập nhật Change Request thành công");
      } else {
        await changeRequestApi.create(payload);
        message.success("Đã gửi Change Request");
      }
      setShowFormModal(false);
      setEditing(null);
      form.resetFields();
      clearFormEditorRefs();
      await load();
    } catch (error: unknown) {
      const apiError = asApiError(error);
      if (editing && apiError.status === 409) {
        message.warning(apiError.message ?? "Change Request đã được tiếp nhận hoặc thay đổi. Dữ liệu sẽ được tải lại.");
        setShowFormModal(false);
        setEditing(null);
        form.resetFields();
        clearFormEditorRefs();
        await load();
      } else {
        message.error(apiError.message ?? "Không thể lưu Change Request");
      }
    } finally {
      setCommandLoading(false);
    }
  };

  const openEdit = async (cr: ChangeRequest) => {
    clearFormEditorRefs();
    try {
      const detail = await changeRequestApi.getById(cr.id, actorCode);
      setEditing(detail);
      form.setFieldsValue(detail);
      setPinnedEmployee(
        detail.requestorCode
          ? { maNv: detail.requestorCode, hoTen: detail.requestorName ?? detail.requestorCode, tenPhongBan: detail.requestorDept }
          : null
      );
      await loadModules(detail.projectId);
      setShowFormModal(true);
    } catch (error: unknown) {
      message.error(asApiError(error).message ?? "Không tải được dữ liệu Change Request để chỉnh sửa");
    }
  };

  const openDetail = async (cr: ChangeRequest) => {
    try {
      await reloadDetail(cr.id);
      setShowDetailDrawer(true);
    } catch (error: unknown) {
      message.error(asApiError(error).message ?? "Không tải được chi tiết Change Request");
    }
  };

  const confirmApprove = (cr: ChangeRequest) => {
    Modal.confirm({
      title: "Xác nhận yêu cầu?",
      okText: "Xác nhận yêu cầu",
      cancelText: "Hủy",
      onOk: () => runCommand(cr, () => changeRequestApi.approve(cr.id, { actorCode, actorName }), "Đã xác nhận Change Request"),
    });
  };

  const confirmComplete = (cr: ChangeRequest) => {
    Modal.confirm({
      title: "Xác nhận Change Request đã hoàn thành?",
      content: cr.impactTimeline
        ? "Thao tác này sẽ điều chỉnh timeline theo mức ảnh hưởng đã khai báo."
        : "Xác nhận Change Request đã được triển khai thực tế.",
      okText: "Xác nhận hoàn thành",
      cancelText: "Hủy",
      onOk: () => runCommand(cr, () => changeRequestApi.complete(cr.id, { actorCode, actorName }), "Đã hoàn thành Change Request"),
    });
  };

  const confirmDelete = (cr: ChangeRequest) => {
    Modal.confirm({
      title: "Xóa bản nháp Change Request?",
      content: "Dữ liệu đã xóa không thể khôi phục.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => runCommand(cr, () => changeRequestApi.delete(cr.id, { actorCode, actorName }), "Đã xóa Change Request"),
    });
  };

  const handleAccept = async (values: { expectedCompletionDate: dayjs.Dayjs }) => {
    if (!accepting) return;
    const cr = accepting;
    const succeeded = await runCommand(
      cr,
      () => changeRequestApi.accept(cr.id, {
        actorCode,
        actorName,
        expectedCompletionDate: values.expectedCompletionDate.format("YYYY-MM-DD"),
      }),
      "Đã tiếp nhận Change Request",
    );
    if (succeeded) {
      setAccepting(null);
      acceptForm.resetFields();
    }
  };

  const handleReject = async (values: { reason: string }) => {
    if (!rejecting) return;
    const cr = rejecting;
    const succeeded = await runCommand(
      cr,
      () => changeRequestApi.reject(cr.id, { actorCode, actorName, reason: values.reason.trim() }),
      "Đã từ chối Change Request",
    );
    if (succeeded) {
      setRejecting(null);
      rejectForm.resetFields();
    }
  };

  const handleAddRevision = async (values: Partial<ChangeRevision>) => {
    if (!selected) return;
    setCommandLoading(true);
    try {
      await changeRequestApi.addRevision(selected.id, { ...values, actorCode, actorName });
      message.success(`Đã thêm Rev${selected.currentRevision + 1}`);
      setShowRevisionModal(false);
      revisionForm.resetFields();
      await reloadDetail(selected.id);
      await load();
    } catch (error: unknown) {
      message.error(asApiError(error).message ?? "Không thể thêm Revision");
    } finally {
      setCommandLoading(false);
    }
  };

  const commandButton = (
    label: string,
    icon: ReactNode,
    onClick: () => void,
    compact: boolean,
    danger = false,
  ) => {
    const button = (
      <Button
        size={compact ? "small" : "middle"}
        type={danger ? "default" : "primary"}
        danger={danger}
        icon={icon}
        disabled={commandLoading}
        aria-label={label}
        onClick={onClick}
      >
        {!compact && label}
      </Button>
    );
    return compact ? <Tooltip title={label}>{button}</Tooltip> : button;
  };

  const actionButtons = (cr: ChangeRequest, compact = true) => (
    <Space size={compact ? 4 : 8} wrap>
      {hasAction(cr, "ACCEPT") && commandButton("Tiếp nhận yêu cầu", <UserAddOutlined />, () => setAccepting(cr), compact)}
      {hasAction(cr, "APPROVE") && commandButton("Xác nhận yêu cầu", <CheckCircleOutlined />, () => confirmApprove(cr), compact)}
      {hasAction(cr, "REJECT") && commandButton("Từ chối yêu cầu", <StopOutlined />, () => setRejecting(cr), compact, true)}
      {hasAction(cr, "COMPLETE") && commandButton("Xác nhận hoàn thành", <CheckCircleOutlined />, () => confirmComplete(cr), compact)}
    </Space>
  );

  const columns = [
    {
      title: "Mã / Tiêu đề", dataIndex: "title", key: "title",
      render: (_: unknown, record: ChangeRequest) => (
        <div>
          <div className="font-medium">{record.title}</div>
          <div className="text-xs text-gray-400">{record.code} · {record.projectName ?? record.moduleName}</div>
        </div>
      ),
    },
    {
      title: "Ưu tiên", dataIndex: "priority", key: "priority", width: 95,
      render: (value: number) => <Tag color={PRIORITY_COLORS[value]}>{PRIORITY_LABELS[value]}</Tag>,
    },
    {
      title: "Trạng thái", dataIndex: "status", key: "status", width: 145,
      render: (value: number) => <Tag color={CR_STATUS_COLORS[value]}>{CR_STATUS_LABELS[value]}</Tag>,
    },
    {
      title: "Người yêu cầu", dataIndex: "requestorName", key: "requestor", width: 135,
      render: (value?: string) => value ?? "—",
    },
    {
      title: "Người phụ trách", dataIndex: "developerName", key: "developer", width: 130,
      render: (value?: string) => value ?? "—",
    },
    {
      title: "Ngày dự kiến", dataIndex: "expectedCompletionDate", key: "expected", width: 110,
      render: (value?: string) => formatDate(value),
    },
    {
      title: "Rev", dataIndex: "currentRevision", key: "revision", width: 65,
      render: (value: number) => <Tag>Rev{value}</Tag>,
    },
    {
      title: "Thao tác", key: "actions", width: 230,
      render: (_: unknown, record: ChangeRequest) => (
        <Space size={4} wrap>
          <Tooltip title="Chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          {hasAction(record, "EDIT") && (
            <Tooltip title="Sửa"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} /></Tooltip>
          )}
          {actionButtons(record)}
          {hasAction(record, "DELETE") && (
            <Tooltip title="Xóa"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} /></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="m-0"><FileTextOutlined className="mr-2" />Change Management</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            clearFormEditorRefs();
            setEditing(null);
            setPinnedEmployee(null);
            form.resetFields();
            setShowFormModal(true);
          }}>
            Tạo Change Request
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load} />
        </Space>
      </div>

      <Card size="small" className="mb-3">
        <Row gutter={[8, 8]}>
          <Col><Search placeholder="Mã / Tiêu đề..." style={{ width: 220 }} allowClear onSearch={setKeyword} onChange={(event) => !event.target.value && setKeyword("")} /></Col>
          <Col>
            <Select placeholder="Dự án" style={{ width: 180 }} allowClear onChange={setProjectFilter}>
              {projects.map((project) => <Option key={project.id} value={project.id}>{project.name}</Option>)}
            </Select>
          </Col>
          <Col>
            <Select placeholder="Trạng thái" style={{ width: 165 }} allowClear onChange={setStatusFilter}>
              {Object.entries(CR_STATUS_LABELS).map(([key, value]) => <Option key={key} value={Number(key)}>{value}</Option>)}
            </Select>
          </Col>
          <Col>
            <Select placeholder="Ưu tiên" style={{ width: 125 }} allowClear onChange={setPriorityFilter}>
              {Object.entries(PRIORITY_LABELS).map(([key, value]) => <Option key={key} value={Number(key)}>{value}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1180 }}
        pagination={{ total, current: page, pageSize: 15, onChange: setPage, showTotal: (count) => `${count} Change Request` }}
      />

      <Modal
        title={editing ? "Sửa Change Request" : "Tạo Change Request mới"}
        open={showFormModal}
        confirmLoading={commandLoading}
        onCancel={() => { setShowFormModal(false); setEditing(null); form.resetFields(); clearFormEditorRefs(); }}
        footer={[
          <Button key="cancel" onClick={() => { setShowFormModal(false); setEditing(null); form.resetFields(); clearFormEditorRefs(); }}>
            Hủy
          </Button>,
          editing ? (
            <Button key="save" type="primary" loading={commandLoading} onClick={() => form.submit()}>
              Lưu
            </Button>
          ) : (
            <Button key="submit" type="primary" icon={<SendOutlined />} loading={commandLoading} onClick={() => form.submit()}>
              Gửi yêu cầu
            </Button>
          ),
        ]}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="projectId" label="Dự án">
                <Select allowClear onChange={(value) => { form.setFieldValue("moduleId", undefined); loadModules(value); }}>
                  {projects.map((project) => <Option key={project.id} value={project.id}>{project.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moduleId" label="Module">
                <Select allowClear>{modules.map((module) => <Option key={module.id} value={module.id}>{module.name}</Option>)}</Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="priority" label="Ưu tiên" initialValue={2} rules={[{ required: true }]}>
                <Select>{Object.entries(PRIORITY_LABELS).map(([key, value]) => <Option key={key} value={Number(key)}>{value}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="requestorCode" label="Mã người yêu cầu" rules={[{ required: true, message: "Vui lòng chọn người yêu cầu" }]}>
                <Select
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  loading={employeeLoading}
                  placeholder="Chọn nhân viên"
                  filterOption={false}
                  onSearch={handleEmployeeSearch}
                  onChange={handleRequestorChange}
                  notFoundContent={employeeLoading ? "Đang tải..." : "Không tìm thấy nhân viên"}
                  options={employeeOptions.map((employee) => ({
                    value: employee.maNv,
                    label: employee.maNv,
                    employee,
                  }))}
                  optionRender={(option) => {
                    const employee = (option.data as { employee: EmployeeOption }).employee;
                    const text = [employee.maNv, employee.hoTen, employee.tenPhongBan].filter(Boolean).join(" - ");
                    return (
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={text}>
                        {text}
                      </div>
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="requestorName" label="Tên người yêu cầu"><Input disabled /></Form.Item></Col>
            <Col span={12}><Form.Item name="requestorDept" label="Bộ phận"><Input disabled /></Form.Item></Col>
          </Row>
          <Form.Item
            name="beforeChangeContent"
            label="Nội dung trước thay đổi"
            valuePropName="value"
            trigger="onEditorChange"
            getValueFromEvent={(content: string) => content}
          >
            <Editor
              onInit={(_event, editor) => { beforeChangeEditorRef.current = editor; }}
              init={RICH_TEXT_EDITOR_OPTIONS}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung thay đổi"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
            valuePropName="value"
            trigger="onEditorChange"
            getValueFromEvent={(content: string) => content}
          >
            <Editor
              onInit={(_event, editor) => { changeEditorRef.current = editor; }}
              init={RICH_TEXT_EDITOR_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="reason" label="Lý do"><TextArea rows={2} /></Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="impactTimeline" label="Ảnh hưởng Timeline" valuePropName="checked" initialValue={false}><Checkbox>Có ảnh hưởng</Checkbox></Form.Item>
            </Col>
            <Col span={8}><Form.Item name="impactDays" label="Số ngày ảnh hưởng" initialValue={0}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="impactVersion" label="Phiên bản ảnh hưởng"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={<Space><span>{selected?.code}</span><Tag color={CR_STATUS_COLORS[selected?.status ?? 0]}>{CR_STATUS_LABELS[selected?.status ?? 0]}</Tag></Space>}
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={680}
        extra={selected && (
          <Space wrap>
            {hasAction(selected, "ADD_REVISION") && <Button onClick={() => setShowRevisionModal(true)}>+ Revision</Button>}
            {actionButtons(selected, false)}
          </Space>
        )}
      >
        {selected && (
          <>
            <Steps
              size="small"
              current={getWorkflowStep(selected.status)}
              status={selected.status === 5 ? "error" : selected.status === 4 ? "finish" : "process"}
              items={WORKFLOW_STEPS.map((title) => ({ title }))}
              className="mb-5"
            />
            {selected.status === 5 && (
              <Card size="small" className="mb-4" style={{ borderColor: "#ffccc7", background: "#fff2f0" }}>
                <div>
                  <Text type="danger" strong>Đã từ chối bởi: </Text>
                  {formatPerson(selected.approverName, selected.approverCode)}
                  <Text type="secondary"> lúc {formatDateTime(selected.rejectedAt)}</Text>
                </div>
                <div className="mt-1"><Text type="danger" strong>Lý do: </Text>{selected.rejectedReason ?? "Không có lý do"}</div>
              </Card>
            )}
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="Tiêu đề" span={2}>{selected.title}</Descriptions.Item>
              <Descriptions.Item label="Dự án">{selected.projectName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Module">{selected.moduleName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Ưu tiên"><Tag color={PRIORITY_COLORS[selected.priority]}>{PRIORITY_LABELS[selected.priority]}</Tag></Descriptions.Item>
              <Descriptions.Item label="Revision"><Tag>Rev{selected.currentRevision}</Tag></Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">{formatPerson(selected.requestorName, selected.requestorCode)}</Descriptions.Item>
              <Descriptions.Item label="Bộ phận">{selected.requestorDept ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{formatPerson(selected.createdByName, selected.createdByCode)}</Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">{formatDateTime(selected.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Người phụ trách">{formatPerson(selected.developerName, selected.developerCode)}</Descriptions.Item>
              <Descriptions.Item label="Tiếp nhận lúc">{formatDateTime(selected.developerAcceptedAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày hoàn thành dự kiến">{formatDate(selected.expectedCompletionDate)}</Descriptions.Item>
              <Descriptions.Item label={selected.status === 5 ? "Người từ chối" : "Người xác nhận"}>
                {formatPerson(selected.approverName, selected.approverCode)}
              </Descriptions.Item>
              <Descriptions.Item label="Người hoàn thành">{formatPerson(selected.completedByName, selected.completedByCode)}</Descriptions.Item>
              <Descriptions.Item label="Hoàn thành lúc">{formatDateTime(selected.completedAt)}</Descriptions.Item>
              <Descriptions.Item label="Ảnh hưởng Timeline" span={2}>
                {selected.impactTimeline ? <Tag color="red">{selected.impactDays > 0 ? "+" : ""}{selected.impactDays} ngày · {selected.impactVersion ?? "—"}</Tag> : <Tag>Không ảnh hưởng</Tag>}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">Nội dung trước thay đổi</Divider>
            <RichHtmlPreview html={selected.beforeChangeContent} title="Nội dung trước thay đổi" />
            <Divider orientation="left">Nội dung thay đổi</Divider>
            <RichHtmlPreview html={selected.content} title="Nội dung thay đổi" />
            <Divider orientation="left">Lý do</Divider>
            <div className="bg-gray-50 p-3 rounded text-sm mb-4 whitespace-pre-wrap">{selected.reason ?? "—"}</div>
            <Divider orientation="left">Lịch sử Revision</Divider>
            {selected.revisions?.length ? (
              <Timeline items={selected.revisions.map((revision) => ({
                color: revision.status === 1 ? "green" : revision.status === 2 ? "red" : "blue",
                children: (
                  <div key={revision.id} className="text-sm">
                    <Space wrap><Tag>Rev{revision.revisionNumber}</Tag><Tag>{revision.status === 0 ? "Chờ duyệt" : revision.status === 1 ? "Đã duyệt" : "Từ chối"}</Tag><Text type="secondary">{formatDateTime(revision.createdAt)}</Text></Space>
                    {revision.content && <div className="mt-1 text-gray-600">{revision.content}</div>}
                    {revision.reason && <div className="mt-1 text-gray-400 text-xs">Lý do: {revision.reason}</div>}
                    {revision.impactTimeline && <Tag color="orange" className="mt-1">{revision.impactDays > 0 ? "+" : ""}{revision.impactDays} ngày</Tag>}
                  </div>
                ),
              }))} />
            ) : <Text type="secondary">Chưa có Revision.</Text>}
          </>
        )}
      </Drawer>

      <Modal title="Tiếp nhận yêu cầu" open={Boolean(accepting)} onOk={() => acceptForm.submit()} okText="Tiếp nhận yêu cầu" confirmLoading={commandLoading} onCancel={() => { setAccepting(null); acceptForm.resetFields(); }} destroyOnClose>
        <Form form={acceptForm} layout="vertical" onFinish={handleAccept}>
          <Text>Bạn sẽ trở thành người phụ trách Change Request này.</Text>
          <Form.Item name="expectedCompletionDate" label="Ngày hoàn thành dự kiến" className="mt-4" rules={[{ required: true, message: "Vui lòng chọn ngày hoàn thành dự kiến" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabledDate={(date) => date.startOf("day").isBefore(dayjs().startOf("day"))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Từ chối yêu cầu" open={Boolean(rejecting)} onOk={() => rejectForm.submit()} okText="Từ chối yêu cầu" okButtonProps={{ danger: true }} confirmLoading={commandLoading} onCancel={() => { setRejecting(null); rejectForm.resetFields(); }} destroyOnClose>
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập lý do từ chối" }]}><TextArea rows={4} maxLength={500} showCount /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`Thêm Revision (Rev${(selected?.currentRevision ?? 0) + 1})`} open={showRevisionModal} onOk={() => revisionForm.submit()} confirmLoading={commandLoading} onCancel={() => { setShowRevisionModal(false); revisionForm.resetFields(); }} destroyOnClose>
        <Form form={revisionForm} layout="vertical" onFinish={handleAddRevision}>
          <Form.Item name="content" label="Nội dung thay đổi" rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}><TextArea rows={4} /></Form.Item>
          <Form.Item name="reason" label="Lý do thay đổi"><TextArea rows={2} /></Form.Item>
          <Form.Item name="impactAssessment" label="Đánh giá ảnh hưởng"><TextArea rows={2} /></Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="impactTimeline" label=" " valuePropName="checked" initialValue={false}><Checkbox>Ảnh hưởng Timeline</Checkbox></Form.Item></Col>
            <Col span={8}><Form.Item name="impactDays" label="Số ngày" initialValue={0}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="impactVersion" label="Phiên bản"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="requestorCode" label="Mã người yêu cầu"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="requestorName" label="Tên người yêu cầu"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
