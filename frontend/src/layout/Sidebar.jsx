import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import api, { BASE_URL } from "../api/api"; 

import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  User,
  Repeat,
  Users,
  RefreshCw,
  FileText,
  GraduationCap,
  UserCog,
  Settings,
  ShieldCheck 
} from "lucide-react";
import { Badge, IconButton, Avatar } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ open, setOpen }) {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({});
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");

    if (name) setUserName(name);
    if (role) setUserRole(role);

    if (employeeId) {
      api.get(`/profile/profile/${employeeId}`)
        .then(res => setProfile(res.data))
        .catch(err => console.error("Profile fetch error:", err));
    }

    api.get("/notifications").then(res => {
      setNotifications(res.data);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout API failed", err);
    }
    localStorage.clear();
    window.location.reload();
  };

  const handleNotificationClick = (n) => {
    if (n.action === "VIEW_LEAVE") {
      navigate(`/leave/${n.refId}`);
    }
  };

  const Item = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
    >
      <div className="sidebar-icon">{icon}</div>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  );

  const Section = ({ title, children }) => (
    <div className="sidebar-section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );

  const isAdmin = userRole === "admin";

  return (
    <div
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="sidebar-logo">
        {open ? "Shift Crew Management" : "SCMS"}
      </div>

      <div style={{ padding: "10px", textAlign: "center" }}>
        <IconButton color="inherit" onClick={() => setNotifOpen(!notifOpen)}>
          <Badge
            badgeContent={notifications.filter(n => n.status === "Unread").length}
            color="error"
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        {notifOpen && (
          <div className="notification-dropdown">
            {notifications.length === 0 ? (
              <div style={{ padding: "10px", color: "#888" }}>No notifications</div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`notif-item ${n.status === "Unread" ? "unread" : ""}`}
                >
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Section title="User">
        <Item to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <Item to="/calendar" icon={<Calendar size={20} />} label="Calendar" />
        <Item to="/leave" icon={<ClipboardList size={20} />} label="Leave" />
        <Item to="/profile" icon={<User size={20} />} label="Profile" />
        <Item to="/org-chart" icon={<Users size={20} />} label="Departmental Chart" />
      </Section>

      {isAdmin && (
        <>
          <Section title="Admin">
            <Item to="/roster" icon={<Repeat size={20} />} label="Create Roster" />
            <Item to="/roster-group" icon={<Users size={20} />} label="Group Management" />
            <Item to="/roster-cycle" icon={<RefreshCw size={20} />} label="Cycle Setup" />
            <Item to="/replacement" icon={<FileText size={20} />} label="Replacement" />
            <Item to="/training" icon={<GraduationCap size={20} />} label="Training & Holiday" />
            <Item to="/employee" icon={<UserCog size={20} />} label="Employee Master" />
          </Section>

          <Section title="Configuration">
            <div className="sidebar-item" onClick={() => setConfigOpen(!configOpen)} style={{ cursor: "pointer" }}>
              <div className="sidebar-icon"><Settings size={20} /></div>
              <span className="sidebar-label">Config Settings</span>
            </div>
            {configOpen && (
              <div style={{ paddingLeft: "30px" }}>
                <Item to="/dropdown" icon={<Settings size={18} />} label="Dropdown Management" />
                <Item to="/shift-history-admin" icon={<Settings size={18} />} label="Shift History" />
                <Item to="/admin/login-history" icon={<ShieldCheck size={18} />} label="Login Audit" />
              </div>
            )}
          </Section>
        </>
      )}

      {open && (
        <div className="sidebar-user">
          <Avatar
            src={profile.profilePhoto ? `${BASE_URL}${profile.profilePhoto}` : ""}
            sx={{ width: 50, height: 50, margin: "0 auto 10px", bgcolor: "#1976d2" }}
          >
            {!profile.profilePhoto && (userName ? userName.charAt(0).toUpperCase() : "U")}
          </Avatar>
          <div className="user-name">{userName}</div>
          <div className="user-role">{userRole}</div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}