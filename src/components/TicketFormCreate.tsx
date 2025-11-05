import { Form, Input, Select, Button, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import { UploadApi } from "../services/UploadApi";

const { Option } = Select;

interface TicketFormProps {
  form: any;
  fileList: any[];
  setFileList: (list: any[]) => void;
  onFinish: (values: any) => void;
  editorRef: any;
  loading?: boolean;
}

export default function TicketForm({
  form,
  fileList,
  setFileList,
  onFinish,
  editorRef,
  loading = false,
}: TicketFormProps) {
  const handleUploadChange = ({ fileList }: any) => setFileList(fileList);

  return (
    <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{}}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Form.Item
            label="Tiêu đề ticket"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề ticket" },
            ]}
          >
            <Input placeholder="Nhập tiêu đề ticket" />
          </Form.Item>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Form.Item
            label="Loại yêu cầu"
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại yêu cầu" }]}
          >
            <Select placeholder="Chọn loại yêu cầu">
              <Option value="SOFT">Hỗ trợ phần mềm</Option>
              <Option value="HARD">Hỗ trợ phần cứng</Option>
              <Option value="SAP">SAP</Option>
            </Select>
          </Form.Item>
        </div>
      </div>
      <Form.Item
        label="Nội dung yêu cầu"
        name="content_modal"
        rules={[{ required: true, message: "Vui lòng nhập nội dung yêu cầu" }]}
        trigger="onEditorChange"
        getValueFromEvent={(content) => content}
      >
        <Editor
          onInit={(_evt, editor) => (editorRef.current = editor)}
          init={{
            height: 350,
            language: "vi",
            plugins: "link image table lists code",
            toolbar:
              "undo redo | bold italic | alignleft aligncenter alignright | image | code",
            paste_data_images: true,
            automatic_uploads: true,
            convert_urls: false,
            relative_urls: false,
            remove_script_host: false,
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
          accept=".pdf,.doc,.docx,.jpg,.png,.gif"
        >
          <Button icon={<UploadOutlined />}>Choose Files</Button>
        </Upload>
        <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
          Hỗ trợ file: PDF, DOC, DOCX, JPG, PNG, GIF (tối đa 10MB mỗi file)
        </div>
      </Form.Item>
      <Form.Item label="Thông tin liên hệ" name="contact">
        <Input placeholder="Số điện thoại hoặc email liên hệ để được hỗ trợ kịp thời" />
      </Form.Item>
      <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
        <Button
          style={{ marginRight: 8 }}
          onClick={() => form.resetFields()}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={loading}
        >
          Tạo ticket
        </Button>
      </Form.Item>
    </Form>
  );
}
