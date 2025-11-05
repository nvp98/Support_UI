import { Layout, Button, Avatar, Dropdown, Space } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { useEffect, useState } from "react";

const { Header } = Layout;

const userMenu = [
  {
    key: "profile",
    label: "Thông tin cá nhân",
    icon: <UserOutlined />,
  },
  {
    key: "logout",
    label: "Đăng xuất",
    icon: <LogoutOutlined />,
  },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};

const MainHeader = ({ collapsed, setCollapsed }: any) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      // 1. Xoá localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("auth"); // nếu bạn lưu redux-persist

      // 2. Reset redux state
      dispatch(logout());

      // 3. Chuyển hướng về login
      navigate("/login");
    }

    if (key === "profile") {
      navigate("/profile");
    }
  };
  const username = localStorage.getItem("username");

  // Tự động ẩn sidebar khi mobile
  useEffect(() => {
    if (isMobile && !collapsed) setCollapsed(true);
  }, [isMobile, collapsed, setCollapsed]);

  return (
    <Header
      style={{
        height: 70,
        lineHeight: "70px",
        padding: "0 16px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // căn 2 bên
        borderBottom: "1px solid #e5e5e5", //viền dưới
      }}
    >
      {/* Nút toggle sidebar, luôn hiện trên mobile để mở/đóng */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ fontSize: "16px", width: 64, height: "100%" }}
      />

      {/* User account */}
      <Dropdown
        menu={{ items: userMenu, onClick: handleMenuClick }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <Space style={{ cursor: "pointer" }}>
          <Avatar icon={<UserOutlined />} />
          <span style={{ fontWeight: 500 }}>{username}</span>
        </Space>
      </Dropdown>
    </Header>
  );
};

export default MainHeader;
