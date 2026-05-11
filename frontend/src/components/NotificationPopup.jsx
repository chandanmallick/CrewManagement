import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, MenuItem, Box, Typography, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';

const NotificationPopup = ({ notifications, onMarkAsRead }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleAction = (notif) => {
    if (notif.action === 'VIEW_LEAVE') {
      navigate('/leave-management');
    }
    onMarkAsRead(notif.id);
    handleClose();
  };

  return (
    <Box>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: { maxHeight: 400, width: '350px', borderRadius: '12px', marginTop: '10px' },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem sx={{ py: 2 }}>No new notifications</MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif.id} 
              onClick={() => handleAction(notif)}
              sx={{ 
                whiteSpace: 'normal', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                backgroundColor: notif.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)'
              }}
            >
              <Typography variant="body2" fontWeight={notif.read ? 400 : 600}>
                {notif.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notif.time}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default NotificationPopup;