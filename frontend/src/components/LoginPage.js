import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const LoginPage = ({ onLogin }) => {

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {

    setLoading(true);
    setError("");

    try {

      const res = await axios.post("http://localhost:8000/auth/login", {
        userId,
        password
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("employeeId", res.data.employeeId);
      localStorage.setItem("name", res.data.name);

      onLogin();
      navigate("/");

    } catch (err) {

      setError("Invalid User ID or Password");

    }

    setLoading(false);

  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (

    <Box
      sx={{
        height: "100vh",
        background:
          "linear-gradient(270deg,#3f51b5,#5c6bc0,#7986cb,#9fa8da)",
        backgroundSize: "800% 800%",
        animation: "gradientMove 15s ease infinite",
        "@keyframes gradientMove": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        }
      }}
    >

      <Grid container sx={{ height: "100%" }}>

        {/* Illustration Panel */}

        <Grid
          item
          md={6}
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            flexDirection: "column",
            p: 6
          }}
        >

          <Typography variant="h3" fontWeight="bold" mb={2}>
            Crew Management
          </Typography>

          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Duty Roster • Leave • Training
          </Typography>

          <Box
            component="img"
            src="https://undraw.co/api/illustrations/crew.svg"
            alt="illustration"
            sx={{
              width: 350,
              mt: 5
            }}
          />

          <Box
            component="img"
            src="/assets/GRIDINDIALOGOFINAL"
            alt="illustration"
            sx={{
              width: 350,
              mt: 5
            }}
          />
          


        </Grid>

        {/* Login Panel */}

        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >

          <Paper
            elevation={0}
            sx={{
              width: 380,
              p: 5,
              borderRadius: 4,
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.75)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
            }}
          >

            <Typography
              variant="h4"
              textAlign="center"
              fontWeight={700}
              mb={1}
            >
              Welcome
            </Typography>

            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
              mb={3}
            >
              Sign in to Crew Management System
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="User ID"
              fullWidth
              margin="normal"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={handleKeyPress}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                py: 1.3,
                borderRadius: 2,
                fontWeight: 600
              }}
              onClick={handleLogin}
              disabled={loading}
            >

              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Login"
              )}

            </Button>

          </Paper>

        </Grid>

      </Grid>

    </Box>
  );
};

export default LoginPage;