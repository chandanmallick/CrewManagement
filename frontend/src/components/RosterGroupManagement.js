import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/api";
import dayjs from "dayjs";
import DatePicker from "react-multi-date-picker";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Collapse,
  Chip,
  MenuItem
} from "@mui/material";

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function RosterGroupManagement() {

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [employees, setEmployees] = useState([]);
  const [sic, setSic] = useState(null);
  const [members, setMembers] = useState([]);

  const [registeredGroups, setRegisteredGroups] = useState([]);

  const [entryOpen, setEntryOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    fetchEmployees();
    fetchRegisteredGroups();
  }, []);

  const fetchEmployees = async () => {
    const res = await api.get(`/admin/employees`);
    setEmployees(res.data);
  };

  const resetForm = () => {
    setGroupName("");
    setStartDate("");
    setEndDate("");
    setMembers([]);
    setSic(null);
    setEditingGroupId(null);
  };

  const startEdit = (group) => {
    setEditingGroupId(group.id);
    setGroupName(group.groupName);
    setStartDate(group.startDate);
    setEndDate(group.endDate || "");
    setMembers(group.members || []);
    setSic(group.shiftInCharge || null);
    setEntryOpen(true);
  };

  const fetchRegisteredGroups = async () => {
    const res = await api.get(`/roster/group`);
    const sorted = res.data.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );
    setRegisteredGroups(sorted);
  };

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {

  if (!groupName || !startDate || !sic) {
    alert("Fill required fields");
    return;
  }

  const payload = {
    groupName,
    startDate,
    endDate: endDate || null,
    members: members.map(m => ({
      employeeId: m.userId,
      name: m.name,
      designation: m.designation
    })),
    shiftInCharge: {
      employeeId: sic.userId,
      name: sic.name,
      designation: sic.designation
    }
  };

  if (editingGroupId) {
    await api.put(`/roster/group/update/${editingGroupId}`, payload);
    alert("Group updated");
  } else {
    await api.post(`/roster/group`, payload);
    alert("Group registered");
  }

  resetForm();
  fetchRegisteredGroups();
};

  /* ---------------- TOGGLE ACTIVE ---------------- */

  const toggleActive = async (id, isCurrentlyActive) => {

    const activeCount = registeredGroups.filter(g => g.isActive).length;

    if (!isCurrentlyActive && activeCount >= 4) {
      alert("Maximum 4 active groups allowed.");
      return;
    }

    await api.put(`/roster/group/toggle-status/${id}`);
    fetchRegisteredGroups();
  };

  return (
    <Box sx={{ width: "100%", px: 4 }}>

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
            Roster Group Management
          </Typography>

          <Typography variant="body2">
            Create and manage operational duty groups
          </Typography>
        </Box>

      </Paper>

      <Accordion defaultExpanded sx={{borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", mt: 4}}>

      <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{background: "linear-gradient(90deg,#6366f1,#818cf8)", color: "white", px:3}}
      >

      <Typography variant="h6">
      Register New Group
      </Typography>

      </AccordionSummary>

      <AccordionDetails>

      <Grid container spacing={3}>

      <Grid item xs={12} md={4}>

      <TextField
      select
      fullWidth
      label="Select Group"
      value={groupName}
      onChange={(e) => setGroupName(e.target.value)}
      sx={{ minWidth:300 }}
      >

      <MenuItem value="Group-1">Group-1</MenuItem>
      <MenuItem value="Group-2">Group-2</MenuItem>
      <MenuItem value="Group-3">Group-3</MenuItem>
      <MenuItem value="Group-4">Group-4</MenuItem>

      </TextField>

      </Grid>

      <Grid item xs={12} md={4}>

      <DatePicker
        range
        portal   // ✅ VERY IMPORTANT
        style={{ zIndex: 9999 }}
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
            label="Select Group Date Range"
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

      <Grid item xs={12} md={8}>

      <Autocomplete
      fullWidth
      options={employees}
      getOptionLabel={(option)=>`${option.name} - ${option.designation}`}
      value={sic}
      onChange={(e,newValue)=>setSic(newValue)}
      renderInput={(params)=>(<TextField {...params} label="Select SIC" />)}
      />

      </Grid>

      <Grid item xs={12} md={12}>

      <Autocomplete
      multiple
      fullWidth
      options={employees}
      getOptionLabel={(option)=>`${option.name} - ${option.designation}`}
      value={members}
      onChange={(e,newValue)=>setMembers(newValue)}
      renderInput={(params)=>(<TextField {...params} label="Add Members" />)}
      />

      </Grid>

      <Grid item xs={12}>

      <Button
      variant="contained"
      size="large"
      onClick={handleSave}
      >
      Register Group
      </Button>

      </Grid>

      </Grid>

      </AccordionDetails>

    </Accordion>

    <Accordion defaultExpanded  sx={{borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", mb: 4}}>
      

      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{background: "linear-gradient(90deg,#10b981,#34d399)", color: "white", px: 3}}>
      
      <Typography variant="h6">
      Registered Groups
      </Typography>

      </AccordionSummary>

      <AccordionDetails>

      <TableContainer sx={{ mt:2 }}>

      <Table>

      <TableHead>

      <TableRow sx={{ backgroundColor:"#1b5e20" }}>

      <TableCell sx={{ color:"white",fontWeight:"bold" }}>Group</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>Start Date</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>End Date</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>SIC</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>Members</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>Status</TableCell>
      <TableCell sx={{ color:"white",fontWeight:"bold" }}>Action</TableCell>

      </TableRow>

      </TableHead>

      <TableBody>

      {registeredGroups.map((group)=>(

      <TableRow
      key={group.id}
      sx={{
      backgroundColor:group.isActive ? "#e8f5e9" : "inherit",
      transition:"0.3s"
      }}
      >

      <TableCell>{group.groupName}</TableCell>
      <TableCell>{group.startDate}</TableCell>
      <TableCell>{group.endDate || "-"}</TableCell>

      <TableCell>

      {group.shiftInCharge
      ? `${group.shiftInCharge.name} (${group.shiftInCharge.designation})`
      : "-"}

      </TableCell>

      <TableCell>

      <Box sx={{ display:"flex",flexWrap:"wrap",gap:1 }}>

      {group.members?.length > 0
      ? group.members.map((m,index)=>(
      <Chip
      key={index}
      label={`${m.name} (${m.designation})`}
      size="small"
      color="primary"
      variant="outlined"
      />
      ))
      : "-"}

      </Box>

      </TableCell>

      <TableCell>

      <Chip
      label={group.isActive ? "Active":"Inactive"}
      color={group.isActive ? "success":"default"}
      size="small"
      />

      </TableCell>

      <TableCell>

      <Button
      size="small"
      variant="contained"
      color={group.isActive ? "warning":"success"}
      onClick={()=>toggleActive(group.id,group.isActive)}
      >
      {group.isActive ? "Deactivate":"Activate"}
      </Button>

      <Button
      size="small"
      variant="outlined"
      sx={{ ml:1 }}
      onClick={()=>startEdit(group)}
      >
      Edit
      </Button>

      </TableCell>

      </TableRow>

      ))}

      </TableBody>

      </Table>

      </TableContainer>

      </AccordionDetails>

    </Accordion>


    </Box>
  );
}