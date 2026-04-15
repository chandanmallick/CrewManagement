import React, { useState, useEffect } from "react";
import api from "../api/api";
import dayjs from "dayjs";
import "react-modern-calendar-datepicker/lib/DatePicker.css";
import DatePicker from "react-multi-date-picker";
// import "react-multi-date-picker/styles/colors/blue.css";
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Divider,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  MenuItem,
  FormControlLabel
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function LeaveManagement() {

  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [replacementRequired, setReplacementRequired] = useState(false);
  const [forwardLeaveId, setForwardLeaveId] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);


  const [dutyRows, setDutyRows] = useState([]);
  const [reason, setReason] = useState("");

  const [leaveUpdates, setLeaveUpdates] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(true);

  const [approvedMonth, setApprovedMonth] = useState(dayjs().format("YYYY-MM"));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [approvedPage, setApprovedPage] = useState(0);

  const [isSIC, setIsSIC] = useState(false);
  const [isDeptIC, setIsDeptIC] = useState(false);
  const [loggedEmployeeId, setLoggedEmployeeId] = useState("");
  const [compOffList, setCompOffList] = useState([]);

  const [selectedDays, setSelectedDays] = useState([]);

  const isAdmin = localStorage.getItem("role") === "admin";

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (empId) setLoggedEmployeeId(empId);

    fetchEmployees();
    fetchLeaveTypes();
    fetchLeaveList();
    fetchMyRole();
    fetchCompOff();
  }, []);

  const fetchEmployees = async () => {
    const res = await api.get("/leave/employees");
    setEmployees(res.data);

    if (res.data.length === 1 && res.data[0].isSIC) {
      setIsSIC(true);
    }
  };

  const fetchCompOff = async () => {
    const res = await api.get("/leave/comp-off/available");
    setCompOffList(res.data);
  };

  const fetchMyRole = async () => {
    try {
      const res = await api.get("/leave/my-role");
      setIsSIC(res.data.isSIC);
      setIsDeptIC(res.data.isDeptIC);
    } catch (err) {
      console.error(err);
    }
  };

  const SectionHeader = ({ title, open, toggle }) => (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 3,
        background: "linear-gradient(135deg,#e3f2fd,#f1f8e9)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>

      <IconButton onClick={toggle}>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Paper>
  );

  const fetchLeaveTypes = async () => {
    const res = await api.get("/leave/leave-types", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    console.log("LEAVE TYPES API:", res.data);  // 👈 ADD THIS

    setLeaveTypes(res.data);
  };


  const fetchDuty = async () => {

    if (!selectedEmp || selectedDays.length === 0) {
      alert("Select employee and dates");
      return;
    }

    const sortedDates = selectedDays
      .map(d => dayjs(d.toDate()))
      .sort((a, b) => a - b);

    const startDate = sortedDates[0].format("YYYY-MM-DD");
    const endDate = sortedDates[sortedDates.length - 1].format("YYYY-MM-DD");

    try {

      const res = await api.get("/leave/duty-detailed", {
        params: {
          employeeId: selectedEmp.employeeId,
          startDate,
          endDate
        }
      });

      const formatted = res.data.map((row) => ({
        ...row,
        selected: false,
        leaveType: ""
      }));

      setDutyRows(formatted);

    } catch (err) {
      console.error(err);
      alert("Duty fetch failed");
    }

  };

  const toggleRow = (index) => {
    const updated = [...dutyRows];
    updated[index].selected = !updated[index].selected;
    setDutyRows(updated);
  };

  const changeLeaveType = (index, value) => {
    const updated = [...dutyRows];
    updated[index].leaveType = value;

    // reset compOff if changing type
    if (value !== "C-OFF") {
      updated[index].compOffId = null;
    }

    setDutyRows(updated);
  };

  const applyLeave = async () => {

    const selectedRows = dutyRows.filter((r) => r.selected);

    if (selectedRows.length === 0) {
      alert("Select at least one day");
      return;
    }

    if (!reason) {
      alert("Enter reason");
      return;
    }

    try {

      for (let d of selectedDays) {
        const date = dayjs(d.toDate()).format("YYYY-MM-DD");

        await api.post("/leave/apply", {
          employeeId: selectedEmp.employeeId,
          date,
          leaveType: selectedRows[0]?.leaveType,
          reason
        });
      }

      alert("Leave Applied Successfully");
      setDutyRows([]);
      setReason("");
      fetchLeaveList();

    } catch (err) {
      console.error(err);
      alert("Error applying leave");
    }

  };

  const confirmForward = async () => {

    try {

      await api.put(`/leave/sic-forward/${forwardLeaveId}`, {
        replacementRequired: replacementRequired
      });

      setForwardDialogOpen(false);
      setForwardLeaveId(null);

      fetchLeaveList();

    } catch (err) {
      console.error(err);
    }
  };

  const filteredApprovedLeaves = approvedLeaves.filter(l =>
    dayjs(l.date).format("YYYY-MM") === approvedMonth
  );

  const paginatedApprovedLeaves =
    filteredApprovedLeaves.slice(
      approvedPage * rowsPerPage,
      (approvedPage + 1) * rowsPerPage
  );

  const approveLeave = async (id) => {
    await api.put(`/leave/approve/${id}`);
    fetchLeaveList();
  };

  const withdrawLeave = async (id) => {
    await api.put(`/leave/withdraw/${id}`);
    fetchLeaveList();
  };

  const rejectLeaveSIC = async (id) => {
    await api.put(`/leave/sic-reject/${id}`);
    fetchLeaveList();
  };

  const rejectLeaveDept = async (id) => {
    await api.put(`/leave/dept-reject/${id}`);
    fetchLeaveList();
  };

  const fetchLeaveList = async () => {

    try {

      const res = await api.get("/leave/list");
      const data = res.data || [];

      const pending = data.filter(
        l => l.finalStatus !== "Approved"
      );

      const approved = data.filter(
        l => l.finalStatus === "Approved"
      );

      setLeaveUpdates(pending);
      setApprovedLeaves(approved);

      const upcoming = data.filter((l) => {
        const diff = dayjs(l.startDate).diff(dayjs(), "day");
        return diff >= 0 && diff <= 5;
      });

      setUpcomingLeaves(upcoming);

    } catch (err) {
      console.error(err);
    }

  };

  const superDeleteLeave = async (id) => {
    if (!window.confirm("⚠️ This will permanently revert everything. Continue?")) return;

    try {
      await api.delete(`/leave/super-revert/${id}`);
      alert("Leave fully reverted");
      fetchLeaveList();
    } catch (err) {
      console.error(err);
      alert("Error reverting leave");
    }
  };

  return (
    <Box sx={{ p: 3 }}>

      <Paper
        sx={{
          p:3,
          mb:3,
          borderRadius:3,
          background:"linear-gradient(90deg,#0f2027,#203a43,#2c5364)",
          color:"white",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between"
        }}
      >

        <Box>
          <Typography variant="h5" fontWeight="bold">
            Shift Leave Management
          </Typography>

          <Typography variant="body2">
            Leave application
          </Typography>
        </Box>

      </Paper>

      {/* APPLY LEAVE */}

      <Paper sx={{ p: 3, mb: 3 }}>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={employees}
              value={selectedEmp}
              sx={{ minWidth: 300 }}
              onChange={(e, val) => {
                if (!val) {
                  setSelectedEmp(null);
                  return;
                }

                setSelectedEmp({
                  ...val,
                  employeeId: val.employeeId || val.userId
                });
              }}
              getOptionLabel={(o) => `${o.name} - ${o.designation}`}
              isOptionEqualToValue={(option, value) =>
                (option.employeeId || option.userId) ===
                (value.employeeId || value.userId)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <DatePicker
              multiple
              value={selectedDays}
              onChange={(dates) => setSelectedDays(dates || [])}
              format="YYYY/MM/DD"
              numberOfMonths={2}
              showOtherDays
              render={(value, openCalendar) => (
                <TextField
                  fullWidth
                  label="Select Dates"
                  onClick={openCalendar}
                  value={
                    selectedDays.length > 0
                      ? `${selectedDays.length} date(s) selected`
                      : ""
                  }
                  InputProps={{
                    readOnly: true
                  }}
                />
              )}

              plugins={[
                <div style={{
                  padding: "10px",
                  minWidth: "180px",
                  maxHeight: "250px",
                  overflowY: "auto"
                }}>
                  <b>Selected Dates</b>

                  {selectedDays.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#1976d2",
                        color: "white",
                        padding: "5px 8px",
                        borderRadius: "4px",
                        marginTop: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      {dayjs(d.toDate()).format("YYYY/MM/DD")}

                      <span
                        style={{ cursor: "pointer", marginLeft: "8px" }}
                        onClick={() => {
                          const updated = selectedDays.filter((_, idx) => idx !== i);
                          setSelectedDays(updated);
                        }}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              ]}
            />
          </Grid>
            

          {/* <Grid item xs={12} md={2}>
            <TextField
              type="date"
              label="To"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid> */}

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              sx={{ height: 56 }}
              fullWidth
              onClick={fetchDuty}
            >
              Fetch Duty
            </Button>
          </Grid>

        </Grid>

      </Paper>

      {/* DUTY LIST */}

      {dutyRows.length > 0 && (
        <Paper sx={{ p: 3 }}>

          <Typography variant="h6">Duty List</Typography>
          <Divider sx={{ mb: 2 }} />

          <Table size="small">

            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Others On Leave</TableCell>
                <TableCell>Leave Type</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {dutyRows.map((row, index) => (
                <TableRow key={row.date}>

                  <TableCell>
                    <Checkbox
                      checked={row.selected}
                      onChange={() => toggleRow(index)}
                    />
                  </TableCell>

                  <TableCell>{dayjs(row.date).format("DD MMM YYYY")}</TableCell>
                  <TableCell>{row.assignedDuty}</TableCell>
                  <TableCell>{row.groupName}</TableCell>

                  <TableCell>
                    {row.othersOnLeave?.length > 0
                      ? row.othersOnLeave.map((o) => (
                          <Chip
                            key={o.employeeId}
                            label={o.name}
                            size="small"
                            color="warning"
                            sx={{ mr: 1 }}
                          />
                        ))
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <Autocomplete
                      options={leaveTypes}
                      value={
                        leaveTypes.find(
                          (l) => l.value === row.leaveType
                        ) || null
                      }
                      onChange={(e, val) =>
                        changeLeaveType(index, val?.value || "")
                      }
                      getOptionLabel={(option) =>
                        option?.label || ""
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Leave Type"
                        />
                      )}
                    />
                    {row.leaveType === "C-OFF" && (
                      <Autocomplete
                        options={compOffList}
                        value={
                          compOffList.find(c => c.id === row.compOffId) || null
                        }
                        getOptionLabel={(o) =>
                          `${o.earnedDate} (Exp: ${o.expiryDate})`
                        }
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(e, val) => {
                          const updated = [...dutyRows];
                          updated[index].compOffId = val?.id || null;
                          setDutyRows(updated);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            label="Select Comp-Off"
                          />
                        )}
                      />
                    )}
                  </TableCell>

                </TableRow>
              ))}

            </TableBody>
          </Table>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button variant="contained" color="success" onClick={applyLeave}>
              Apply Leave
            </Button>
          </Box>

        </Paper>
      )}

      {/* Pending LEAVE UPDATES */}

      {/* PENDING LEAVE */}

      <SectionHeader
        title="Pending Leave Updates"
        open={pendingOpen}
        toggle={() => setPendingOpen(!pendingOpen)}
      />

      {pendingOpen && (
        <Paper sx={{ p: 3, mt: 2, mb: 4 }}>
          <Table size="small">

            <TableHead>
              <TableRow sx={{ background: "#1b5e20" }}>
                <TableCell sx={{ color: "white" }}>Name</TableCell>
                <TableCell sx={{ color: "white" }}>Group</TableCell>
                <TableCell sx={{ color: "white" }}>Leave Period</TableCell>
                <TableCell sx={{ color: "white" }}>Type</TableCell>
                <TableCell sx={{ color: "white" }}>Others On Leave</TableCell>
                <TableCell sx={{ color: "white" }}>SIC</TableCell>
                <TableCell sx={{ color: "white" }}>Dept</TableCell>
                <TableCell sx={{ color: "white" }}>Final</TableCell>
                <TableCell sx={{ color: "white" }}>Replacement</TableCell>
                <TableCell sx={{ color: "white" }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {leaveUpdates.map((l) => (
                <TableRow key={l.id}>

                  <TableCell>{l.name}</TableCell>

                  <TableCell>{l.groupName}</TableCell>

                  <TableCell>
                    {dayjs(l.startDate).format("DD MMM")} → {dayjs(l.endDate).format("DD MMM")}
                  </TableCell>

                  <TableCell>{l.leaveType}</TableCell>

                  <TableCell>
                    {l.othersOnLeave?.length > 0
                      ? l.othersOnLeave.map((o) => (
                          <Chip
                            key={o.employeeId}
                            label={o.name}
                            size="small"
                            color="warning"
                            sx={{ mr: 1 }}
                          />
                        ))
                      : "-"}
                  </TableCell>

                  {/* SIC STATUS */}
                  <TableCell>
                    <Chip
                      label={l.sicApprovalStatus || "Pending"}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.sicApprovalStatus === "Forwarded"
                            ? "#1976d2"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* DEPT STATUS */}
                  <TableCell>
                    <Chip
                      label={l.deptApprovalStatus || "Pending"}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.deptApprovalStatus === "Approved"
                            ? "#2e7d32"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* FINAL STATUS */}
                  <TableCell>
                    <Chip
                      label={l.finalStatus}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.finalStatus === "Approved"
                            ? "#2e7d32"
                            : l.finalStatus === "Rejected"
                            ? "#d32f2f"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* REPLACEMENT */}
                  <TableCell>
                    {l.replacement ? (
                      <Chip
                        label={l.replacement.name}
                        size="small"
                        color="success"
                      />
                    ) : l.replacementRequired ? (
                      <Chip
                        label="Required"
                        size="small"
                        color="error"
                      />
                    ) : (
                      <Chip
                        label="Not Required"
                        size="small"
                      />
                    )}
                  </TableCell>

                  {/* ACTION BUTTONS */}
                  <TableCell>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",   // 🔥 allows wrapping properly
                        alignItems: "center"
                      }}
                    >

                      {!isSIC &&
                        !isDeptIC &&
                        l.finalStatus === "Applied" &&
                        l.name === localStorage.getItem("name") && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ background: "#8e24aa" }}
                            onClick={() => withdrawLeave(l.id)}
                          >
                            Withdraw
                          </Button>
                        )}

                      {isSIC &&
                        l.finalStatus === "Applied" &&
                        l.sicApprovalStatus !== "Forwarded" && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ background: "#6a1b9a", mr: 1 }}
                              onClick={() => {
                                setForwardLeaveId(l.id);
                                setReplacementRequired(false);
                                setForwardDialogOpen(true);
                              }}
                            >
                              Forward
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              onClick={() => rejectLeaveSIC(l.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                      {isDeptIC &&
                        l.sicApprovalStatus === "Forwarded" &&
                        l.deptApprovalStatus !== "Approved" && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ background: "#43a047", mr: 1 }}
                              onClick={() => approveLeave(l.id)}
                            >
                              Approve
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => rejectLeaveSIC(l.id)}
                            >
                              Reject
                            </Button>
                          </>
                      )}

                      {isAdmin && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          sx={{ mt: 1 }}
                          onClick={() => superDeleteLeave(l.id)}
                        >
                          Super Delete
                        </Button>
                      )}

                    </Box>

                  </TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>
        </Paper>
      )}

      {/* Approve LEAVE  */}

      {/* APPROVED LEAVE */}

      <SectionHeader
        title="Approved Leave Updates"
        open={approvedOpen}
        toggle={() => setApprovedOpen(!approvedOpen)}
      />

      {approvedOpen && (
        <Paper sx={{ p: 3, mt: 2, mb: 4 }}>

          {/* FILTER BAR */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>

            <TextField
              type="month"
              label="Select Month"
              InputLabelProps={{ shrink: true }}
              value={approvedMonth}
              onChange={(e) => {
                setApprovedMonth(e.target.value);
                setApprovedPage(0);
              }}
            />

            <TextField
              select
              label="Rows"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              sx={{ width: 120 }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </TextField>

          </Box>

          <Table size="small">

            <TableHead>
              <TableRow sx={{ background: "#1b5e20" }}>
                <TableCell sx={{ color: "white" }}>Name</TableCell>
                <TableCell sx={{ color: "white" }}>Group</TableCell>
                <TableCell sx={{ color: "white" }}>Leave Period</TableCell>
                <TableCell sx={{ color: "white" }}>Type</TableCell>
                <TableCell sx={{ color: "white" }}>SIC</TableCell>
                <TableCell sx={{ color: "white" }}>Dept</TableCell>
                <TableCell sx={{ color: "white" }}>Final</TableCell>
                <TableCell sx={{ color: "white" }}>Replacement</TableCell>
                <TableCell sx={{ color: "white" }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {paginatedApprovedLeaves.map((l) => (
                <TableRow key={l.id}>

                  <TableCell>{l.name}</TableCell>

                  <TableCell>{l.groupName}</TableCell>

                  <TableCell>
                    {dayjs(l.startDate).format("DD MMM")} → {dayjs(l.endDate).format("DD MMM")}
                  </TableCell>

                  <TableCell>{l.leaveType}</TableCell>

                  {/* SIC STATUS */}
                  <TableCell>
                    <Chip
                      label={l.sicApprovalStatus || "Pending"}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.sicApprovalStatus === "Forwarded"
                            ? "#1976d2"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* DEPT STATUS */}
                  <TableCell>
                    <Chip
                      label={l.deptApprovalStatus || "Pending"}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.deptApprovalStatus === "Approved"
                            ? "#2e7d32"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* FINAL STATUS */}
                  <TableCell>
                    <Chip
                      label={l.finalStatus}
                      size="small"
                      sx={{
                        backgroundColor:
                          l.finalStatus === "Approved"
                            ? "#2e7d32"
                            : l.finalStatus === "Rejected"
                            ? "#d32f2f"
                            : "#ed6c02",
                        color: "white"
                      }}
                    />
                  </TableCell>

                  {/* REPLACEMENT */}
                  <TableCell>
                    {l.replacement ? (
                      <Chip
                        label={l.replacement.name}
                        size="small"
                        color="success"
                      />
                    ) : l.replacementRequired ? (
                      <Chip
                        label="Required"
                        size="small"
                        color="error"
                      />
                    ) : (
                      <Chip
                        label="Not Required"
                        size="small"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    {isAdmin && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => superDeleteLeave(l.id)}
                      >
                        Super Delete
                      </Button>
                    )}
                  </TableCell>

                </TableRow>
              ))}

            </TableBody>

          </Table>

        </Paper>
      )}

      {/* UPCOMING LEAVE */}

      {/* UPCOMING LEAVE */}

    <SectionHeader
      title="Upcoming Leave (Next 5 Days)"
      open={upcomingOpen}
      toggle={() => setUpcomingOpen(!upcomingOpen)}
    />

    {upcomingOpen && (

      <Paper sx={{ p: 3, mt: 2 }}>

        <Table size="small">

          <TableHead>
            <TableRow sx={{ background: "#1b5e20" }}>
              <TableCell sx={{ color: "white" }}>Name</TableCell>
              <TableCell sx={{ color: "white" }}>Group</TableCell>
              <TableCell sx={{ color: "white" }}>Leave Period</TableCell>
              <TableCell sx={{ color: "white" }}>Type</TableCell>
              <TableCell sx={{ color: "white" }}>Status</TableCell>
              <TableCell sx={{ color: "white" }}>Replacement</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {upcomingLeaves.map((l) => (

              <TableRow key={l.id}>

                <TableCell>{l.name}</TableCell>

                <TableCell>{l.groupName}</TableCell>

                <TableCell>
                  {dayjs(l.startDate).format("DD MMM")} → {dayjs(l.endDate).format("DD MMM")}
                </TableCell>

                <TableCell>{l.leaveType}</TableCell>

                <TableCell>
                  <Chip
                    label={l.finalStatus}
                    size="small"
                    color={l.finalStatus === "Approved" ? "success" : "warning"}
                  />
                </TableCell>

                <TableCell>
                  {l.replacement ? (
                    <Chip
                      label={l.replacement.name}
                      size="small"
                      color="success"
                    />
                  ) : l.replacementRequired ? (
                    <Chip
                      label="Required"
                      size="small"
                      color="error"
                    />
                  ) : (
                    <Chip
                      label="Not Required"
                      size="small"
                    />
                  )}
                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    )}
      
      <Dialog
        open={forwardDialogOpen}
        onClose={() => setForwardDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >

        <DialogTitle
          sx={{
            background: "linear-gradient(135deg,#6a1b9a,#8e24aa)",
            color: "white",
            fontWeight: "bold"
          }}
        >
          SIC Forward Approval
        </DialogTitle>

        <DialogContent sx={{ mt:2 }}>

          <Typography variant="body1" sx={{ mb:2 }}>
            Does this leave require a replacement?
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={replacementRequired}
                onChange={(e)=>setReplacementRequired(e.target.checked)}
                color="error"
              />
            }
            label="Replacement Required"
          />

        </DialogContent>

        <DialogActions sx={{ pb:2, pr:3 }}>

          <Button
            onClick={()=>setForwardDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{ background:"#6a1b9a" }}
            onClick={confirmForward}
          >
            Confirm Forward
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}