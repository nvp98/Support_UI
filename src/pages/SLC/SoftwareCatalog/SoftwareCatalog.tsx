import { useEffect, useState, useCallback } from "react";
import {
  Table, Tag, Button, Space, Modal, Form, Input, Select,
  Typography, Row, Col, message, Badge, Tooltip
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined
} from "@ant-design/icons";
import type { SoftwareCatalog as ISoftwareCatalog } from "../../../models/slc";
import { softwareApi } from "../../../services/slcApi";

const { Title } = Typography;
const { Option } = Select;

export default function SoftwareCatalog() {
  const [items, setItems] = useState<ISoftwareCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ISoftwareCatalog | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await softwareApi.getAll();
      setItems(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await softwareApi.update(editing.id, values);
        message.success("Cập nhật thành công");
      } else {
        await softwareApi.create({ ...values, status: 1 });
        message.success("Tạo phần mềm thành công");
      }
      setShowModal(false);
      form.resetFields();
      setEditing(null);
      load();
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa phần mềm?",
      onOk: async () => {
        try {
          await softwareApi.delete(id);
          message.success("Đã xóa");
          load();
        } catch (e: any) {
          message.error(e?.message ?? "Không thể xóa");
        }
      },
    });
  };

  const columns = [
    {
      title: "Mã", dataIndex: "code", key: "code", width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Tên Phần mềm", dataIndex: "name", key: "name",
      render: (v: string, r: ISoftwareCatalog) => (
        <div>
          <div className="font-medium">{v}</div>
          {r.description && <div className="text-xs text-gray-400">{r.description}</div>}
        </div>
      ),
    },
    {
      title: "Trạng thái", dataIndex: "status", key: "status", width: 110,
      render: (v: number) => (
        <Badge status={v === 1 ? "success" : "default"} text={v === 1 ? "Hoạt động" : "Tắt"} />
      ),
    },
    {
      title: "Ngày tạo", dataIndex: "createdAt", key: "created", width: 110,
      render: (v: string) => v?.substring(0, 10),
    },
    {
      title: "", key: "actions", width: 80,
      render: (_: any, r: ISoftwareCatalog) => (
        <Space>
          <Tooltip title="Sửa">
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditing(r); form.setFieldsValue(r); setShowModal(true); }} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button size="small" danger icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="m-0">
          <CodeOutlined className="mr-2" />
          Danh mục Phần mềm
        </Title>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditing(null); form.resetFields(); setShowModal(true); }}>
          Thêm Phần mềm
        </Button>
      </div>

      <Table
        dataSource={items} columns={columns} rowKey="id"
        loading={loading} size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `${t} phần mềm` }}
      />

      <Modal
        title={editing ? "Sửa Phần mềm" : "Thêm Phần mềm"}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => { setShowModal(false); setEditing(null); }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Mã" rules={[{ required: true, max: 20 }]}>
                <Input disabled={!!editing} placeholder="ERP, HRMS..." />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên phần mềm" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value={1}>Hoạt động</Option>
                <Option value={0}>Tắt</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
