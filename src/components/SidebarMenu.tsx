import { Menu } from "antd";
import { menuConfig } from "../utils/configs/menuConfig";
import { useEffect, useState } from "react";
import type { User } from "../services/fakeApi";
import { useLocation } from "react-router-dom";

const SidebarMenu = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // if (!user) return null; // hoặc Loading...

  const filteredMenu = menuConfig.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "user")
  );
  const location = useLocation();
  const currentKey = filteredMenu.find(
    (item) => item.path === location.pathname
  )?.key;

  return (
    <Menu
      theme="light"
      mode="inline"
      defaultSelectedKeys={[currentKey ? currentKey : "1"]}
      items={filteredMenu}
    />
  );
};

export default SidebarMenu;
