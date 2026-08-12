import { useEffect, useState, useCallback } from "react";
import {
  Card, Table, Tag, Button, Space, Select, Input, Modal, Form,
  InputNumber, Typography, Row, Col, Drawer, Descriptions,
  Timeline, Badge, Divider, message, Steps, Tooltip, Checkbox
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ReloadOutlined, ArrowRightOutlined, FileTextOutlined
} from "@ant-design/icons";
import type { ChangeRequest, ChangeRevision, SlcProject, SlcModule } from "../../../models/slc";
import {
  CR_STATUS_LABELS, CR_STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
} from "../../../models/slc";
import { changeRequestApi, projectApi, moduleApi } from "../../../services/slcApi";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const CR_WORKFLOW_STEPS = [
  "Bản nháp", "Chờ duyệt", "Đã duyệt", "Phân tích",
  "Ước lượng", "Phát triển", "Kiểm thử", "Xác nhận", "Triển khai", "Hoàn thành"
];

export default function ChangeManagement() {
  const [items, setItems] = useState<ChangeRequest[]>([]);
  const [projects, setProjects] = useState<SlcProject[]>([]);
  const [modules, setModules] = useState<SlcModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<number | undefined>();
  const [projectFilter, setProjectFilter] = useState<number | undefined>();

  const [showModal, setShowModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [editing, setEditing] = useState<ChangeRequest | null>(null);
  const [form] = Form.useForm();
  const [revisionForm] = Form.useForm();

  const loadProjects = useCallback(async () => {
    try {
      const res = await projectApi.getAll({ pageSize: 100 });
      setProjects(res.items);
    } catch (e: any) {
      message.error("Không tải được danh sách dự án: " + (e?.message ?? e));
    }
  }, []);

  const loadModules = useCallback(async (pid?: number) => {
    try {
      const res = await moduleApi.getAll({ projectId: pid, pageSize: 200 });
      setModules(res.items);
    } catch {
      // ignore — optional
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await changeRequestApi.getAll({
        projectId: projectFilter,
        status: statusFilter,
        priority: priorityFilter,
        keyword: keyword || undefined,
        page,
        pageSize: 15,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      message.error("Không tải được Change Request: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [projectFilter, statusFilter, priorityFilter, keyword, page]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await changeRequestApi.update(editing.id, values);
        message.success("Cập nhật thành công");
      } else {
        await changeRequestApi.create(values);
        message.success("Tạo Change Request thành công");
      }
      setShowModal(false);
      form.resetFields();
      setEditing(null);
      load();
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleAdvanceStatus = async (cr: ChangeRequest) => {
    if (cr.status >= 9) return;
    const nextStatus = (cr.status + 1) as number;
    await changeRequestApi.updateStatus(cr.id, { status: nextStatus });
    message.success(`Chuyển sang: ${CR_STATUS_LABELS[nextStatus]}`);
    load();
    if (selected?.id === cr.id) {
      const detail = await changeRequestApi.getById(cr.id);
      setSelected(detail);
    }
  };

  const handleAddRevision = async (values: any) => {
    if (!selected) return;
    await changeRequestApi.addRevision(selected.id, values);
    message.success(`Đã thêm Rev${(selected.currentRevision ?? 0) + 1}`);
    setShowRevisionModal(false);
    revisionForm.resetFields();
    const detail = await changeRequestApi.getById(selected.id);
    setSelected(detail);
    load();
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa Change Request?",
      onOk: async () => {
        await changeRequestApi.delete(id);
        message.success("Đã xóa");
        load();
      },
    });
  };

  const openDetail = async (cr: ChangeRequest) => {
    const res = await changeRequestApi.getById(cr.id);
    setSelected(res);
    setShowDetailDrawer(true);
  };

  const columns = [
    {
      title: "Mã / Tiêu đề", dataIndex: "title", key: "title",
      render: (_: any, r: ChangeRequest) => (
        <div>
          <div className="font-medium">{r.title}</div>
          <div className="text-xs text-gray-400">{r.code} · {r.projectName ?? r.moduleName}</div>
        </div>
      ),
    },
    {
      title: "Ưu tiên", dataIndex: "priority", key: "priority", width: 90,
      render: (v: number) => <Tag color={PRIORITY_COLORS[v]}>{PRIORITY_LABELS[v]}</Tag>,
    },
    {
      title: "Trạng thái", dataIndex: "status", key: "status", width: 130,
      render: (v: number) => <Tag color={CR_STATUS_COLORS[v]}>{CR_STATUS_LABELS[v]}</Tag>,
    },
    {
      title: "Người yêu cầu", dataIndex: "requestorName", key: "req", width: 130,
      render: (v: string) => v ?? "—",
    },
    {
      title: "Developer", dataIndex: "developerName", key: "dev", width: 120,
      render: (v: string) => v ?? "—",
    },
    {
      title: "Ảnh hưởng", key: "impact", width: 100,
      render: (_: any, r: ChangeRequest) => (
        r.impactTimeline
          ? <Tag color="red">+{r.impactDays} ngày</Tag>
          : <Tag color="default">Không</Tag>
      ),
    },
    {
      title: "Rev", dataIndex: "currentRevision", key: "rev", width: 65,
      render: (v: number) => <Tag>Rev{v}</Tag>,
    },
    {
      title: "Ngày tạo", dataIndex: "createdAt", key: "created", width: 100,
      render: (v: string) => v?.substring(0, 10),
    },
    {
      title: "", key: "actions", width: 120,
      render: (_: any, r: ChangeRequest) => (
        <Space>
          <Tooltip title="Chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          {r.status === 0 && (
            <Tooltip title="Sửa">
              <Button size="small" icon={<EditOutlined />} onClick={() => {
                setEditing(r);
                form.setFieldsValue(r);
                loadModules(r.projectId ?? undefined);
                setShowModal(true);
              }} />
            </Tooltip>
          )}
          {r.status < 9 && r.status !== 10 && (
            <Tooltip title={`→ ${CR_STATUS_LABELS[(r.status + 1) as number]}`}>
              <Button size="small" type="primary" icon={<ArrowRightOutlined />}
                onClick={() => handleAdvanceStatus(r)} />
            </Tooltip>
          )}
          <Tooltip title="Xóa">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="m-0">
          <FileTextOutlined className="mr-2" />
          Change Management
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setShowModal(true); }}>
            Tạo Change Request
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load} />
        </Space>
      </div>

      <Card size="small" className="mb-3">
        <Row gutter={8}>
          <Col>
            <Search placeholder="Mã / Tiêu đề..." style={{ width: 220 }}
              onSearch={setKeyword} onChange={(e) => !e.target.value && setKeyword("")} allowClear />
          </Col>
          <Col>
            <Select placeholder="Dự án" style={{ width: 180 }} allowClear onChange={setProjectFilter}>
              {projects.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Col>
          <Col>
            <Select placeholder="Trạng thái" style={{ width: 150 }} allowClear onChange={setStatusFilter}>
              {Object.entries(CR_STATUS_LABELS).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select placeholder="Ưu tiên" style={{ width: 120 }} allowClear onChange={setPriorityFilter}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={items} columns={columns} rowKey="id"
        loading={loading} size="small"
        pagination={{
          total, current: page, pageSize: 15, onChange: setPage,
          showTotal: (t) => `${t} change request`,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? "Sửa Change Request" : "Tạo Change Request mới"}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => { setShowModal(false); setEditing(null); }}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="projectId" label="Dự án">
                <Select allowClear onChange={(v) => loadModules(v)}>
                  {projects.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moduleId" label="Module">
                <Select allowClear>
                  {modules.map((m) => <Option key={m.id} value={m.id}>{m.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="priority" label="Ưu tiên" initialValue={2}>
                <Select>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="requestorCode" label="Mã người yêu cầu"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="requestorName" label="Tên người yêu cầu"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="developerCode" label="Mã Developer"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="developerName" label="Tên Developer"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="requestorDept" label="Bộ phận"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="Nội dung thay đổi" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do">
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="impactTimeline" label="Ảnh hưởng Timeline" valuePropName="checked" initialValue={false}>
                <Checkbox>Có ảnh hưởng</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impactDays" label="Số ngày ảnh hưởng" initialValue={0}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impactVersion" label="Phiên bản ảnh hưởng">
                <Input placeholder="v1.2" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <span>{selected?.code}</span>
            <Tag color={CR_STATUS_COLORS[selected?.status ?? 0]}>
              {CR_STATUS_LABELS[selected?.status ?? 0]}
            </Tag>
          </Space>
        }
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={560}
        extra={
          selected && selected.status < 9 && selected.status !== 10 && (
            <Space>
              <Button type="primary" size="small" onClick={() => setShowRevisionModal(true)}>
                + Revision
              </Button>
              <Button size="small" type="primary" ghost
                onClick={() => handleAdvanceStatus(selected)}>
                → {CR_STATUS_LABELS[(selected.status + 1) as number]}
              </Button>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Steps
              size="small"
              current={Math.min(selected.status, 9)}
              items={CR_WORKFLOW_STEPS.map((s) => ({ title: s }))}
              className="mb-4"
              style={{ overflowX: "auto" }}
            />

            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="Tiêu đề" span={2}>{selected.title}</Descriptions.Item>
              <Descriptions.Item label="Dự án">{selected.projectName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Module">{selected.moduleName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Ưu tiên">
                <Tag color={PRIORITY_COLORS[selected.priority]}>{PRIORITY_LABELS[selected.priority]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Revision">
                <Tag>Rev{selected.currentRevision}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">{selected.requestorName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Bộ phận">{selected.requestorDept ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Người phê duyệt">{selected.approverName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Developer">{selected.developerName ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Ảnh hưởng Timeline" span={2}>
                {selected.impactTimeline
                  ? <Tag color="red">+{selected.impactDays} ngày · {selected.impactVersion}</Tag>
                  : <Tag>Không ảnh hưởng</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{selected.createdAt?.substring(0, 10)}</Descriptions.Item>
              <Descriptions.Item label="Hoàn thành">{selected.completedAt?.substring(0, 10) ?? "—"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Nội dung</Divider>
            <div className="bg-gray-50 p-3 rounded text-sm mb-4 whitespace-pre-wrap">{selected.content ?? "—"}</div>

            <Divider orientation="left">Lý do</Divider>
            <div className="bg-gray-50 p-3 rounded text-sm mb-4">{selected.reason ?? "—"}</div>

            <Divider orientation="left">Lịch sử Revision</Divider>
            {selected.revisions && selected.revisions.length > 0 ? (
              <Timeline
                items={selected.revisions.map((rev: ChangeRevision) => ({
                  color: rev.status === 1 ? "green" : rev.status === 2 ? "red" : "blue",
                  children: (
                    <div key={rev.id} className="text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag>Rev{rev.revisionNumber}</Tag>
                        <Tag color={rev.status === 1 ? "success" : rev.status === 2 ? "error" : "processing"}>
                          {rev.status === 0 ? "Chờ duyệt" : rev.status === 1 ? "Đã duyệt" : "Từ chối"}
                        </Tag>
                        <Text type="secondary" className="text-xs">{rev.createdAt?.substring(0, 10)}</Text>
                      </div>
                      {rev.content && <div className="mt-1 text-gray-600">{rev.content}</div>}
                      {rev.reason && <div className="mt-1 text-gray-400 text-xs">Lý do: {rev.reason}</div>}
                      {rev.impactTimeline && (
                        <Tag color="orange" className="mt-1">+{rev.impactDays} ngày</Tag>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Text type="secondary">Chưa có revision nào.</Text>
            )}
          </>
        )}
      </Drawer>

      {/* Add Revision Modal */}
      <Modal
        title={`Thêm Revision (Rev${(selected?.currentRevision ?? 0) + 1})`}
        open={showRevisionModal}
        onOk={() => revisionForm.submit()}
        onCancel={() => { setShowRevisionModal(false); revisionForm.resetFields(); }}
        destroyOnClose
      >
        <Form form={revisionForm} layout="vertical" onFinish={handleAddRevision}>
          <Form.Item name="content" label="Nội dung thay đổi" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do thay đổi">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="impactAssessment" label="Đánh giá ảnh hưởng">
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="impactTimeline" label=" " valuePropName="checked" initialValue={false}>
                <Checkbox>Ảnh hưởng Timeline</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impactDays" label="Số ngày" initialValue={0}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impactVersion" label="Phiên bản"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="requestorCode" label="Mã người yêu cầu"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requestorName" label="Tên người yêu cầu"><Input /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
