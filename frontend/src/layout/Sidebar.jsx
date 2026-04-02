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


export default function Sidebar({ open, setOpen }) {

  const [userName,setUserName] = useState("")
  const [userRole,setUserRole] = useState("")

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

  const isAdmin = userRole === "admin"

  return (

    <div
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
    >

      <div className="sidebar-logo">
        {open ? "Shift Crew Management" : "SCMS"}
      </div>

      <div className="sidebar-section">

        <Item to="/" icon={<LayoutDashboard size={20}/>} label="Dashboard"/>
        <Item to="/calendar" icon={<Calendar size={20}/>} label="Calendar"/>
        <Item to="/leave" icon={<ClipboardList size={20}/>} label="Leave"/>
        <Item to="/profile" icon={<User size={20}/>} label="Profile"/>
        <Item to="/org-chart" icon={<User size={20}/>} label="Departmental Chart"/>

      </div>

      {isAdmin && (

        <div className="sidebar-section">

          <Item to="/roster" icon={<Repeat size={20}/>} label="Create Roster"/>
          <Item to="/roster-group" icon={<Users size={20}/>} label="Group Management"/>
          <Item to="/roster-cycle" icon={<RefreshCw size={20}/>} label="Cycle Setup"/>

          <Item to="/replacement" icon={<FileText size={20}/>} label="Replacement"/>
          <Item to="/training" icon={<GraduationCap size={20}/>} label="Training & Holiday"/>

          <Item to="/employee" icon={<UserCog size={20}/>} label="Employee Master"/>
          <Item to="/dropdown" icon={<Settings size={20}/>} label="Dropdown Management"/>
          <Item to="/shift-history-admin" icon={<Settings size={20}/>} label="Shift History"/>

          <Item
            to="/admin/login-history"
            icon={<ShieldCheck size={20}/>}
            label="Login Audit"
          />

        </div>

      )}

      {open && (

        <div className="sidebar-user">

          <div className="user-name">{userName}</div>
          <div className="user-role">{userRole}</div>

          <button onClick={handleLogout}>Logout</button>

        </div>

      )}

    </div>

  )

}