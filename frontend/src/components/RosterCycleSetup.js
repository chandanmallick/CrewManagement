import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button
} from "@mui/material";

const Roster_API_URL = "http://localhost:8000/roster";

const DUTY_SEQUENCE = [
  "E1","E2","M1","M2","N1","N2","O1","O2"
];

export default function RosterCycleSetup() {

  const [baseDate, setBaseDate] = useState("");
  const [groups, setGroups] = useState([
    { groupName: "Group-1", startDuty: "" },
    { groupName: "Group-2", startDuty: "" },
    { groupName: "Group-3", startDuty: "" },
    { groupName: "Group-4", startDuty: "" }
  ]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await axios.get(`${Roster_API_URL}/cycle-setup`);

    if (res.data.baseDate) {
      setBaseDate(res.data.baseDate);
      setGroups(res.data.groups);
    }
  };

  const handleChange = (index, value) => {
    const updated = [...groups];
    updated[index].startDuty = value;
    setGroups(updated);
  };

  const handleSave = async () => {

    if (!baseDate) {
      alert("Select Base Date");
      return;
    }

    await axios.post(`${Roster_API_URL}/cycle-setup`, {
      baseDate,
      groups
    });

    alert("Cycle Setup Saved");
  };

  return (
    <Box sx={{ width: "100%", px: 4 }}>
      <Typography variant="h5" gutterBottom>
        Roster Cycle Setup
      </Typography>

      <Paper sx={{ p: 4 }}>

        <Grid container spacing={3}>

          <Grid item xs={12} md={4}>
            <TextField
              type="date"
              fullWidth
              label="Base Date"
              InputLabelProps={{ shrink: true }}
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
            />
          </Grid>

          {groups.map((group, index) => (
            <Grid item xs={12} md={4} key={group.groupName}>
              <TextField
                select
                fullWidth
                label={`${group.groupName} Start Duty`}
                value={group.startDuty}
                onChange={(e) => handleChange(index, e.target.value)}
              >
                {DUTY_SEQUENCE.map((duty) => (
                  <MenuItem key={duty} value={duty}>
                    {duty}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
            >
              Save Cycle Setup
            </Button>
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
}
