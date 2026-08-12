import { Menu } from "antd";
import { menuConfig } from "../utils/configs/menuConfig";
import { useEffect, useState } from "react";
import type { User } from "../services/fakeApi";
import { useLocation } from "react-router-dom";

const hasRole = (roles: string[] | undefined, userRole: string) =>
  !roles || roles.includes(userRole);

const filterMenuItems = (items: any[], userRole: string): any[] =>
  items
    .filter((item) => hasRole(item.roles, userRole))
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children, userRole);
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(Boolean);

const getAllKeys = (items: any[]): { key: string; path?: string }[] =>
  items.flatMap((item) =>
    item.children
      ? getAllKeys(item.children)
      : [{ key: item.key, path: item.path }]
  );

const SidebarMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const userRole = user?.role || "user";
  const filteredMenu = filterMenuItems(menuConfig, userRole);

  const allLeafKeys = getAllKeys(filteredMenu);
  const currentKey =
    allLeafKeys.find((item) => item.path === location.pathname)?.key ?? "2";

  // Find open group keys for nested menus
  const openGroupKey = filteredMenu
    .find((item) => item.children?.some((c: any) => c.path === location.pathname))
    ?.key;

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[currentKey]}
      defaultOpenKeys={openGroupKey ? [openGroupKey] : []}
      items={filteredMenu}
    />
  );
};

export default SidebarMenu;
