import { Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const ProgressCircle = ({ progress = "0.75", size = "40" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const angle = progress * 360;
  return (
    <Box
      sx={{
        background: `radial-gradient(${colors.primary[400]} 56%, transparent 57%),
            conic-gradient(${colors.greenAccent[500]} 0deg ${angle}deg, ${colors.primary[700]} ${angle}deg 360deg)`,
        borderRadius: "50%",
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.18)",
      }}
    />
  );
};

export default ProgressCircle;
