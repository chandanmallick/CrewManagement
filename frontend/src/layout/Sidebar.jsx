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

  // Locate this around line 105 in Sidebar.jsx
  const handleNotificationClick = async (n) => {
    // 1. Close the pop-up immediately
    setNotifOpen(false);

    // 2. Route based on the action type provided by the backend
    if (n.action === "VIEW_LEAVE") {
      navigate(`/leave`); 
    } else if (n.action === "VIEW_PROFILE") {
      navigate(`/profile`);
    } else if (n.refId) {
      // General purpose redirection if a specific ID is present
      navigate(`${n.path || '/dashboard'}/${n.refId}`);
    }

    // 3. Mark the notification as read in the database
    try {
      await api.patch(`/notifications/${n._id}`, { status: "Read" });
      // Update local state to clear the badge count
      setNotifications(prev => 
        prev.map(notif => notif._id === n._id ? { ...notif, status: "Read" } : notif)
      );
    } catch (err) {
      console.error("Failed to update notification status", err);
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
        
        {/* Around line 155 in Sidebar.jsx */}
        {notifOpen && (
          <div
            style={{
              position: "fixed",         // Landmark: Use fixed to float over the layout
              top: "70px",
              left: open ? "260px" : "80px", // Landmark: Adjust based on sidebar 'open' state
              width: "300px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
              padding: "15px",
              zIndex: 2000,              // Landmark: High z-index to stay on top
              border: "1px solid #e0e0e0"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Notifications</span>
              <span 
                onClick={() => setNotifOpen(false)} 
                style={{ cursor: "pointer", color: "#999", fontSize: "12px" }}
              >
                Dismiss
              </span>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", padding: "10px" }}>
                No new alerts
              </div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className="notif-item" // Add hover effects in your CSS
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    background: n.status === "Unread" ? "#f0f7ff" : "#fff",
                    borderLeft: n.status === "Unread" ? "4px solid #1976d2" : "1px solid #eee"
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#333" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{n.message}</div>
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