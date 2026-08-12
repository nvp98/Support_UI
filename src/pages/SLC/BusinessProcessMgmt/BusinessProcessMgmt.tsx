import { useEffect, useState, useCallback } from "react";
import {
  Card, Tree, Button, Space, Modal, Form, Input, Select,
  Typography, Table, Tag, Row, Col, message, InputNumber
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ApartmentOutlined, UnorderedListOutlined
} from "@ant-design/icons";
import type { BusinessProcess, ProcessStep } from "../../../models/slc";
import { businessProcessApi, processStepApi } from "../../../services/slcApi";

const { Title, Text } = Typography;
const { Option } = Select;

export default function BusinessProcessMgmt() {
  const [processes, setProcesses] = useState<BusinessProcess[]>([]);
  const [flatProcesses, setFlatProcesses] = useState<BusinessProcess[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<BusinessProcess | null>(null);
  const [loading, setLoading] = useState(false);

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<BusinessProcess | null>(null);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [processForm] = Form.useForm();
  const [stepForm] = Form.useForm();

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        businessProcessApi.getAll(),
        businessProcessApi.getFlat(),
      ]);
      setProcesses(treeRes);
      setFlatProcesses(flatRes);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSteps = useCallback(async (processId?: number) => {
    const res = await processStepApi.getAll({ businessProcessId: processId });
    setSteps(res);
  }, []);

  useEffect(() => { loadProcesses(); }, [loadProcesses]);

  const handleSelectProcess = (proc: BusinessProcess) => {
    setSelectedProcess(proc);
    loadSteps(proc.id);
  };

  const handleSaveProcess = async (values: any) => {
    try {
      if (editingProcess) {
        await businessProcessApi.update(editingProcess.id, values);
        message.success("Cập nhật quy trình thành công");
      } else {
        await businessProcessApi.create({ ...values, status: 1 });
        message.success("Tạo quy trình thành công");
      }
      setShowProcessModal(false);
      processForm.resetFields();
      setEditingProcess(null);
      loadProcesses();
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleSaveStep = async (values: any) => {
    const data = {
      ...values,
      businessProcessId: selectedProcess?.id ?? values.businessProcessId,
      status: 1,
    };
    try {
      if (editingStep) {
        await processStepApi.update(editingStep.id, data);
        message.success("Cập nhật bước thành công");
      } else {
        await processStepApi.create(data);
        message.success("Thêm bước thành công");
      }
      setShowStepModal(false);
      stepForm.resetFields();
      setEditingStep(null);
      if (selectedProcess) loadSteps(selectedProcess.id);
    } catch (e: any) {
      message.error(e?.message ?? "Lỗi xử lý");
    }
  };

  const handleDeleteProcess = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa quy trình?",
      onOk: async () => {
        try {
          await businessProcessApi.delete(id);
          message.success("Đã xóa quy trình");
          loadProcesses();
          if (selectedProcess?.id === id) setSelectedProcess(null);
        } catch (e: any) {
          message.error(e?.message ?? "Không thể xóa");
        }
      },
    });
  };

  const handleDeleteStep = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa bước quy trình?",
      onOk: async () => {
        try {
          await processStepApi.delete(id);
          message.success("Đã xóa bước");
          if (selectedProcess) loadSteps(selectedProcess.id);
        } catch (e: any) {
          message.error(e?.message ?? "Không thể xóa");
        }
      },
    });
  };

  const buildTreeData = (items: BusinessProcess[]): any[] =>
    items.map((bp) => ({
      key: String(bp.id),
      title: (
        <div className="flex items-center justify-between group" style={{ minWidth: 200 }}>
          <span
            onClick={() => handleSelectProcess(bp)}
            className="cursor-pointer hover:text-blue-500"
          >
            {bp.name}
            {bp.status === 0 && <Tag color="default" className="ml-1 text-xs">Inactive</Tag>}
          </span>
          <Space className="opacity-0 group-hover:opacity-100 ml-2">
            <EditOutlined
              className="text-blue-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setEditingProcess(bp);
                processForm.setFieldsValue(bp);
                setShowProcessModal(true);
              }}
            />
            <DeleteOutlined
              className="text-red-400 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handleDeleteProcess(bp.id); }}
            />
          </Space>
        </div>
      ),
      children: bp.children ? buildTreeData(bp.children) : [],
    }));

  const stepColumns = [
    { title: "#", dataIndex: "orderIndex", key: "order", width: 50 },
    { title: "Mã", dataIndex: "code", key: "code", width: 80 },
    { title: "Tên bước", dataIndex: "name", key: "name" },
    { title: "Mô tả", dataIndex: "description", key: "desc", render: (v: string) => v ?? "—" },
    {
      title: "", key: "actions", width: 80,
      render: (_: any, r: ProcessStep) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditingStep(r); stepForm.setFieldsValue(r); setShowStepModal(true); }} />
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDeleteStep(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="m-0">
          <ApartmentOutlined className="mr-2" />
          Quản lý Quy trình Nghiệp vụ
        </Title>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditingProcess(null); processForm.resetFields(); setShowProcessModal(true); }}>
          Thêm Quy trình
        </Button>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card title="Cây Quy trình" size="small" loading={loading}>
            {processes.length > 0 ? (
              <Tree treeData={buildTreeData(processes)} defaultExpandAll showIcon />
            ) : (
              <Text type="secondary">Chưa có quy trình nào.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              selectedProcess
                ? <Space><UnorderedListOutlined /> Bước: {selectedProcess.name}</Space>
                : "Chọn quy trình để xem bước"
            }
            size="small"
            extra={
              selectedProcess && (
                <Button type="primary" size="small" icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingStep(null);
                    stepForm.resetFields();
                    stepForm.setFieldsValue({ businessProcessId: selectedProcess.id });
                    setShowStepModal(true);
                  }}>
                  Thêm bước
                </Button>
              )
            }
          >
            {selectedProcess ? (
              <Table
                dataSource={steps} columns={stepColumns}
                rowKey="id" size="small" pagination={false}
              />
            ) : (
              <Text type="secondary">Nhấn vào quy trình bên trái để xem các bước.</Text>
            )}
          </Card>

          {selectedProcess && (
            <Card size="small" className="mt-3" title="Thông tin quy trình">
              <Row gutter={12}>
                <Col span={8}><Text type="secondary">Mã:</Text> {selectedProcess.code}</Col>
                <Col span={16}><Text type="secondary">Tên:</Text> {selectedProcess.name}</Col>
                <Col span={24} className="mt-2">
                  <Text type="secondary">Mô tả:</Text> {selectedProcess.description ?? "—"}
                </Col>
              </Row>
            </Card>
          )}
        </Col>
      </Row>

      {/* Business Process Modal */}
      <Modal
        title={editingProcess ? "Sửa Quy trình" : "Thêm Quy trình Nghiệp vụ"}
        open={showProcessModal}
        onOk={() => processForm.submit()}
        onCancel={() => { setShowProcessModal(false); setEditingProcess(null); }}
      >
        <Form form={processForm} layout="vertical" onFinish={handleSaveProcess}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Mã quy trình" rules={[{ required: true }]}>
                <Input disabled={!!editingProcess} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên quy trình" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="parentId" label="Quy trình cha (nếu có)">
            <Select allowClear>
              {flatProcesses
                .filter((p) => !editingProcess || p.id !== editingProcess.id)
                .map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="orderIndex" label="Thứ tự" initialValue={0}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Step Modal */}
      <Modal
        title={editingStep ? "Sửa Bước quy trình" : "Thêm Bước quy trình"}
        open={showStepModal}
        onOk={() => stepForm.submit()}
        onCancel={() => { setShowStepModal(false); setEditingStep(null); }}
      >
        <Form form={stepForm} layout="vertical" onFinish={handleSaveStep}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="code" label="Mã bước" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên bước" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="businessProcessId" label="Quy trình" rules={[{ required: true }]}>
            <Select>
              {flatProcesses.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="orderIndex" label="Thứ tự" initialValue={0}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
