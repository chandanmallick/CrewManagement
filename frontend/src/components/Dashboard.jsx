import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../api/api";
import ReactApexChart from "react-apexcharts";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5xy from "@amcharts/amcharts5/xy";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Divider,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";

export default function Dashboard() {

  // ================= STATE =================
  const navigate = useNavigate();

  const [employee, setEmployee] = useState("")
  const [kpiYear, setKpiYear] = useState(new Date().getFullYear())
  const [kpiMonth, setKpiMonth] = useState(new Date().getMonth() + 1)
  const [kpiMode, setKpiMode] = useState("month")

  const [leaveAnalytics, setLeaveAnalytics] = useState({})
  const [replacementAnalytics, setReplacementAnalytics] = useState({})
  const [trend, setTrend] = useState([])
  const [groupData, setGroupData] = useState([])
  const [employeeStats, setEmployeeStats] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [leaveData, setLeaveData] = useState([])

  const [notifications, setNotifications] = useState([]);
  const [denyDialog, setDenyDialog] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [denyReason, setDenyReason] = useState("");
  const [topReplacement, setTopReplacement] = useState([]);
  const [generalNotifications, setGeneralNotifications] = useState([]);
  

  const [duty,setDuty] = useState({
    today: { Morning: [], Evening: [], Night: [] },
    tomorrow: { Morning: [], Evening: [], Night: [] }
  })

  // ================= API =================

  const fetchAll = async () => {

    try {

      const params = {
        year: kpiYear,
        month: kpiMode === "month" ? kpiMonth : undefined,
        employeeId: employee || undefined
      }

      const [
        leaveRes,
        replaceRes,
        trendRes,
        groupRes,
        empRes,
        empListRes,
        leaveListRes,
        dutyRes,
        topRes   // 🔥 NEW
      ] = await Promise.all([

        api.get("/dashboard/analytics/leave", { params }),
        api.get("/dashboard/analytics/replacement", { params }),
        api.get("/dashboard/analytics/leave-trend", { params: { year: kpiYear }}),
        api.get("/dashboard/analytics/group-wise", { params }),
        api.get("/dashboard/analytics/leave", { params }),
        api.get("/leave/employees"),
        api.get("/dashboard/leave-next-2-days"),
        api.get("/dashboard/duty-today-tomorrow"),
        api.get("/dashboard/top-replacements")   // 🔥 NEW API

      ])

      // ================= STATE SET =================

      setLeaveAnalytics(leaveRes.data || {})
      setReplacementAnalytics(replaceRes.data || {})
      setTrend(trendRes.data || [])
      setGroupData(groupRes.data || [])

      setEmployeeStats([
        { name: employee || "All Employees", count: empRes.data.leaveCount || 0 }
      ])

      setEmployeeList(empListRes.data || [])
      setLeaveData(leaveListRes.data.data || [])
      setDuty(dutyRes.data || {})

      setTopReplacement(topRes.data || [])  // 🔥 NEW STATE

    } catch (err) {console.error("Dashboard fetch error:", err)}
  }

  useEffect(() => {
    fetchAll()
  }, [kpiYear, kpiMonth, kpiMode, employee])


  const fetchNotifications = async () => {
    try {
      const res = await api.get("/replacement/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGeneralNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setGeneralNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGeneralNotifications();
  }, []);

  useEffect(() => {

    fetchNotifications();
    fetchGeneralNotifications();   // 🔥 ADD THIS

    const interval = setInterval(() => {
      fetchNotifications();
      fetchGeneralNotifications();
    }, 30000); // every 30 sec

    return () => clearInterval(interval);

  }, []);

  // ================= HELPERS =================

  const groupedEmployees = employeeList.reduce((acc, emp) => {
    if (!acc[emp.groupName]) acc[emp.groupName] = []
    acc[emp.groupName].push(emp)
    return acc
  }, {})

  const groupChartOptions = {
    chart: { toolbar: { show: false }},
    xaxis: {
      categories: groupData.map(g => g.group)
    },
    colors: ["#6a11cb"]
  };

  const groupChartSeries = [
    {
      name: "Leaves",
      data: groupData.map(g => g.count)
    }
  ];

  const trendChartOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    colors: ["#ff758c"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        opacityFrom: 0.7,
        opacityTo: 0.05
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trend.map(t => t.month)
    }
  };

  const miniChartOptions = {
    chart: {
      type: "area",
      toolbar: { show: false }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    colors: ["#ffffff"],
    fill: {type: "gradient", gradient: {opacityFrom: 0.9, opacityTo: 0.2}},
    dataLabels: { enabled: false },

    xaxis: {
      categories: trend.map(t => t.month),
      labels: {
        style: { colors: "#fff" }
      }
    },

    tooltip: {enabled: true, theme: "dark", y: {formatter: (val) => `${val} Leaves`}},

    markers: {size: 4, hover: {size: 7}}
  };

  const miniChartSeries = [
    {
      data: trend.map(t => t.leave) // or static demo [10,20,15,30,...]
    }
  ];

  const trendChartSeries = [
    {
      name: "Leaves",
      data: trend.map(t => t.leave)
    }
  ];

  const renderShift = (title, data = []) => (
    <Box sx={{ mb:2 }}>
      <Typography fontWeight="bold" sx={{ mb:1 }}>{title}</Typography>

      <Box sx={{ display:"flex", flexWrap:"wrap", gap:1 }}>
        {data.map((p,i)=>(
          <Chip
            key={i}
            label={
              p.isSIC
                ? `⭐ ${p.name}`
                : p.name
            }
            sx={{
              background: p.isSIC
                ? "linear-gradient(135deg,#1976d2,#42a5f5)"
                : "#f1f3f9",
              color: p.isSIC ? "#fff" : "#000",
              fontWeight: p.isSIC ? "bold" : "normal"
            }}
          />
        ))}
      </Box>
    </Box>
  )

  


  //+========= Donout ======

  const GroupDonutChart = ({ data }) => {

    const chartRef = React.useRef(null);

    useEffect(() => {

      if (!data || data.length === 0) return;

      const root = am5.Root.new(chartRef.current);

      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
          layout: root.verticalLayout,
          innerRadius: am5.percent(60), // slightly more hollow
          radius: am5.percent(80)       // 🔥 smaller donut
        })
      );

      const series = chart.series.push(
        am5percent.PieSeries.new(root, {
          valueField: "value",
          categoryField: "category",
          alignLabels: true
        })
      );

      // 🔥 DATA MAPPING
      const chartData = data.map(d => ({
        category: d.group,
        value: d.count
      }));

      series.data.setAll(chartData);

      // 🔥 LABELS AROUND
      series.labels.template.setAll({
        text: "{category}: {value} ({valuePercentTotal.formatNumber('#.0')}%)",
        fontSize: 10,
        radius: 10
      });

      series.slices.template.setAll({
        tooltipText: "{category}: {value} ({valuePercentTotal.formatNumber('#.0')}%)"
      });

      // 🔥 LEGEND
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          layout: root.horizontalLayout
        })
      );

      legend.data.setAll(series.dataItems);

      chart.children.push(
        am5.Label.new(root, {
          text: `Total\n${data.reduce((a,b)=>a+b.count,0)}`,
          centerX: am5.percent(50),
          centerY: am5.percent(50),
          textAlign: "center",
          fontSize: 16,
          fontWeight: "bold"
        })
      );

      // 🔥 ANIMATION
      series.appear(1000, 100);

      return () => {
        root.dispose();
      };

    }, [data]);

    return (
      <div
        ref={chartRef}
        style={{ width: "100%", height: "500px" }}
      />
    );
  };


  //+========= Replacment chart ======


  const ReplacementBarChart = ({ data }) => {

    const ref = React.useRef(null);

    useEffect(() => {

      if (!data || data.length === 0) return;

      const root = am5.Root.new(ref.current);

      root.setThemes([am5themes_Animated.new(root)]);

      // =========================
      // CHART
      // =========================
      const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          layout: root.verticalLayout,
          paddingLeft: 0
        })
      );

      // =========================
      // Y AXIS (Names)
      // =========================
      const yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: "name",
          renderer: am5xy.AxisRendererY.new(root, {
            inversed: true
          })
        })
      );

      const formattedData = topReplacement.map(emp => ({
        ...emp,
        image: emp.image
          ? `http://localhost:8000${emp.image}`
          : "/default-avatar.png"
      }));

      yAxis.data.setAll(data);

      yAxis.get("renderer").grid.template.setAll({
        visible: false
      });

      yAxis.get("renderer").ticks.template.setAll({
        visible: false
      });

      yAxis.get("renderer").labels.template.setAll({
        fontSize: 13,
        paddingRight: 10
      });

      // =========================
      // X AXIS (Values)
      // =========================
      const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererX.new(root, {})
        })
      );

      xAxis.get("renderer").grid.template.setAll({
        strokeOpacity: 0.05
      });

      // =========================
      // SERIES
      // =========================
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          xAxis,
          yAxis,
          valueXField: "value",
          categoryYField: "name"
        })
      );

      series.data.setAll(data);

      // =========================
      // BAR STYLE (ROUNDED)
      // =========================
      series.columns.template.setAll({
        height: 35,
        cornerRadiusTR: 20,
        cornerRadiusBR: 20,
        strokeOpacity: 0
      });

      // =========================
      // COLOR GRADIENT
      // =========================
      series.columns.template.adapters.add("fill", function(fill, target) {
        const value = target.dataItem.dataContext.value;

        if (value > 20) return am5.color(0x66bb6a);   // green
        if (value > 10) return am5.color(0xc0ca33);   // yellow-green
        return am5.color(0xffeb3b);                  // yellow
      });

      // =========================
      // AVATAR BULLET (LEFT)
      // =========================
      series.bullets.push((root, series, dataItem) => {

        const container = am5.Container.new(root, {});

        container.children.push(
          am5.Circle.new(root, {
            radius: 18,
            fill: am5.color(0xffffff),
            stroke: am5.color(0x8bc34a),
            strokeWidth: 4
          })
        );

        container.children.push(
          am5.Picture.new(root, {
            width: 30,
            height: 30,
            centerX: am5.p50,
            centerY: am5.p50,
            src: dataItem.dataContext.image
          })
        );

        return am5.Bullet.new(root, {
          locationX: 0,
          sprite: container
        });
      });

      // =========================
      // VALUE LABEL (RIGHT)
      // =========================
      series.bullets.push((root, series, dataItem) => {

        return am5.Bullet.new(root, {
          locationX: 1,
          sprite: am5.Label.new(root, {
            text: "{valueX}",
            populateText: true,
            centerY: am5.p50,
            dx: 20,
            fontSize: 12,
            fill: am5.color(0x607d8b)
          })
        });
      });

      // =========================
      // HOVER ANIMATION
      // =========================
      series.columns.template.events.on("pointerover", function(ev) {
        const dataItem = ev.target.dataItem;

        if (dataItem.bullets && dataItem.bullets.length > 0) {
          dataItem.bullets[0].animate({
            key: "locationX",
            to: 1,
            duration: 800,
            easing: am5.ease.out(am5.ease.cubic)
          });
        }
      });

      series.columns.template.events.on("pointerout", function(ev) {
        const dataItem = ev.target.dataItem;

        if (dataItem.bullets && dataItem.bullets.length > 0) {
          dataItem.bullets[0].animate({
            key: "locationX",
            to: 0,
            duration: 800
          });
        }
      });

      // =========================
      // ANIMATION
      // =========================
      series.appear(1000);

      return () => root.dispose();

    }, [data]);

    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          height: "300px"
        }}
      />
    );
  };

  // ================= UI =================

  return (
    <Box sx={{ p:3, background:"#eef1f7", minHeight:"100vh" }}>

      <Grid container spacing={3}>

        {/* LEFT */}
        <Grid item xs={12} md={3}>

          {/* LEAVE KPI */}
          <Paper sx={{
            p:2,
            mb:2,
            borderRadius:3,
            background:"linear-gradient(135deg,#ff9a9e,#fad0c4)",
            boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
          }}>
            <Box sx={{ display:"flex", justifyContent:"space-between" }}>
              <Typography variant="caption">Leaves</Typography>

              <Select size="small" value={kpiMode} onChange={(e)=>setKpiMode(e.target.value)}>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </Box>

            <Typography variant="h4">{leaveAnalytics.leaveCount || 0}</Typography>

            <Box sx={{ display:"flex", gap:1 }}>
              <Select size="small" value={kpiYear} onChange={(e)=>setKpiYear(e.target.value)}>
                {[2024,2025,2026].map(y=><MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>

              {kpiMode === "month" && (
                <Select size="small" value={kpiMonth} onChange={(e)=>setKpiMonth(e.target.value)}>
                  {[...Array(12)].map((_,i)=><MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>)}
                </Select>
              )}
            </Box>
          </Paper>

          {/* REPLACEMENT */}
          <Paper sx={{
            p:2,
            mb:2,
            borderRadius:3,
            background:"linear-gradient(135deg,#a18cd1,#fbc2eb)",
            boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
          }}>
            <Typography variant="caption">Replacements</Typography>
            <Typography variant="h4">{replacementAnalytics.replacementCount || 0}</Typography>
          </Paper>

          {/* GROUP CHART */}
          <Paper sx={{ p:2, borderRadius:3, mb:2 }}>
            <Typography fontWeight="bold">Group-wise Leave</Typography>
            <GroupDonutChart data={groupData} />
          </Paper>

          <Paper sx={{
            p:2,
            borderRadius:3,
            mb:2,
            background:
              notifications.length === 0
                ? "#e0e0e0"                         // Grey (no data)
                : notifications.some(n => n.status === "Pending")
                  ? "linear-gradient(135deg,#ff9800,#ff5722)"   // Orange (new)
                  : "linear-gradient(135deg,#43a047,#66bb6a)",   // Green (accepted)
            color: notifications.length === 0 ? "#000" : "#fff"
          }}>

            <Typography fontWeight="bold" mb={1}>
              My Assigned Duties
            </Typography>

            {notifications.length === 0 && (
              <Typography variant="body2">
                No pending assignments
              </Typography>
            )}

            {notifications.map(n => (

              <Box key={n._id} sx={{
                background:"rgba(255,255,255,0.15)",
                p:1.5,
                borderRadius:2,
                mb:1
              }}>

                <Typography fontWeight="bold">
                  {n.date}
                </Typography>

                <Typography variant="body2">
                  Shift: {n.assignedDuty || "-"}
                </Typography>

                <Typography variant="caption">
                  Status: {n.status}
                </Typography>

                <Typography variant="caption" display="block">
                  Deny allowed till: {dayjs(n.cutoffTime).format("DD MMM HH:mm")}
                </Typography>

                <Box sx={{ mt:1, display:"flex", gap:1 }}>

                  {/* ACCEPT */}
                  {n.status === "Pending" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={async ()=>{
                        await api.put(`/replacement/notifications/accept/${n._id}`);
                        fetchNotifications();
                      }}
                    >
                      Accept
                    </Button>
                  )}

                  {/* DENY */}
                  {n.canDeny ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={()=>{
                        setSelectedNotif(n);
                        setDenyDialog(true);
                      }}
                    >
                      Deny
                    </Button>
                  ) : (
                    <Chip
                      label="Locked"
                      size="small"
                      color="success"
                    />
                  )}

                </Box>

              </Box>

            ))}

          </Paper>

          <Paper sx={{ p:2, borderRadius:3, mt:2 }}>
            <Typography fontWeight="bold" mb={1}>
              System Notifications
            </Typography>

            {generalNotifications.map(n => (

              <Box
                key={n._id}
                sx={{
                  p:1.2,
                  mb:1,
                  borderRadius:2,
                  background:
                    n.status === "Unread"
                      ? "#e8f5e9"
                      : "#f5f5f5",
                  cursor:"pointer"
                }}
                onClick={async () => {

                  await api.put(`/notifications/read/${n._id}`);

                  if (n.action === "VIEW_LEAVE") {
                    navigate(`/leave/${n.refId}`);
                  }

                  fetchGeneralNotifications();
                }}
              >

                <Typography fontWeight="bold">{n.title}</Typography>
                <Typography variant="caption">{n.message}</Typography>

              </Box>

            ))}

          </Paper>

          <Dialog open={denyDialog} onClose={()=>setDenyDialog(false)}>

            <DialogTitle>Deny Duty</DialogTitle>

            <DialogContent>

              <Typography mb={1}>
                Date: {selectedNotif?.date}
              </Typography>

              <TextField
                fullWidth
                label="Reason"
                value={denyReason}
                onChange={(e)=>setDenyReason(e.target.value)}
              />

            </DialogContent>

            <DialogActions>

              <Button onClick={()=>setDenyDialog(false)}>
                Cancel
              </Button>

              <Button
                color="error"
                variant="contained"
                onClick={async ()=>{
                  await api.put(`/replacement/notifications/deny/${selectedNotif._id}`, {
                    reason: denyReason
                  });

                  setDenyDialog(false);
                  setDenyReason("");
                  fetchNotifications();
                }}
              >
                Confirm Deny
              </Button>

            </DialogActions>

          </Dialog>

        </Grid>


        {/* MIDDLE Left*/}
        <Grid item xs={12} md={3}>

          <Paper sx={{ p:2, mb:2, borderRadius:3, background:"#ffe082" }}>
            <Typography fontWeight="bold">Today Duty</Typography>
            {renderShift("Morning", duty.today?.Morning)}
            {renderShift("Evening", duty.today?.Evening)}
            {renderShift("Night", duty.today?.Night)}
          </Paper>

          <Paper sx={{ p:2, borderRadius:3, background:"#ffd54f" }}>
            <Typography fontWeight="bold">Tomorrow Duty</Typography>
            {renderShift("Morning", duty.tomorrow?.Morning)}
            {renderShift("Evening", duty.tomorrow?.Evening)}
            {renderShift("Night", duty.tomorrow?.Night)}
          </Paper>

        </Grid>


        {/* MIDDLE RIGHT */}
        <Grid item xs={32} md={3}>

          {/* TREND */}
          <Paper sx={{
            p:2.5,
            mb:2,
            borderRadius:4,
            color:"#fff",
            position:"relative",
            overflow:"hidden",
            height:180,
            background:"linear-gradient(135deg,#6a11cb,#2575fc)" // 🔥 gradient bg
          }}>

            {/* TEXT */}
            <Typography variant="caption">Leave Trend</Typography>
            <Typography variant="h5" fontWeight="bold">
              {leaveAnalytics.leaveCount || 0}
            </Typography>

            {/* GRAPH */}
            <Box sx={{
              position:"absolute",
              bottom:0,
              left:0,
              right:0,
              opacity:0.6
            }}>
              <ReactApexChart
                options={miniChartOptions}
                series={miniChartSeries}
                type="area"
                height={140}
              />
            </Box>

          </Paper>

          {/* EMPLOYEE */}
          <Paper sx={{ p:2, mb:2, borderRadius:3, background:"#a18cd1", boxShadow:"0 10px 25px rgba(0,0,0,0.08)" }}>
            <Box sx={{ display:"flex", justifyContent:"space-between" }}>
              <Typography fontWeight="bold">Employee Leave</Typography>

              <Select size="small" value={employee} onChange={(e)=>setEmployee(e.target.value)}>
                <MenuItem value="">All</MenuItem>

                {Object.keys(groupedEmployees).map(group => ([
                  <MenuItem key={group} disabled>{group}</MenuItem>,
                  groupedEmployees[group].map(emp=>(
                    <MenuItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.name}
                    </MenuItem>
                  ))
                ]))}
              </Select>
            </Box>

            {employeeStats.map((e,i)=>(
              <Box key={i} sx={{
                display:"flex",
                justifyContent:"space-between",
                mt:2,
                p:1.5,
                borderRadius:2,
                background:"#f1f3f9"
              }}>
                <Typography>{e.name}</Typography>
                <Typography fontWeight="bold">{e.count}</Typography>
              </Box>
            ))}
          </Paper>

          {/* UPCOMING */}
          <Paper sx={{ p:2, borderRadius:3 }}>
            <Typography fontWeight="bold">Upcoming Leave</Typography>
            <Divider sx={{ my:1 }}/>

            {leaveData.map((l,i)=>(
              <Box key={i} sx={{
                display:"flex",
                justifyContent:"space-between",
                p:1.5,
                mb:1,
                borderRadius:2,
                background:"#f9fbff"
              }}>
                <Box>
                  <Typography fontWeight="bold">{l.employeeName}</Typography>
                  <Typography variant="caption">{l.date}</Typography>
                </Box>
                <Chip label={l.replacementName || "Pending"} size="small"/>
              </Box>
            ))}
          </Paper>

        </Grid>

        {/* RIGHT */}

        <Grid item xs={12} md={3}>

          <Paper sx={{ p:2, borderRadius:3 }}>

            <Typography fontWeight="bold" mb={1}>
              Top Replacement Load (60 Days)
            </Typography>

            <ReplacementBarChart data={topReplacement} />

          </Paper>

        </Grid>

      </Grid>

    </Box>
  )
}