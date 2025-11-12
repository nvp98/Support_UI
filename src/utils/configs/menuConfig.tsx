// src/config/menuConfig.ts
import {
  VideoCameraOutlined,
  UploadOutlined,
  DashboardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";

export const menuConfig = [
  {
    key: "1",
    icon: <DashboardOutlined />,
    path: "/",
    label: <NavLink to="/">Dashboard</NavLink>,
    roles: ["admin"], // chỉ admin mới thấy
  },
  // {
  //   key: "2",
  //   icon: <DashboardOutlined />,
  //   label: <NavLink to="/dashboard">Dashboard</NavLink>,
  //   roles: ["admin", "user"], // cả 2 role đều thấy
  // },
  {
    key: "2",
    icon: <FileTextOutlined />,
    path: "/ticket-processing",
    label: <NavLink to="/ticket-processing">Quản lý hỗ trợ</NavLink>,
    roles: ["user", "admin"], // cả 2 role đều thấy
  },
  {
    key: "4",
    icon: <VideoCameraOutlined />,
    label: <NavLink to="/reports">Báo cáo</NavLink>,
    roles: ["admin"], // chỉ admin mới thấy
  },
  {
    key: "5",
    icon: <UploadOutlined />,
    path: "/settings",
    label: <NavLink to="/settings">Quản trị</NavLink>,
    roles: ["admin"], // chỉ admin mới thấy
  },
  // {
  //   key: "6",
  //   icon: <UserOutlined />,
  //   label: <NavLink to="/users">Quản lý tài khoản</NavLink>,
  //   roles: ["admin"],
  // },
];
