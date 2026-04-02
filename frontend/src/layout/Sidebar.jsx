import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/api";   // 🔥 add import

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
import { Badge, IconButton } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";


export default function Sidebar({ open, setOpen }) {

  const [userName,setUserName] = useState("")
  const [userRole,setUserRole] = useState("")
  const [notifOpen, setNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});

  useEffect(() => {

    const employeeId = localStorage.getItem("employeeId");

    api.get(`/profile/profile/${employeeId}`)
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));

  }, []);
    

  useEffect(() => {

    const name = localStorage.getItem("name")
    const role = localStorage.getItem("role")

    if(name) setUserName(name)
    if(role) setUserRole(role)

  }, [])

  const handleLogout = async () => {

    try {
      await api.post("/auth/logout")   // 🔥 call backend
    } catch (err) {
      console.log("Logout API failed", err)
    }

    localStorage.clear()
    window.location.reload()
  }

  const Item = ({to,icon,label}) => (
    <NavLink
      to={to}
      className={({isActive}) =>
        `sidebar-item ${isActive ? "active" : ""}`
      }
    >
      <div className="sidebar-icon">{icon}</div>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  )

  useEffect(() => {
    api.get("/notifications").then(res => {
      setNotifications(res.data);
    });
  }, []);

  const handleNotificationClick = (n) => {

    if (n.action === "VIEW_LEAVE") {
      navigate(`/leave/${n.refId}`);
    }

  };

  const isAdmin = userRole === "admin"

  const [configOpen, setConfigOpen] = useState(false);

  const Section = ({ title, children }) => (
    <div className="sidebar-section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );

  const Collapsible = ({ title, open, setOpen, children }) => (
    <div>
      <div
        className="sidebar-item"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        <div className="sidebar-icon"><Settings size={20}/></div>
        <span className="sidebar-label">{title}</span>
      </div>

      {open && (
        <div style={{ paddingLeft: "30px" }}>
          {children}
        </div>
      )}
    </div>
  );

  return (

    <div
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
    >

      <div className="sidebar-logo">
        {open ? "Shift Crew Management" : "SCMS"}
      </div>

      <div style={{ padding: "10px", textAlign: "center" }}>
        <IconButton
          color="inherit"
          onClick={() => setNotifOpen(!notifOpen)}
        >
        {notifOpen && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "10px",
              width: "250px",
              background: "#fff",
              borderRadius: "10px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              padding: "10px",
              zIndex: 1000
            }}
          >

            {notifications.length === 0 && (
              <div style={{ textAlign: "center", color: "#888" }}>
                No notifications
              </div>
            )}

            {notifications.slice(0, 5).map(n => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  cursor: "pointer",
                  background:
                    n.status === "Unread" ? "#e3f2fd" : "#f5f5f5",
                  borderLeft:
                    n.status === "Unread"
                      ? "4px solid #1976d2"
                      : "none"
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "13px" }}>
                  {n.title}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {n.message}
                </div>
              </div>
            ))}

          </div>
        )}
        
          <Badge
            badgeContent={notifications.filter(n => n.status === "Unread").length}
            color="error"
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </div>



      {/* ================= USER ================= */}
      <Section title="User">
        <Item to="/" icon={<LayoutDashboard size={20}/>} label="Dashboard"/>
        <Item to="/calendar" icon={<Calendar size={20}/>} label="Calendar"/>
        <Item to="/leave" icon={<ClipboardList size={20}/>} label="Leave"/>
        <Item to="/profile" icon={<User size={20}/>} label="Profile"/>
        <Item to="/org-chart" icon={<User size={20}/>} label="Departmental Chart"/>
      </Section>

      {isAdmin && (

        <Section title="Admin">

          <Item to="/roster" icon={<Repeat size={20}/>} label="Create Roster"/>
          <Item to="/roster-group" icon={<Users size={20}/>} label="Group Management"/>
          <Item to="/roster-cycle" icon={<RefreshCw size={20}/>} label="Cycle Setup"/>

          <Item to="/replacement" icon={<FileText size={20}/>} label="Replacement"/>
          <Item to="/training" icon={<GraduationCap size={20}/>} label="Training & Holiday"/>

          <Item to="/employee" icon={<UserCog size={20}/>} label="Employee Master"/>

        </Section>
      )}

      {isAdmin && (

        <Section title="Configuration">

          <Collapsible
            title="Config Settings"
            open={configOpen}
            setOpen={setConfigOpen}
          >

            <Item to="/dropdown" icon={<Settings size={18}/>} label="Dropdown Management"/>
            <Item to="/shift-history-admin" icon={<Settings size={18}/>} label="Shift History"/>
            <Item to="/admin/login-history" icon={<ShieldCheck size={18}/>} label="Login Audit"/>

          </Collapsible>

        </Section>
      )}

      {open && (

        <div className="sidebar-user" style={{ textAlign: "center", padding: "15px" }}>

          <Avatar
            src={
              profile.profilePhoto
                ? `http://localhost:8000${profile.profilePhoto}`
                : ""
            }
            sx={{
              width: 50,
              height: 50,
              margin: "0 auto 10px",
              bgcolor: "#1976d2",
              fontSize: 18
            }}
          >
            {!profile.profilePhoto &&
              (profile.name ? profile.name.charAt(0).toUpperCase() : "U")}
          </Avatar>

          <div className="user-name">{userName}</div>
          <div className="user-role">{userRole}</div>

          <button onClick={handleLogout}>Logout</button>

        </div>

      )}

    </div>

  )

}