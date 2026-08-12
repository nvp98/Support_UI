import { useState } from "react";
import { Button, Upload, Card, Alert, Spin, Result, Typography, Divider, List } from "antd";
import { DownloadOutlined, InboxOutlined, WarningOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import apiService from "../../../services/ApiService";

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportResult {
  success: boolean;
  projectsAdded: number;
  projectsUpdated: number;
  modulesAdded: number;
  modulesUpdated: number;
  tasksAdded: number;
  tasksUpdated: number;
  changeRequestsAdded: number;
  errors: string[];
  warnings: string[];
}

const StatBox = ({ value, label, bg }: { value: number; label: string; bg: string }) => (
  <div style={{ padding: "8px 16px", background: bg, borderRadius: 8, textAlign: "center", minWidth: 110 }}>
    <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{label}</div>
  </div>
);

export default function SlcImport() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleDownloadTemplate = () => {
    window.open("/api/SlcImport/template", "_blank");
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiService.post<ImportResult>("/api/SlcImport/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res);
    } catch (e: any) {
      const msg = e?.message ?? JSON.stringify(e) ?? "Lỗi import không xác định";
      setResult({
        success: false,
        projectsAdded: 0, projectsUpdated: 0,
        modulesAdded: 0, modulesUpdated: 0,
        tasksAdded: 0, tasksUpdated: 0,
        changeRequestsAdded: 0,
        errors: [msg], warnings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    accept: ".xlsx",
    fileList,
    multiple: false,
    beforeUpload: (file) => {
      setFileList([file as unknown as UploadFile]);
      handleUpload(file);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setResult(null);
    },
  };

  const resultStatus = result
    ? result.errors.length > 0
      ? "error"
      : result.warnings.length > 0
      ? "warning"
      : "success"
    : "success";

  const resultTitle = result
    ? result.errors.length > 0
      ? "Import có lỗi"
      : result.warnings.length > 0
      ? "Import hoàn thành với cảnh báo"
      : "Import thành công!"
    : "";

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Import dữ liệu SLC từ Excel</h2>
          <Text type="secondary">
            Nhập toàn bộ dữ liệu Project → Module → Task → Change Request từ file Excel.
            Dữ liệu đã tồn tại (theo code) sẽ được cập nhật, dữ liệu mới sẽ được thêm vào.
          </Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          Tải file mẫu (.xlsx)
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Spin spinning={loading} tip="Đang import dữ liệu...">
          <Dragger {...uploadProps} disabled={loading}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc click để chọn file Excel</p>
            <p className="ant-upload-hint">
              Chỉ hỗ trợ file <strong>.xlsx</strong>. Tải file mẫu để biết định dạng chuẩn.
              File phải có các sheet: <strong>Projects</strong>, <strong>Modules</strong>,{" "}
              <strong>Tasks</strong>, <strong>ChangeRequests</strong>.
            </p>
          </Dragger>
        </Spin>
      </Card>

      {result && (
        <Card>
          <Result
            status={resultStatus}
            title={resultTitle}
            subTitle={
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <StatBox value={result.projectsAdded} label="Project thêm mới" bg="#e6f4ff" />
                <StatBox value={result.projectsUpdated} label="Project cập nhật" bg="#e6f4ff" />
                <StatBox value={result.modulesAdded} label="Module thêm mới" bg="#f6ffed" />
                <StatBox value={result.modulesUpdated} label="Module cập nhật" bg="#f6ffed" />
                <StatBox value={result.tasksAdded} label="Task thêm mới" bg="#fffbe6" />
                <StatBox value={result.tasksUpdated} label="Task cập nhật" bg="#fffbe6" />
                <StatBox value={result.changeRequestsAdded} label="CR thêm mới" bg="#fff0f6" />
              </div>
            }
          />

          {result.warnings.length > 0 && (
            <>
              <Divider orientation="left">
                <WarningOutlined style={{ color: "#faad14" }} /> Cảnh báo ({result.warnings.length})
              </Divider>
              <List
                size="small"
                dataSource={result.warnings}
                renderItem={(w) => (
                  <List.Item style={{ padding: "4px 0" }}>
                    <Alert type="warning" message={w} showIcon style={{ width: "100%" }} />
                  </List.Item>
                )}
              />
            </>
          )}

          {result.errors.length > 0 && (
            <>
              <Divider orientation="left" style={{ color: "#ff4d4f" }}>
                Lỗi ({result.errors.length})
              </Divider>
              <List
                size="small"
                dataSource={result.errors}
                renderItem={(err) => (
                  <List.Item style={{ padding: "4px 0" }}>
                    <Alert type="error" message={err} showIcon style={{ width: "100%" }} />
                  </List.Item>
                )}
              />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
