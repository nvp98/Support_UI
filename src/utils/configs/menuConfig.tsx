// src/config/menuConfig.ts
import {
  VideoCameraOutlined,
  UploadOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LaptopOutlined,
  ProjectOutlined,
  SwapOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  CodeOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";

export const menuConfig = [
  {
    key: "1",
    icon: <DashboardOutlined />,
    path: "/dashboard",
    label: <NavLink to="/dashboard">Dashboard</NavLink>,
    roles: ["admin"],
  },
  {
    key: "2",
    icon: <FileTextOutlined />,
    path: "/ticket-processing",
    label: <NavLink to="/ticket-processing">Quản lý hỗ trợ</NavLink>,
    roles: ["user", "admin"],
  },
  {
    key: "4",
    icon: <VideoCameraOutlined />,
    path: "/reports",
    label: <NavLink to="/reports">Báo cáo</NavLink>,
    roles: ["admin"],
  },
  {
    key: "5",
    icon: <UploadOutlined />,
    path: "/settings",
    label: <NavLink to="/settings">Quản trị</NavLink>,
    roles: ["admin"],
  },
  {
    key: "6",
    icon: <LaptopOutlined />,
    path: "/quan-ly-thiet-bi",
    label: <NavLink to="/quan-ly-thiet-bi">Sự cố thiết bị</NavLink>,
    roles: ["admin"],
  },
  // ─── SLC Module ─────────────────────────────────────────────
  {
    key: "slc-group",
    type: "group",
    label: "Lifecycle Phần mềm",
    children: [
      {
        key: "slc-1",
        icon: <AppstoreOutlined />,
        path: "/slc/dashboard",
        label: <NavLink to="/slc/dashboard">SLC Dashboard</NavLink>,
        roles: ["admin"],
      },
      {
        key: "slc-2",
        icon: <CodeOutlined />,
        path: "/slc/software-catalog",
        label: <NavLink to="/slc/software-catalog">Danh mục PM</NavLink>,
        roles: ["admin"],
      },
      {
        key: "slc-3",
        icon: <ApartmentOutlined />,
        path: "/slc/business-process",
        label: <NavLink to="/slc/business-process">Quy trình NV</NavLink>,
        roles: ["admin"],
      },
      {
        key: "slc-4",
        icon: <ProjectOutlined />,
        path: "/slc/project-timeline",
        label: <NavLink to="/slc/project-timeline">Project Timeline</NavLink>,
        roles: ["admin"],
      },
      {
        key: "slc-5",
        icon: <SwapOutlined />,
        path: "/slc/change-management",
        label: <NavLink to="/slc/change-management">Change Management</NavLink>,
      },
      {
        key: "slc-6",
        icon: <ImportOutlined />,
        path: "/slc/import",
        label: <NavLink to="/slc/import">Import Excel</NavLink>,
        roles: ["admin"],
      },
    ],
  },
];
