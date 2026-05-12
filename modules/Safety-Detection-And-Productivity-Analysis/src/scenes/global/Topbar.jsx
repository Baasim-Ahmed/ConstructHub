import { Box, IconButton, useTheme } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { UserButton } from "@clerk/clerk-react";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" p={3} pb={2}>
      {/* SEARCH BAR */}
      <Box
        display="flex"
        alignItems="center"
        backgroundColor={colors.primary[400]}
        border={`1px solid ${colors.primary[700]}`}
        borderRadius="14px"
        boxShadow="0 10px 24px rgba(15, 23, 42, 0.06)"
      >
        <InputBase
          sx={{ ml: 2, flex: 1, minWidth: "220px", color: colors.grey[200] }}
          placeholder="Search analytics"
        />
        <IconButton type="button" sx={{ p: 1.25, color: colors.greenAccent[500] }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex" alignItems="center" gap="8px">
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            border: `1px solid ${colors.primary[700]}`,
            borderRadius: "12px",
            color: colors.grey[300],
          }}
        >
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <UserButton />
      </Box>
    </Box>
  );
};

export default Topbar;
