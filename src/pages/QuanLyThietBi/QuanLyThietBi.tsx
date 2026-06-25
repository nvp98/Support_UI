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
  Form,
  message,
  DatePicker,
  Popconfirm,
  Modal,
  Tooltip,
  Tabs,
  Typography,
  Divider,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditTwoTone,
  DeleteTwoTone,
  EyeTwoTone,
  ReloadOutlined,
  ToolOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  quanLyThietBiApi,
  thietBiApi,
  loiSuCoApi,
  phongBanApi,
  nhanVienApi,
} from "../../services/EPortalApi";
import type {
  NvQuanLyThietBi,
  NvThietBi,
  NvLoiSuCoTb,
  PhongBan,
} from "../../models/eportal";

const { Option } = Select;
const { Title } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  "0": { label: "Chờ xử lý", color: "orange" },
  "1": { label: "Đang xử lý", color: "blue" },
  "2": { label: "Đã xử lý", color: "green" },
  "3": { label: "Đã giao máy", color: "cyan" },
};

// ─── Tab Quản lý thiết bị ──────────────────────────────────────────────────
function QuanLyThietBiTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NvQuanLyThietBi[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<any>({});

  const [phongBans, setPhongBans] = useState<PhongBan[]>([]);
  const [thietBis, setThietBis] = useState<NvThietBi[]>([]);
  const [loiSuCos, setLoiSuCos] = useState<NvLoiSuCoTb[]>([]);
  const [nhanViens, setNhanViens] = useState<any[]>([]);

  // filter state
  const [fPhongBan, setFPhongBan] = useState<number | undefined>();
  const [fThietBi, setFThietBi] = useState<number | undefined>();
  const [fLoiSuCo, setFLoiSuCo] = useState<number | undefined>();
  const [fStatus, setFStatus] = useState<string | undefined>();
  const [fMaNv, setFMaNv] = useState("");
  const [fServiceTag, setFServiceTag] = useState("");
  const [fDateRange, setFDateRange] = useState<any>(null);

  // modals
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    record?: NvQuanLyThietBi;
  }>({ open: false });
  const [formModal, setFormModal] = useState<{
    open: boolean;
    record?: NvQuanLyThietBi;
  }>({ open: false });
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    record?: NvQuanLyThietBi;
  }>({ open: false });

  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [formPhongBan, setFormPhongBan] = useState<number | undefined>();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    Promise.all([
      phongBanApi.getAll(1),
      thietBiApi.getAll(),
      loiSuCoApi.getAll(),
      nhanVienApi.getAll(),
    ]).then(([pb, tb, lsc, nv]) => {
      setPhongBans(pb);
      setThietBis(tb);
      setLoiSuCos(lsc);
      setNhanViens(nv);
    });
    fetchData(1, 20, {});
  }, []);

  const fetchData = async (page = 1, pageSize = 20, f: any = {}) => {
    setLoading(true);
    try {
      const res = await quanLyThietBiApi.getList(page, pageSize, f);
      setData(res.items);
      setPagination({ current: page, pageSize, total: res.total });
      setFilters(f);
    } catch {
      message.error("Không thể tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const buildFilter = () => ({
    ...(fPhongBan !== undefined && { idPhongBan: fPhongBan }),
    ...(fThietBi !== undefined && { idTb: fThietBi }),
    ...(fLoiSuCo !== undefined && { idSc: fLoiSuCo }),
    ...(fStatus && { status: fStatus }),
    ...(fMaNv && { maNv: fMaNv }),
    ...(fServiceTag && { serviceTag: fServiceTag }),
    ...(fDateRange?.[0] && { fromDate: fDateRange[0].format("YYYY-MM-DD") }),
    ...(fDateRange?.[1] && { toDate: fDateRange[1].format("YYYY-MM-DD") }),
  });

  const handleFilter = () => fetchData(1, pagination.pageSize, buildFilter());

  const handleClearFilter = () => {
    setFPhongBan(undefined);
    setFThietBi(undefined);
    setFLoiSuCo(undefined);
    setFStatus(undefined);
    setFMaNv("");
    setFServiceTag("");
    setFDateRange(null);
    fetchData(1, pagination.pageSize, {});
  };

  const openCreate = () => {
    form.resetFields();
    form.setFieldValue("ngayLap", dayjs());
    setFormPhongBan(undefined);
    setFormModal({ open: true });
  };

  const openEdit = (record: NvQuanLyThietBi) => {
    form.setFieldsValue({
      ...record,
      ngayLap: record.ngayLap ? dayjs(record.ngayLap) : null,
    });
    setFormPhongBan(record.idPhongBan);
    setFormModal({ open: true, record });
  };

  const openStatusModal = (record: NvQuanLyThietBi) => {
    statusForm.setFieldsValue({
      status: record.status,
      ghiChu: record.ghiChu,
    });
    setStatusModal({ open: true, record });
  };

  const handleFormSubmit = async (values: any) => {
    const payload: Partial<NvQuanLyThietBi> = {
      ...values,
      ngayLap: values.ngayLap ? values.ngayLap.format("YYYY-MM-DD") : null,
    };
    try {
      if (formModal.record) {
        await quanLyThietBiApi.update(formModal.record.idQltb, payload);
        message.success("Cập nhật thành công!");
      } else {
        await quanLyThietBiApi.create(payload);
        message.success("Thêm mới thành công!");
      }
      setFormModal({ open: false });
      fetchData(pagination.current, pagination.pageSize, filters);
    } catch {
      message.error("Thao tác thất bại!");
    }
  };

  const handleStatusSubmit = async (values: any) => {
    const record = statusModal.record!;
    const today = dayjs().format("YYYY-MM-DD");
    try {
      await quanLyThietBiApi.updateStatus(record.idQltb, {
        status: values.status,
        ghiChu: values.ghiChu,
        adminNm: userObj?.maNV,
        ...(values.status === "1" && { ngayXl: today }),
        ...(values.status === "2" && { ngayHt: today }),
        ...(values.status === "3" && { ngayNm: today }),
      });
      message.success("Cập nhật trạng thái thành công!");
      setStatusModal({ open: false });
      fetchData(pagination.current, pagination.pageSize, filters);
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await quanLyThietBiApi.delete(id);
      message.success("Đã xóa!");
      fetchData(pagination.current, pagination.pageSize, filters);
    } catch {
      message.error("Xóa thất bại!");
    }
  };

  const columns = [
    {
      title: "Thao tác",
      key: "action",
      fixed: "left" as const,
      width: 120,
      render: (_: any, record: NvQuanLyThietBi) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeTwoTone twoToneColor="#1890ff" />}
              onClick={() => setViewModal({ open: true, record })}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditTwoTone twoToneColor="#faad14" />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái">
            <Button
              type="text"
              size="small"
              icon={<ToolOutlined style={{ color: "#52c41a" }} />}
              onClick={() => openStatusModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bản ghi này?"
            onConfirm={() => handleDelete(record.idQltb)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: "ServiceTag",
      dataIndex: "serviceTag",
      key: "serviceTag",
      width: 130,
      render: (v: string) => <b style={{ color: "#1976d2" }}>{v || "-"}</b>,
    },
    {
      title: "Thiết bị",
      dataIndex: "tenThietBi",
      key: "tenThietBi",
      width: 130,
      ellipsis: true,
    },
    {
      title: "Phòng ban",
      dataIndex: "tenPhongBan",
      key: "tenPhongBan",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Nhân viên",
      key: "nhanVien",
      width: 160,
      render: (_: any, r: NvQuanLyThietBi) => (
        <span>
          {r.maNv ? (
            <Tooltip title={r.hoTenNv || r.maNv}>
              <span>{r.hoTenNv || r.maNv}</span>
            </Tooltip>
          ) : (
            <span style={{ color: "#aaa" }}>-</span>
          )}
        </span>
      ),
    },
    {
      title: "Lỗi sự cố",
      dataIndex: "tenLoiSc",
      key: "tenLoiSc",
      width: 150,
      ellipsis: true,
      render: (v: string) => v || <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "Ngày lập",
      dataIndex: "ngayLap",
      key: "ngayLap",
      width: 110,
      render: (v: string) =>
        v ? (
          dayjs(v).format("DD/MM/YYYY")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
    {
      title: "Ngày nhận máy",
      dataIndex: "ngayNm",
      key: "ngayNm",
      width: 110,
      render: (v: string) =>
        v ? (
          dayjs(v).format("DD/MM/YYYY")
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: string) => {
        const cfg = STATUS_MAP[v];
        return cfg ? (
          <Tag color={cfg.color}>{cfg.label}</Tag>
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      key: "ghiChu",
      width: 70,
      ellipsis: true,
      render: (v: string) => v || <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "Admin xử lý",
      key: "admin",
      width: 140,
      render: (_: any, r: NvQuanLyThietBi) =>
        r.adminNm ? (
          <Tooltip title={r.hoTenAdmin || r.adminNm}>
            <span>{r.hoTenAdmin || r.adminNm}</span>
          </Tooltip>
        ) : (
          <span style={{ color: "#aaa" }}>-</span>
        ),
    },
  ];

  return (
    <>
      {/* Filter bar */}
      <Card style={{ marginBottom: 12 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Phòng ban"
              style={{ width: "100%" }}
              value={fPhongBan}
              onChange={setFPhongBan}
              showSearch
              optionFilterProp="children"
            >
              {phongBans.map((p) => (
                <Option key={p.idPhongBan} value={p.idPhongBan}>
                  {p.tenPhongBan}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Loại thiết bị"
              style={{ width: "100%" }}
              value={fThietBi}
              onChange={setFThietBi}
              showSearch
              optionFilterProp="children"
            >
              {thietBis.map((t) => (
                <Option key={t.idTb} value={t.idTb}>
                  {t.tenThietBi}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              allowClear
              placeholder="Lỗi sự cố"
              style={{ width: "100%" }}
              value={fLoiSuCo}
              onChange={setFLoiSuCo}
              showSearch
              optionFilterProp="children"
            >
              {loiSuCos.map((l) => (
                <Option key={l.idSc} value={l.idSc}>
                  {l.tenLoiSc}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select
              allowClear
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              value={fStatus}
              onChange={setFStatus}
            >
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Input
              placeholder="Mã NV..."
              value={fMaNv}
              onChange={(e) => setFMaNv(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Input
              placeholder="ServiceTag..."
              value={fServiceTag}
              onChange={(e) => setFServiceTag(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              value={fDateRange}
              onChange={setFDateRange}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleClearFilter}>
                Xóa lọc
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
              >
                Thêm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="idQltb"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: "max-content", y: 520 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `Tổng: ${t} bản ghi`,
            onChange: (page, pageSize) => fetchData(page, pageSize, filters),
          }}
        />
      </Card>

      {/* Modal Xem chi tiết */}
      <Modal
        open={viewModal.open}
        title="Chi tiết thiết bị"
        onCancel={() => setViewModal({ open: false })}
        footer={[
          <Button key="close" onClick={() => setViewModal({ open: false })}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {viewModal.record && (
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <b>ServiceTag:</b> {viewModal.record.serviceTag || "-"}
            </Col>
            <Col span={12}>
              <b>Thiết bị:</b> {viewModal.record.tenThietBi || "-"}
            </Col>
            <Col span={12}>
              <b>Phòng ban:</b> {viewModal.record.tenPhongBan || "-"}
            </Col>
            <Col span={12}>
              <b>Trạng thái:</b>{" "}
              <Tag color={STATUS_MAP[viewModal.record.status || ""]?.color}>
                {STATUS_MAP[viewModal.record.status || ""]?.label || "-"}
              </Tag>
            </Col>
            <Col span={12}>
              <b>Nhân viên:</b>{" "}
              {viewModal.record.hoTenNv
                ? `${viewModal.record.maNv} - ${viewModal.record.hoTenNv}`
                : viewModal.record.maNv || "-"}
            </Col>
            <Col span={12}>
              <b>SĐT:</b> {viewModal.record.phone || "-"}
            </Col>
            <Col span={12}>
              <b>Lỗi sự cố:</b> {viewModal.record.tenLoiSc || "-"}
            </Col>
            <Col span={12}>
              <b>Ngày lập:</b>{" "}
              {viewModal.record.ngayLap
                ? dayjs(viewModal.record.ngayLap).format("DD/MM/YYYY")
                : "-"}
            </Col>
            <Col span={12}>
              <b>Ngày xử lý:</b>{" "}
              {viewModal.record.ngayXl
                ? dayjs(viewModal.record.ngayXl).format("DD/MM/YYYY")
                : "-"}
            </Col>
            <Col span={12}>
              <b>Ngày hoàn tất:</b>{" "}
              {viewModal.record.ngayHt
                ? dayjs(viewModal.record.ngayHt).format("DD/MM/YYYY")
                : "-"}
            </Col>
            <Col span={12}>
              <b>Ngày nhập máy:</b>{" "}
              {viewModal.record.ngayNm
                ? dayjs(viewModal.record.ngayNm).format("DD/MM/YYYY")
                : "-"}
            </Col>
            <Col span={12}>
              <b>Admin xử lý:</b>{" "}
              {viewModal.record.hoTenAdmin
                ? `${viewModal.record.adminNm} - ${viewModal.record.hoTenAdmin}`
                : viewModal.record.adminNm || "-"}
            </Col>
            <Col span={24}>
              <b>Ghi chú:</b> {viewModal.record.ghiChu || "-"}
            </Col>
          </Row>
        )}
      </Modal>

      {/* Modal Thêm / Sửa */}
      <Modal
        open={formModal.open}
        title={formModal.record ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
        onCancel={() => setFormModal({ open: false })}
        onOk={() => form.submit()}
        okText={formModal.record ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phòng ban" name="idPhongBan">
                <Select
                  placeholder="Chọn phòng ban"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  onChange={(val: number | undefined) => {
                    setFormPhongBan(val);
                    form.setFieldValue("maNv", undefined);
                  }}
                >
                  {phongBans.map((p) => (
                    <Option key={p.idPhongBan} value={p.idPhongBan}>
                      {p.tenPhongBan}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Nhân viên" name="maNv">
                <Select
                  placeholder={
                    formPhongBan ? "Chọn nhân viên" : "Chọn phòng ban trước"
                  }
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  disabled={!formPhongBan}
                  options={nhanViens
                    .filter((n) =>
                      formPhongBan ? n.idPhongBan === formPhongBan : true,
                    )
                    .map((n) => ({
                      value: n.maNv,
                      label: `${n.maNv} - ${n.hoTen}`,
                    }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ServiceTag" name="serviceTag">
                <Input placeholder="Nhập service tag" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại thiết bị" name="idTb">
                <Select
                  placeholder="Chọn thiết bị"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {thietBis.map((t) => (
                    <Option key={t.idTb} value={t.idTb}>
                      {t.tenThietBi}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Số điện thoại" name="phone">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lỗi sự cố" name="idSc">
                <Select
                  placeholder="Chọn lỗi sự cố"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {loiSuCos.map((l) => (
                    <Option key={l.idSc} value={l.idSc}>
                      {l.tenLoiSc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày lập" name="ngayLap">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái" name="status">
                <Select placeholder="Chọn trạng thái" allowClear>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <Option key={k} value={k}>
                      {v.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="ghiChu">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Cập nhật trạng thái */}
      <Modal
        open={statusModal.open}
        title="Cập nhật trạng thái"
        onCancel={() => setStatusModal({ open: false })}
        onOk={() => statusForm.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item
            label="Trạng thái mới"
            name="status"
            rules={[{ required: true, message: "Chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Ghi chú" name="ghiChu">
            <Input.TextArea rows={3} placeholder="Ghi chú xử lý" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Tab Danh mục (ThietBi + LoiSuCo) ─────────────────────────────────────
function DanhMucTab() {
  const [thietBis, setThietBis] = useState<NvThietBi[]>([]);
  const [loiSuCos, setLoiSuCos] = useState<NvLoiSuCoTb[]>([]);
  const [tbLoading, setTbLoading] = useState(false);
  const [lscLoading, setLscLoading] = useState(false);

  const [tbModal, setTbModal] = useState<{
    open: boolean;
    record?: NvThietBi;
  }>({ open: false });
  const [lscModal, setLscModal] = useState<{
    open: boolean;
    record?: NvLoiSuCoTb;
  }>({ open: false });

  const [tbForm] = Form.useForm();
  const [lscForm] = Form.useForm();

  const loadThietBi = async () => {
    setTbLoading(true);
    try {
      setThietBis(await thietBiApi.getAll());
    } finally {
      setTbLoading(false);
    }
  };

  const loadLoiSuCo = async () => {
    setLscLoading(true);
    try {
      setLoiSuCos(await loiSuCoApi.getAll());
    } finally {
      setLscLoading(false);
    }
  };

  useEffect(() => {
    loadThietBi();
    loadLoiSuCo();
  }, []);

  const handleTbSubmit = async (values: any) => {
    try {
      if (tbModal.record) {
        await thietBiApi.update(tbModal.record.idTb, values);
        message.success("Cập nhật thiết bị thành công!");
      } else {
        await thietBiApi.create(values);
        message.success("Thêm thiết bị thành công!");
      }
      setTbModal({ open: false });
      loadThietBi();
    } catch {
      message.error("Thao tác thất bại!");
    }
  };

  const handleTbDelete = async (id: number) => {
    try {
      await thietBiApi.delete(id);
      message.success("Đã xóa!");
      loadThietBi();
    } catch {
      message.error("Xóa thất bại!");
    }
  };

  const handleLscSubmit = async (values: any) => {
    try {
      if (lscModal.record) {
        await loiSuCoApi.update(lscModal.record.idSc, values);
        message.success("Cập nhật lỗi sự cố thành công!");
      } else {
        await loiSuCoApi.create(values);
        message.success("Thêm lỗi sự cố thành công!");
      }
      setLscModal({ open: false });
      loadLoiSuCo();
    } catch {
      message.error("Thao tác thất bại!");
    }
  };

  const handleLscDelete = async (id: number) => {
    try {
      await loiSuCoApi.delete(id);
      message.success("Đã xóa!");
      loadLoiSuCo();
    } catch {
      message.error("Xóa thất bại!");
    }
  };

  const tbColumns = [
    { title: "ID", dataIndex: "idTb", key: "idTb", width: 60 },
    { title: "Tên thiết bị", dataIndex: "tenThietBi", key: "tenThietBi" },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_: any, record: NvThietBi) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditTwoTone twoToneColor="#faad14" />}
            onClick={() => {
              tbForm.setFieldsValue(record);
              setTbModal({ open: true, record });
            }}
          />
          <Popconfirm
            title="Xóa thiết bị này?"
            onConfirm={() => handleTbDelete(record.idTb)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const lscColumns = [
    { title: "ID", dataIndex: "idSc", key: "idSc", width: 60 },
    { title: "Tên lỗi sự cố", dataIndex: "tenLoiSc", key: "tenLoiSc" },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_: any, record: NvLoiSuCoTb) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditTwoTone twoToneColor="#faad14" />}
            onClick={() => {
              lscForm.setFieldsValue(record);
              setLscModal({ open: true, record });
            }}
          />
          <Popconfirm
            title="Xóa lỗi sự cố này?"
            onConfirm={() => handleLscDelete(record.idSc)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Row gutter={24}>
      {/* Danh mục Thiết bị */}
      <Col xs={24} md={12}>
        <Card
          title="Danh mục thiết bị"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                tbForm.resetFields();
                setTbModal({ open: true });
              }}
            >
              Thêm
            </Button>
          }
        >
          <Table
            rowKey="idTb"
            size="small"
            columns={tbColumns}
            dataSource={thietBis}
            loading={tbLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Col>

      {/* Danh mục Lỗi sự cố */}
      <Col xs={24} md={12}>
        <Card
          title="Danh mục lỗi sự cố"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                lscForm.resetFields();
                setLscModal({ open: true });
              }}
            >
              Thêm
            </Button>
          }
        >
          <Table
            rowKey="idSc"
            size="small"
            columns={lscColumns}
            dataSource={loiSuCos}
            loading={lscLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Col>

      {/* Modal Thiết bị */}
      <Modal
        open={tbModal.open}
        title={tbModal.record ? "Sửa thiết bị" : "Thêm thiết bị"}
        onCancel={() => setTbModal({ open: false })}
        onOk={() => tbForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={tbForm} layout="vertical" onFinish={handleTbSubmit}>
          <Form.Item
            label="Tên thiết bị"
            name="tenThietBi"
            rules={[{ required: true, message: "Nhập tên thiết bị" }]}
          >
            <Input placeholder="Nhập tên thiết bị" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Lỗi sự cố */}
      <Modal
        open={lscModal.open}
        title={lscModal.record ? "Sửa lỗi sự cố" : "Thêm lỗi sự cố"}
        onCancel={() => setLscModal({ open: false })}
        onOk={() => lscForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={lscForm} layout="vertical" onFinish={handleLscSubmit}>
          <Form.Item
            label="Tên lỗi sự cố"
            name="tenLoiSc"
            rules={[{ required: true, message: "Nhập tên lỗi sự cố" }]}
          >
            <Input placeholder="Nhập tên lỗi sự cố" />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
const QuanLyThietBi = () => {
  const tabItems = [
    {
      key: "qlthietbi",
      label: (
        <span>
          <ToolOutlined /> Quản lý thiết bị
        </span>
      ),
      children: <QuanLyThietBiTab />,
    },
    {
      key: "danhmuc",
      label: (
        <span>
          <UnorderedListOutlined /> Danh mục
        </span>
      ),
      children: <DanhMucTab />,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Sự cố thiết bị
      </Title>
      <Divider style={{ margin: "0 0 16px" }} />
      <Tabs defaultActiveKey="qlthietbi" items={tabItems} />
    </div>
  );
};

export default QuanLyThietBi;
