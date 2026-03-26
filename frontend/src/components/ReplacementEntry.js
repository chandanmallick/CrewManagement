import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid
} from "@mui/material";

export default function ReplacementEntry() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    department: "",
    controllingOfficer: ""
  });

  const [data, setData] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) return;

    setData([...data, formData]);

    setFormData({
      name: "",
      category: "",
      department: "",
      controllingOfficer: ""
    });
  };

  const handleDelete = (index) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Replacement Master Entry
      </Typography>

      {/* -------- Form Section -------- */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Replacement Person Name"
              name="name"
              fullWidth
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Category"
              name="category"
              fullWidth
              value={formData.category}
              onChange={handleChange}
            >
              <MenuItem value="SIC">SIC</MenuItem>
              <MenuItem value="Other">Other Shift Personnel</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Department"
              name="department"
              fullWidth
              value={formData.department}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Controlling Officer"
              name="controllingOfficer"
              fullWidth
              value={formData.controllingOfficer}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSubmit}>
              Add Replacement Person
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* -------- Table Section -------- */}
      <Typography variant="h6" gutterBottom>
        Replacement Pool List
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{backgroundColor: "#d9f2d9"}}>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Controlling Officer</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.controllingOfficer}</TableCell>
                <TableCell align="center">
                  <Button
                    color="error"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No Replacement Persons Added
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
