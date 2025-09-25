import React from "react";
import { FloatingNav } from "../ui/floating-navbar.jsx";
import { IconHome, IconMessage, IconUser, IconLogin, IconDatabase, IconLogout } from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  // Left group (desktop center-left): main links. Right group: actions like Login/Signup or Profile/Logout
  const navItems = [
    { name: "Home", link: "/", icon: <IconHome size={18} /> },
    { name: "About", link: "/about", icon: <IconDatabase size={18} /> },
    { name: "Interview", link: "/interview", icon: <IconDatabase size={18} /> },
    { name: "Jobs", link: "/jobs", icon: <IconDatabase size={18} /> },
    { name: "Schedule", link: "/schedule", icon: <IconDatabase size={18} /> },
  ];

  const actions = isAuthenticated() 
    ? [
        { 
          name: "Profile", 
          link: "/profile", 
          icon: <IconUser size={18} /> 
        },
        { 
          name: "Logout", 
          link: "#", 
          icon: <IconLogout size={18} />,
          onClick: logout
        }
      ]
    : [
        { name: "Login", link: "/login", icon: <IconLogin size={18} /> },
        { name: "Signup", link: "/signup", icon: <IconUser size={18} /> },
      ];

  return <FloatingNav navItems={navItems} actions={actions} />;
};

export default Navbar;
