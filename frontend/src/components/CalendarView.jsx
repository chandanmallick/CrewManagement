import React, { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Stack,
  Divider,
  CircularProgress
} from "@mui/material";

/* ✅ Correct Backend Base URL */

const CalendarView = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(2, "day"));
  const [endDate, setEndDate] = useState(dayjs().add(10, "day"));
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const ROW_SELECTION_COLOR = "#90CAF9";     // darker blue
  const COLUMN_SELECTION_COLOR = "#BBDEFB";  // medium blue

  /* ---------- Generate Date Columns ---------- */
  const dateColumns = useMemo(() => {
    let dates = [];
    let current = startDate.clone();

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      dates.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }

    return dates;
  }, [startDate, endDate]);

  /* ---------- Fetch Calendar Data ---------- */
  const fetchCalendar = async () => {
    try {
      setLoading(true);

      const res = await api.get("roster/calendar-view", {
        params: {
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD")
        }
      });

      setCalendarData(res.data || []);
    } catch (error) {
      console.error("Calendar fetch error:", error);
      setCalendarData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [startDate, endDate]);

  /* ---------- Shift Color ---------- */
  const getShiftColor = (shift, leaveStatus) => {

    if (leaveStatus === "Approved") return "#F8BBD0";
    if (leaveStatus === "Forwarded by SIC") return "#FFE0B2";
    if (leaveStatus === "Applied") return "#FFF9C4";

    switch (shift) {
      case "Morning":
        return "#E3F2FD";
      case "Evening":
        return "#FFF3E0";
      case "Night":
        return "#E8F5E9";
      case "OFF":
        return "#FFEBEE";
      default:
        return "#FFFFFF";
    }
  };

  const isToday = (date) =>
    dayjs(date).isSame(dayjs(), "day");

  return (
    <Box p={3}>
      {/* 🔥 Styled Header Section */}
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
              Daily Duty Calendar
            </Typography>
  
            <Typography variant="body2">
              Calender view of daily shift details
            </Typography>

            {/* Navigation Controls */}
            <Stack direction="row" spacing={2} mt={2}>
            <Button
                variant="contained"
                onClick={() => {
                setStartDate(prev => prev.subtract(7, "day"));
                setEndDate(prev => prev.subtract(7, "day"));
                }}
            >
                ◀ Previous 7 Days
            </Button>

            <Button
                variant="contained"
                onClick={() => {
                setStartDate(dayjs().subtract(7, "day"));
                setEndDate(dayjs().add(7, "day"));
                }}
            >
                Today
            </Button>

            <Button
                variant="contained"
                onClick={() => {
                setStartDate(prev => prev.add(7, "day"));
                setEndDate(prev => prev.add(7, "day"));
                }}
            >
                Next 7 Days ▶
            </Button>
            </Stack>

          </Box>
  
        </Paper>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper elevation={3} sx={{ overflowX: "auto", maxHeight: "70vh"}}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* Sticky Column */}
                <TableCell
                  sx={{
                    minWidth: 220,
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 3,
                    fontWeight: "bold"
                  }}
                >
                  Name / Designation
                </TableCell>

                {dateColumns.map((date) => (
                  <TableCell
                    key={date}
                    align="center"
                    onClick={() => setSelectedColumn(date)}
                    sx={{
                      minWidth: 100,
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      cursor: "pointer",
                      backgroundColor:
                        selectedColumn === date
                        ? "#64B5F6"
                        :isToday(date)
                        ? "#E1F5FE"
                        : "#f5f5f5",
                      fontWeight: "bold",
                      border: isToday(date)
                        ? "2px solid #0288D1"
                        : "1px solid #ddd"
                    }}
                  >
                    {dayjs(date).format("DD MMM")}
                    <br />
                    <Typography variant="caption">
                      {dayjs(date).format("ddd")}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {calendarData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={dateColumns.length + 1} align="center">
                    No Data Found
                  </TableCell>
                </TableRow>
              ) : (
                calendarData.map((group) => (
                  <React.Fragment key={group.groupName}>
                    {/* Group Header */}
                    <TableRow>
                      <TableCell
                        colSpan={dateColumns.length + 1}
                        sx={{
                          backgroundColor: "#eeeeee",
                          fontWeight: "bold"
                        }}
                      >
                        {group.groupName}
                      </TableCell>
                    </TableRow>

                    {/* Employees */}
                    {[...group.employees]
                    .sort((a, b) => (b.IsSIC === true ? 1 : 0) - (a.IsSIC === true ? 1 : 0))
                    .map((emp) => (
                        <TableRow
                        key={`${group.groupName}-${emp.employeeId}`}
                        onClick={() => setSelectedRow(emp.employeeId)}
                        sx={{
                            cursor: "pointer",
                            backgroundColor: selectedRow === emp.employeeId
                              ? ROW_SELECTION_COLOR
                              : emp.IsSIC
                              ? "#E3F2FD"
                              : "inherit"
                        }}
                        >
                        <TableCell
                            sx={{
                            minWidth: 220,
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                            background:
                              selectedRow === emp.employeeId
                                ? "#E3F2FD"
                                : emp.IsSIC
                                ? "#E3F2FD"
                                : "#fff"
                          }}
                        >
                            <Typography
                            fontWeight="bold"
                            color={emp.IsSIC ? "primary" : "inherit"}
                            >
                            {emp.name} {emp.IsSIC && " (SIC)"}
                            </Typography>

                            <Typography variant="caption">
                            {emp.designation}
                            </Typography>
                        </TableCell>

                        {dateColumns.map((date) => {
                            const duty = emp.duties?.[date];

                            const shift = duty?.shift || duty;
                            const leaveStatus = duty?.leaveStatus;
                            const leaveType = duty?.leaveType;
                            const replacementName = duty?.replacementEmployee?.name;

                            return (
                              <TableCell
                                key={date}
                                align="center"
                                sx={{
                                  backgroundColor:
                                    selectedRow === emp.employeeId
                                      ? ROW_SELECTION_COLOR
                                      : selectedColumn === date
                                      ? COLUMN_SELECTION_COLOR
                                      : getShiftColor(shift, leaveStatus),
                                  fontWeight: shift === "OFF" ? "bold" : "normal",
                                  border:
                                    selectedRow === emp.employeeId && selectedColumn === date
                                      ? "3px solid #0D47A1"
                                      : "1px solid #ddd"
                                }}
                              >
                                <Typography fontSize={13} fontWeight="bold">
                                  {shift || "-"}
                                </Typography>

                                {leaveStatus && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      color:
                                        leaveStatus === "Approved"
                                          ? "green"
                                          : leaveStatus === "Forwarded by SIC"
                                          ? "#ef6c00"
                                          : "#c62828",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    {leaveType} ({leaveStatus})
                                  </Typography>
                                )}

                                {replacementName && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      color: "#6a1b9a",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    Replaced by: {replacementName}
                                  </Typography>
                                )}
                              </TableCell>
                            );
                        })}
                        </TableRow>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default CalendarView;