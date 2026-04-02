import React, { useEffect, useState } from "react";
import api from "../api/api";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";
import ShiftTimeline from "./ShiftTimeline";

export default function Profile(){

const employeeId = localStorage.getItem("employeeId")

const [profile,setProfile] = useState({})
const [photo,setPhoto] = useState(null)

const [dutyStats,setDutyStats] = useState([])
const [leaveStats,setLeaveStats] = useState([])
const [trainingStats,setTrainingStats] = useState([])

const [month,setMonth] = useState(new Date().getMonth()+1)
const [year,setYear] = useState(new Date().getFullYear())
const [leaveYear,setLeaveYear] = useState(new Date().getFullYear())
const [fy,setFy] = useState("2025-26")
const [coffStats, setCoffStats] = useState({ summary: {}, details: [] })
const [openCoff, setOpenCoff] = useState(false)
const [loginHistory, setLoginHistory] = useState([])
const [timelineData, setTimelineData] = useState([]);
const [openLogin, setOpenLogin] = useState(false);


useEffect(()=>{

fetchProfile()
fetchDutyStats()
fetchLeaveStats()
fetchTrainingStats()
fetchCoffStats()
fetchLoginHistory()
fetchTimeline()
},[])

const fetchProfile = async ()=>{

const res = await api.get(`/profile/profile/${employeeId}`)
setProfile(res.data)

}

const fetchDutyStats = async ()=>{

const res = await api.get(`/profile/stats/duty`,{
params:{employeeId,year,month}
})

setDutyStats(res.data.stats)

}

const fetchLeaveStats = async ()=>{

const res = await api.get(`/profile/stats/leave`,{
params:{employeeId,year:leaveYear}
})

setLeaveStats(res.data.stats)

}

const fetchLoginHistory = async () => {
  const res = await api.get(`/auth/login-history/${employeeId}`)
  setLoginHistory(res.data)
}

const fetchTimeline = async () => {

  const res = await api.get(`/roster/shift-history/${employeeId}`);

  const formatted = res.data.map(r => ({
    group: r.groupName,
    start: new Date(r.startDate).getTime(),
    end: r.endDate
      ? new Date(r.endDate).getTime()
      : new Date().getTime(),
    startDate: r.startDate,
    endDate: r.endDate || "Present"
  }));

  setTimelineData(formatted);
};

const fetchTrainingStats = async ()=>{

const res = await api.get(`/profile/stats/training`,{
params:{employeeId,financialYear:fy}
})

setTrainingStats(res.data.stats)

}

const fetchCoffStats = async () => {

  const res = await api.get(`/profile/stats/coff`, {
    params: { employeeId }
  })

  setCoffStats(res.data)
}

const handleSave = async ()=>{

try{

const formData = new FormData()

formData.append("employeeId",employeeId)
formData.append("nameHindi",profile.nameHindi || "")
formData.append("phone",profile.phone || "")

if (photo instanceof File) {
  formData.append("photo", photo);
} else {
  console.log("No photo selected or invalid");
}

const res = await api.post("/profile/profile/update", formData, {
  headers: {
    "Content-Type": "multipart/form-data"
  }
});

setProfile(res.data);

}catch(err){

console.error(err)
alert("Update failed")
console.log("PHOTO STATE:", photo);

}

}

return(

<Box sx={{p:3}}>

{/* PROFILE SUMMARY BANNER */}

<Paper
sx={{
p:4,
mb:3,
borderRadius:4,
background:"linear-gradient(135deg,#1e3c72,#2a5298)",
color:"white"
}}
>

<Grid container spacing={3} alignItems="center">

{/* Profile Photo */}

<Grid item>
<Avatar
src={
photo
? URL.createObjectURL(photo)
: profile.profilePhoto
? `http://localhost:8000${profile.profilePhoto}`
: ""
}
sx={{
width:90,
height:90,
border:"3px solid white"
}}
/>
</Grid>

{/* Name + Designation */}

<Grid item xs={12} md={3}>

<Typography variant="h5" fontWeight="bold">
{profile.name || "-"}
</Typography>

<Typography>
{profile.designation || "-"}
</Typography>

<Button
variant="contained"
component="label"
sx={{mt:1,background:"#00c6ff"}}
>
Upload Photo
<input
hidden
type="file"
accept="image/*"
onChange={async (e) => {

  const file = e.target.files[0];
  setPhoto(file);

  const formData = new FormData();
  formData.append("employeeId", employeeId);
  formData.append("photo", file);

  await api.post("/profile/update", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  fetchProfile();
}}
/>
</Button>

</Grid>

{/* Phone */}

<Grid item xs={12} md={2}>

<TextField
label="Phone"
variant="filled"
fullWidth
value={profile.phone || ""}
onChange={(e)=>
setProfile({...profile,phone:e.target.value})
}
sx={{background:"white",borderRadius:1}}
/>

</Grid>

{/* Hindi Name */}

<Grid item xs={12} md={3}>

<TextField
label="Name (Hindi)"
variant="filled"
fullWidth
value={profile.nameHindi || ""}
onChange={(e)=>
setProfile({...profile,nameHindi:e.target.value})
}
sx={{background:"white",borderRadius:1}}
/>

</Grid>

{/* Update Button */}

<Grid item xs={12} md={2}>

<Button
variant="contained"
color="success"
sx={{height:"56px"}}
fullWidth
onClick={handleSave}
>
Update Profile
</Button>

</Grid>

</Grid>

</Paper>


{/* STAT CARDS */}

<Grid container spacing={3}>

{/* DUTY CARD */}

<Grid item xs={12} md={4}>

<Paper
sx={{
p:3,
borderRadius:4,
background:"#e3f2fd"
}}
>

<Typography variant="h6">
Duty Statistics
</Typography>

<Divider sx={{my:1}}/>

<Box sx={{display:"flex",gap:1,mb:2}}>

<TextField
select
size="small"
label="Month"
value={month}
onChange={(e)=>setMonth(e.target.value)}
>
{[...Array(12)].map((_,i)=>(
<MenuItem key={i+1} value={i+1}>
{i+1}
</MenuItem>
))}
</TextField>

<TextField
select
size="small"
label="Year"
value={year}
onChange={(e)=>setYear(e.target.value)}
>

{[2023,2024,2025,2026,2027].map(y=>(
<MenuItem key={y} value={y}>{y}</MenuItem>
))}

</TextField>

<Button variant="contained"
onClick={fetchDutyStats}
>
Load
</Button>

</Box>

{dutyStats.length === 0 ? (
<Typography>No duty data</Typography>
) : (
dutyStats.map((s,i)=>(
<Typography key={i}>
{s._id} : {s.count}
</Typography>
))
)}

</Paper>

</Grid>


{/* LEAVE CARD */}

<Grid item xs={12} md={4}>

<Paper
sx={{
p:3,
borderRadius:4,
background:"#e8f5e9"
}}
>

<Typography variant="h6">
Leave Statistics
</Typography>

<Divider sx={{my:1}}/>

<Box sx={{display:"flex",gap:1,mb:2}}>

<TextField
size="small"
label="Year"
value={leaveYear}
onChange={(e)=>setLeaveYear(e.target.value)}
/>

<Button variant="contained"
onClick={fetchLeaveStats}
>
Load
</Button>

</Box>

{leaveStats.map((s,i)=>(
<Typography key={i}>
{s._id} : {s.count}
</Typography>
))}

</Paper>

</Grid>


{/* TRAINING CARD */}

<Grid item xs={12} md={4}>

<Paper
sx={{
p:3,
borderRadius:4,
background:"#fff3e0"
}}
>

<Typography variant="h6">
Training Statistics
</Typography>

<Divider sx={{my:1}}/>

<Box sx={{display:"flex",gap:1,mb:2}}>

<TextField
size="small"
label="Financial Year"
value={fy}
onChange={(e)=>setFy(e.target.value)}
/>

<Button variant="contained"
onClick={fetchTrainingStats}
>
Load
</Button>

</Box>

{trainingStats.map((s,i)=>(
<Typography key={i}>
{s._id} : {s.count}
</Typography>
))}

</Paper>

</Grid>

{/* C-OFF CARD */}

<Grid item xs={12} md={3}>

  <Paper
    sx={{
      p:3,
      borderRadius:4,
      background:"linear-gradient(135deg,#7b1fa2,#ba68c8)",
      color:"white",
      cursor:"pointer"
    }}
    onClick={() => setOpenCoff(true)}
  >

    <Typography variant="h6">
      C-OFF Balance
    </Typography>

    <Divider sx={{my:1, background:"rgba(255,255,255,0.3)"}}/>

    <Typography variant="h4" fontWeight="bold">
      {coffStats.summary?.available || 0}
      <Typography component="span" sx={{fontSize:16, ml:1}}>
        / {coffStats.summary?.total || 0}
      </Typography>
    </Typography>

    <Typography sx={{mt:1, fontSize:13}}>
      Used: {coffStats.summary?.used || 0}
    </Typography>

    <Typography sx={{mt:1, fontSize:12, opacity:0.8}}>
      Click to view details →
    </Typography>

  </Paper>

</Grid>

{/* Login History CARD */}

<Grid item xs={12} md={3}>

  <Paper sx={{ p:3, borderRadius:4, background:"#ede7f6" }}>

    <Typography variant="h6">
      Login History
    </Typography>

    <Divider sx={{my:1}}/>

    {loginHistory.length === 0 ? (
      <Typography>No login records</Typography>
    ) : (
      loginHistory.slice(0,3).map((l,i)=>(
        <Box key={i} sx={{mb:1, p:1, borderBottom:"1px solid #ddd"}}>

          <Typography fontSize={14}>
            {new Date(l.loginTime).toLocaleString()}
          </Typography>

          <Typography fontSize={12}>
            Status: {l.status}
          </Typography>

          {l.logoutTime && (
            <Typography fontSize={12}>
              Logout: {new Date(l.logoutTime).toLocaleString()}
            </Typography>
          )}

        </Box>
      ))
    )}

    <Button
      size="small"
      sx={{ mt: 1 }}
      onClick={() => setOpenLogin(true)}
    >
      View All
    </Button>

  </Paper>

</Grid>

<Grid item xs={12} md={6}>

  <Paper
    sx={{
      p:3,
      borderRadius:4,
      background:"#f3e5f5"
    }}
  >

    <Typography variant="h6">
      Shift Timeline
    </Typography>

    <Divider sx={{ my:2 }}/>

    <Box sx={{ width: "100%" }}>
      <ShiftTimeline
        data={timelineData}
        height={200}
        chartId="profileTimeline"
      />
    </Box>

  </Paper>

</Grid>

</Grid>


<Dialog open={openCoff} onClose={() => setOpenCoff(false)} fullWidth maxWidth="sm">

  <DialogTitle>
    C-OFF Details
  </DialogTitle>

  <DialogContent>

    {coffStats.details.length === 0 ? (
      <Typography>No data</Typography>
    ) : (
      coffStats.details.map((c, i) => (

        <Box key={i} sx={{
          p:2,
          mb:1,
          borderRadius:2,
          background: c.status === "Used" ? "#ffebee" : "#e8f5e9"
        }}>

          <Typography fontWeight="bold">
            Earned: {c.earnedDate}
          </Typography>

          <Typography>
            Expiry: {c.expiryDate}
          </Typography>

          <Typography>
            Status: {c.status}
          </Typography>

          {c.usedDate && (
            <Typography>
              Used On: {c.usedDate}
            </Typography>
          )}

        </Box>

      ))
    )}

  </DialogContent>

</Dialog>

<Dialog
  open={openLogin}
  onClose={() => setOpenLogin(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Full Login History</DialogTitle>

  <DialogContent>

    {loginHistory.map((l,i)=>(
      <Box key={i} sx={{mb:1, p:1, borderBottom:"1px solid #ddd"}}>

        <Typography fontSize={14}>
          {new Date(l.loginTime).toLocaleString()}
        </Typography>

        <Typography fontSize={12}>
          Status: {l.status}
        </Typography>

        {l.logoutTime && (
          <Typography fontSize={12}>
            Logout: {new Date(l.logoutTime).toLocaleString()}
          </Typography>
        )}

      </Box>
    ))}

  </DialogContent>
</Dialog>

</Box>

)

}