import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Layout from "./layout/Layout";

import Dashboard from "./components/Dashboard";
import CalendarView from "./components/CalendarView";
import LeaveManagement from "./components/LeaveManagement";
import DutyRoster from "./components/DutyRoster";
import RosterGroupManagement from "./components/RosterGroupManagement";
import RosterCycleSetup from "./components/RosterCycleSetup";
import TrainingHolidayMaster from "./components/TrainingHolidayMaster";
import ReplacementManagement from "./components/ReplacementManagement";
import EmployeeMaster from "./components/EmployeeMaster";
import DropdownMaster from "./components/dropdownmaster";
import DutyLeaveMaster from "./components/DutyLeaveMaster";
import LoginPage from "./components/LoginPage";
import Profile from "./components/Profile";
import AdminLoginHistory from "./components/AdminLoginHistory";
import DepartmentChart from "./components/DepartmentChart";
import ShiftHistoryAdmin from "./components/ShiftHistoryAdmin";

import "./styles.css";

function App() {

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const role = localStorage.getItem("role");

  return (
    <BrowserRouter>

      <Routes>

        {/* 🔐 LOGIN ROUTE */}
        <Route
          path="/login"
          element={
            loggedIn
              ? <Navigate to="/" />
              : <LoginPage onLogin={() => setLoggedIn(true)} />
          }
        />

        {/* 🔐 PROTECTED ROUTES */}
        <Route
          path="/*"
          element={
            loggedIn ? (
              <Layout>
                <Routes>

                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/leave" element={<LeaveManagement />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/org-chart" element={<DepartmentChart />} />

                  <Route path="/roster" element={<DutyRoster />} />
                  <Route path="/roster-group" element={<RosterGroupManagement />} />
                  <Route path="/roster-cycle" element={<RosterCycleSetup />} />

                  <Route path="/training" element={<TrainingHolidayMaster />} />
                  <Route path="/replacement" element={<ReplacementManagement />} />

                  <Route path="/employee" element={<EmployeeMaster />} />
                  <Route path="/dropdown" element={<DropdownMaster />} />
                  <Route path="/duty-leave" element={<DutyLeaveMaster />} />
                  <Route path="/shift-history-admin" element={<ShiftHistoryAdmin />} />

                  <Route
                    path="/admin/login-history"
                    element={
                      role === "admin"
                        ? <AdminLoginHistory />
                        : <div style={{ padding: 20 }}>Access Denied</div>
                    }
                  />

                  {/* DEFAULT */}
                  <Route path="*" element={<Navigate to="/" />} />

                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;