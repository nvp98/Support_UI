// import {
//   MenuFoldOutlined,
//   MenuUnfoldOutlined,
//   UploadOutlined,
//   UserOutlined,
//   VideoCameraOutlined,
// } from "@ant-design/icons";
import { FloatButton, Form, Layout, message, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import logo from "../assets/images/logoHP.png";
import SidebarMenu from "../components/SidebarMenu";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";
import Modal from "antd/es/modal/Modal";
import { PlusCircleOutlined } from "@ant-design/icons";
// import { Editor } from "@tinymce/tinymce-react";
import TicketForm from "../components/TicketFormCreate";
import { buildFormData } from "../utils/configs/buildFormData";
import { hideLoading, showLoading } from "../store/loadingSlice";
import { useDispatch } from "react-redux";
import { ticketLogApi } from "../services/TicketLogApi";

const MainLayout = () => {
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState<any[]>([]);
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenCreateModal = () => {
    setOpen(true);
  };

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      dispatch(showLoading());
      await editorRef.current?.uploadImages();
      const html = editorRef.current?.getContent({ format: "html" }) || "";
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : {};

      const payload = {
        ticketTitle: values.title || "",
        ticketType: values.type || "",
        ticketContent: html || "",
        uploadedFile: fileList.length > 0 ? fileList[0] : null,
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

      const formData = buildFormData(payload, fileList);
      console.log("Form Data:", formData, payload);
      const res = await ticketLogApi.createTicket(formData);
      if (res.status === 200 || res.status === 201) {
        message.success("Tạo ticket thành công!");
        form.resetFields();
        editorRef.current?.setContent("");
        setFileList([]);
      } else {
        message.error("Tạo ticket thất bại!");
      }
    } catch (err: any) {
      console.error("Lỗi API:", err);
      message.error("Có lỗi xảy ra khi tạo ticket!");
    } finally {
      setLoading(false);
      dispatch(hideLoading());
    }
  };
  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          collapsedWidth={80}
          theme="light"
          style={{
            borderRight: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? 0 : "0 16px",
              transition: "all 0.2s",
            }}
          >
            {!collapsed && (
              <span
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 18,
                  marginLeft: 8,
                  whiteSpace: "nowrap",
                }}
              >
                <img
                  src={logo}
                  alt="logo"
                  style={{ height: 32, objectFit: "contain" }}
                />
              </span>
            )}
          </div>
          <div className="demo-logo-vertical" />
          {/* <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={[
              { key: "1", icon: <UserOutlined />, label: "nav 1" },
              { key: "2", icon: <VideoCameraOutlined />, label: "nav 2" },
              { key: "3", icon: <UploadOutlined />, label: "nav 3" },
            ]}
          /> */}
          <SidebarMenu />
        </Sider>

        <Layout>
          {/* <Header
            style={{
              height: 70,
              lineHeight: "70px",
              padding: 0,
              background: colorBgContainer,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: "16px", width: 64, height: "100%" }}
            />
          </Header> */}
          <MainHeader collapsed={collapsed} setCollapsed={setCollapsed} />

          <Content
            style={{
              margin: "8px 8px",
              padding: 16,
              flex: 1,
              overflowY: "auto",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
            <FloatButton
              shape="square"
              type="primary"
              className="create-request-float-button"
              tooltip="Tạo yêu cầu mới"
              description="Tạo yêu cầu mới"
              onClick={handleOpenCreateModal}
              icon={<PlusCircleOutlined />}
              style={{
                width: 184,
                height: 56,
                borderRadius: 999,
                boxShadow: "0 12px 28px rgba(22, 119, 255, 0.35)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #1677ff 0%, #13c2c2 100%)",
                border: "none",
                display: "none",
              }}
            />

            {/* Modal form */}
            <Modal
              title="Tạo yêu cầu mới"
              open={open}
              // onOk={handleOk}
              onCancel={() => setOpen(false)}
              footer={null}
              // okText="Tạo"
              // cancelText="Hủy"
            >
              <TicketForm
                form={form}
                fileList={fileList}
                setFileList={setFileList}
                onFinish={handleFinish}
                editorRef={editorRef}
                loading={loading}
              />
            </Modal>
          </Content>
          <MainFooter />
        </Layout>
      </Layout>
    </>
  );
};

export default MainLayout;
// function dispatch(arg0: any) {
//   throw new Error("Function not implemented.");
// }
