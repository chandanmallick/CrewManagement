import React, { useState, useEffect } from "react";
import api from "../api/api";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Chip,
  Divider,
  Collapse,
  IconButton
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DatePicker from "react-multi-date-picker";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const Roster_API_URL = "http://localhost:8000/roster";
const Admin_API_URL = "http://localhost:8000/admin";

export default function DutyRoster() {

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rosterData, setRosterData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [groupMasterData, setGroupMasterData] = useState([]);
  const [signedBy, setSignedBy] = useState("");
  const [history, setHistory] = useState([]);
  const [loadedRosterId, setLoadedRosterId] = useState(null);
  const [isFinalLoaded, setIsFinalLoaded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [leaveAuthority, setLeaveAuthority] = useState(null);

  const DEFAULT_INSTRUCTIONS = `
1. Shift Timing: Morning Shift (08:30-14:30hrs), Evening Shift (14:30-20:30hrs), Night Shift (20:30-08:30hrs [Next day]).
2. Shri Debashis Mondal, Shri Akash Kumar Modi, Shri Sumanta Sadhukhan & Shri SSK Suman shall report to Control Room 15 minutes before the commencement of shift duty to note the salient status of the Grid from the previous shift and may leave 15 minutes before the scheduled time.
3. Shift In Charge of a group will assign different responsibilities to his team members. Every Shift-in-charge shall nominate one person from his sub-ordinates to look after the RTSD work. .
`;

  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [distribution, setDistribution] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection"
    }
  ]);

  useEffect(() => {
    fetchEmployees();
    fetchHistory();
    fetchGroupMaster();
  }, []);

  useEffect(() => {
    const loadPrevious = async () => {
      try {
        const res = await api.get("/roster/previous-final");

        setInstructions(res.data.instructions || "");
        setDistribution(res.data.distribution || "");
        setSignedBy(res.data.signedBy || null);
      } catch (err) {
        console.error(err);
      }
    };

    loadPrevious();
  }, []);

  const fetchEmployees = async () => {
    const res = await api.get(`/admin/employees`);
    setEmployees(res.data);
  };

  const deleteRoster = async (id) => {
    if (!window.confirm("Delete this draft roster?")) return;

    try {
      await api.delete(`/roster/${id}`);
      alert("Deleted successfully");
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const disableFinalSave = isFinalLoaded || !rosterData || rosterData.length === 0;

  const fetchHistory = async () => {
    const res = await api.get(`/roster/rosterhistory`);
    setHistory(res.data);
  };

  const FancyButton = ({ text, color, icon, onClick, disabled }) => {
    return (
      <Box
        onClick={!disabled ? onClick : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          width: 210,
          height: 42,
          borderRadius: "10px",
          overflow: "hidden",
          cursor: disabled ? "not-allowed" : "pointer",
          background: "#e0e0e0",
          boxShadow: "0 5px 10px rgba(0,0,0,0.2)",
          position: "relative",
          opacity: disabled ? 0.5 : 1   // 👈 greyed out
        }}
      >
        {/* Colored Left Part */}
        <Box
          sx={{
            flex: 1,
            height: "100%",
            background: disabled ? "#bdbdbd" : color,  // 👈 grey when disabled
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 13,
            letterSpacing: 1,
            zIndex: 2
          }}
        >
          {text}
        </Box>

        {/* White Icon Area */}
        <Box
          sx={{
            width: 60,
            height: "100%",
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1
          }}
        >
          {icon}
        </Box>

        {/* Curved Divider */}
        <Box
          sx={{
            position: "absolute",
            right: 60,
            width: 30,
            height: "100%",
            background: "#f5f5f5",
            borderRadius: "50%",
            transform: "translateX(50%)",
            zIndex: 1
          }}
        />
      </Box>
    );
  };
  

  const fetchGroupMaster = async () => {
    const res = await api.get(`/roster/group`);

    // ✅ Only active groups
    const activeGroups = res.data.filter(g => g.isActive);

    setGroupMasterData(activeGroups);
  };

  

  const generateRoster = async () => {
    const res = await api.post(`/roster/generate`, {
      startDate,
      endDate
    });
    setRosterData(res.data);
  };

  const confirmPush = (rosterId) => {
    if (window.confirm("Are you sure you want to push this roster to calendar?")) {
      handlePushToCalendar(rosterId);
    }
  };

  const handlePushToCalendar = async (rosterId) => {
    try {
      const res = await api.post(`/roster/push-to-calendar/${rosterId}`);

      alert(res.data.message || "Roster pushed successfully");

      fetchHistory();
    } catch (err) {
      if (err.response) {
        alert(err.response.data.detail || "Error pushing roster");
      } else {
        alert("Server error");
      }
    }
  };

  const saveRoster = async (makeFinal = false) => {
    try {
      const res = await api.post(`/roster/saveroster`, {
        rosterId: loadedRosterId,
        startDate,
        endDate,
        data: rosterData,
        instructions,
        signedBy,
        leaveAuthority,
        isFinal: makeFinal
      });

      if (!loadedRosterId && res.data.rosterId) {
        setLoadedRosterId(res.data.rosterId);
      }

      if (makeFinal) {
        setIsFinalLoaded(true);
      }

      fetchHistory();
      alert(makeFinal ? "Saved as Final" : "Draft Saved");


    } catch (err) {
      alert("Error saving roster");
    }
  };

  const loadRoster = async (id) => {
    const res = await api.get(`/roster/loadroster/${id}`);

    setStartDate(res.data.startDate);
    setEndDate(res.data.endDate);
    setRosterData(Array.isArray(res.data.data) ? res.data.data : []);
    setGroupMasterData(res.data.groupDetails || []);
    setInstructions(res.data.instructions || DEFAULT_INSTRUCTIONS);
    setSignedBy(res.data.signedBy || null);
    setLeaveAuthority(res.data.leaveAuthority || null);   // ✅ ADDED
    setLoadedRosterId(id);
    setIsFinalLoaded(res.data.isFinal);
  };

  const rosterButtonStyle = {
    borderRadius: "25px",
    padding: "8px 18px",
    fontWeight: "bold",
    textTransform: "none",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)"
  };

  const getDutyColor = (shift) => {
    if (shift?.startsWith("E")) return "#fff3e0";
    if (shift?.startsWith("M")) return "#e3f2fd";
    if (shift?.startsWith("N")) return "#f3e5f5";
    if (shift?.startsWith("O")) return "#e8f5e9";
    return "white";
  };

  const downloadPDF = async () => {
    const res = await api.post(`/roster/downloadpdf`,
      {
        startDate,
        endDate,
        data: rosterData,
        instructions,
        distribution,
        groupDetails: groupMasterData,
        signedBy: signedBy
      },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Duty_Roster.pdf");
    document.body.appendChild(link);
    link.click();
  };
  

  return (
    <Box sx={{ width: "100%" }}>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)",
          display: "flex",
          alignItems: "center",
          gap: 2
        }}
      >
        <CalendarMonthIcon
          sx={{
            fontSize: 40,
            color: "#1565c0",
            background: "#ffffff",
            borderRadius: "50%",
            padding: "8px",
            boxShadow: "0 3px 8px rgba(0,0,0,0.2)"
          }}
        />

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Duty Roster
          </Typography>

          <Typography variant="body2" sx={{ color: "#546e7a" }}>
            Generate and manage shift duties for control room staff
          </Typography>
        </Box>
      </Paper>

      {/* DATE + ACTION */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center" wrap="nowrap">

          {/* DATE RANGE PICKER */}
          <Grid item xs={4} md={4}>
            <DatePicker
              range
              value={
                startDate && endDate
                  ? [new Date(startDate), new Date(endDate)]
                  : []
              }
              onChange={(range) => {
                if (!range || range.length < 2) return;

                const [start, end] = range;

                setStartDate(dayjs(start.toDate()).format("YYYY-MM-DD"));
                setEndDate(dayjs(end.toDate()).format("YYYY-MM-DD"));
              }}
              format="YYYY-MM-DD"
              numberOfMonths={2}
              showOtherDays
              render={(value, openCalendar) => (
                <TextField
                  fullWidth
                  label="Select Date Range"
                  onClick={openCalendar}
                  value={
                    startDate && endDate
                      ? `${dayjs(startDate).format("DD MMM")} → ${dayjs(endDate).format("DD MMM")}`
                      : ""
                  }
                  InputProps={{
                    readOnly: true
                  }}
                />
              )}
            />
          </Grid>

          {/* BUTTONS */}
          <Grid item xs={8} md={9}>
            <Box sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap"
            }}>

              <FancyButton
                text="GENERATE"
                color="#3f51b5"
                icon={<ArrowForwardIosIcon />}
                onClick={generateRoster}
              />

              <FancyButton
                text="SAVE DRAFT"
                color="#ff9800"
                icon={<SaveIcon />}
                onClick={() => saveRoster(false)}
              />

              <FancyButton
                text="SAVE FINAL"
                color="#4caf50"
                icon={<SaveIcon />}
                onClick={() => saveRoster(true)}
                disabled={disableFinalSave}
              />

              <FancyButton
                text="DOWNLOAD"
                color="#9c27b0"
                icon={<DownloadIcon />}
                onClick={downloadPDF}
              />

            </Box>
          </Grid>

        </Grid>
      </Paper>

      {/* ROSTER TABLE */}
      {rosterData.length > 0 && (
        <Paper sx={{ overflowX: "auto", mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1b5e20" }}>
                <TableCell sx={{ color: "white" }}>Group</TableCell>
                {Object.keys(rosterData[0].data).map(date => (
                  <TableCell key={date} sx={{ color: "white" }}>
                    {dayjs(date).format("DD")}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rosterData.map(group => (
                <TableRow key={group.groupName}>
                  <TableCell>
                    <Chip label={group.groupName} size="small" color="success" />
                  </TableCell>
                  {Object.keys(group.data).map(date => (
                    <TableCell
                      key={date}
                      sx={{ backgroundColor: getDutyColor(group.data[date]) }}
                    >
                      {group.data[date]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* GROUP DETAILS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Group Details</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          {groupMasterData.sort((a, b) => {
            const numA = parseInt(a.groupName.replace("Group-", ""));
            const numB = parseInt(b.groupName.replace("Group-", ""));
            return numA - numB;
          }).map(group => (
            <Grid item xs={12} sm={6} md={3} key={group.id}>
              <Paper sx={{ p: 2, background: "#f1f8e9" }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {group.groupName}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Shift Incharge:
                </Typography>
                <Typography variant="body2">
                  {group.shiftInCharge?.name} 
                  ({group.shiftInCharge?.employeeId || group.shiftInCharge?.id})
                  - {group.shiftInCharge?.designation}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                  Subordinates:
                </Typography>

                {group.members?.map((m, i) => (
                  <Typography key={i} variant="caption" display="block">
                    • {m.name} ({m.employeeId || m.id}) - {m.designation}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* INSTRUCTIONS */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Special Instructions</Typography>
        <TextField
          multiline
          rows={3}
          fullWidth
          size="small"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </Paper>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3
        }}
      >

        {/* Distribution */}
        <Paper
          elevation={3}
          sx={{
            flex: 2,   // ← larger
            p: 2,
            borderRadius: 3,
            background: "linear-gradient(135deg,#ffe6e0,#fff3f0)"
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Distribution
          </Typography>

          <TextField
            multiline
            rows={4}
            fullWidth
            size="small"
            value={distribution}
            onChange={(e) => setDistribution(e.target.value)}
          />
        </Paper>

        {/* Signing Authority */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,   // ← smaller
            p: 2,
            borderRadius: 3,
            background: "#f7f9fc"
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Signing Authority
          </Typography>

          <Select
            value={signedBy?.employeeId || ""}
            fullWidth
            size="small"
            onChange={(e) => {
              const selectedEmp = employees.find(
                emp => (emp.employeeId || emp.id) === e.target.value
              );

              if (selectedEmp) {
                setSignedBy({
                  employeeId: selectedEmp.employeeId || selectedEmp.id,
                  name: selectedEmp.name,
                  nameHindi: selectedEmp.nameHindi,
                  designation: selectedEmp.designation,
                  designationHindi: selectedEmp.designationHindi
                });
              }
            }}
          >
            {employees.map(emp => (
              <MenuItem key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                {emp.name} - {emp.designation}
              </MenuItem>
            ))}
          </Select>
        </Paper>

        {/* Leave Approving Authority */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 3,
            background: "#f7f9fc"
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Leave Approving Authority
          </Typography>

          <Select
            value={leaveAuthority?.employeeId || ""}
            fullWidth
            size="small"
            onChange={(e) => {
              const selectedEmp = employees.find(
                emp => (emp.userId || emp.id) === e.target.value
              );

              if (selectedEmp) {
                setLeaveAuthority({
                  employeeId: selectedEmp.userId || selectedEmp.id,
                  name: selectedEmp.name,
                  designation: selectedEmp.designation
                });
              }
            }}
          >
            {employees.map(emp => (
              <MenuItem key={emp.userId || emp.id} value={emp.userId || emp.id}>
                {emp.name} - {emp.designation}
              </MenuItem>
            ))}
          </Select>
        </Paper>

      </Box>

      {/* HISTORY COLLAPSIBLE */}
      <Paper sx={{ mb: 3, borderRadius: 3 }}>

        {/* HEADER BAR */}
        <Box
          sx={{
            p: 2,
            borderRadius: "12px 12px 0 0",
            background: "linear-gradient(135deg,#e3f2fd,#f1f8e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonthIcon sx={{ color: "#1565c0" }} />

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Roster History
            </Typography>
          </Box>

          <IconButton onClick={() => setHistoryOpen(!historyOpen)}>
            {historyOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={historyOpen}>
          {history.map((h) => (
            <Box
              key={h.rosterId || h.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1,
                borderBottom: "1px solid #eee"
              }}
            >
              {/* Left Side Info */}
              <Box>
                <Typography variant="body2">
                  {h.startDate} → {h.endDate}
                </Typography>

                {h.isFinal && (
                  <Chip
                    label="Final"
                    size="small"
                    color="success"
                    sx={{ mt: 0.5 }}
                  />
                )}

                {h.calendarPushed && (
                  <Chip
                    label="Calendar Updated"
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5, ml: 1 }}
                  />
                )}
              </Box>

              {/* Right Side Actions */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => loadRoster(h.rosterId || h.id)}
                >
                  Load
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  color={h.isFinal ? "success" : "warning"}
                  disabled={h.calendarPushed}
                  onClick={() => confirmPush(h.rosterId || h.id)}
                >
                  {h.isFinal ? "Push Final to Calendar" : "Push Draft to Calendar"}
                </Button>

                {!h.isFinal && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => deleteRoster(h.id)}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Collapse>
      </Paper>

    </Box>
  );
}