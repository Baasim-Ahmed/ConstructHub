import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import ProgressCircle from "./ProgressCircle";

const StatBox = ({ title, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box width="100%" px="24px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          {icon}
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: colors.grey[100] }}
          >
            {title}
          </Typography>
        </Box>
        <Box>
          <ProgressCircle progress={progress} />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" mt="8px" alignItems="center">
        <Typography variant="h6" sx={{ color: colors.grey[500], fontWeight: 600 }}>
          {subtitle}
        </Typography>
        <Typography
          variant="h6"
          fontStyle="italic"
          sx={{ color: colors.greenAccent[600], fontWeight: 700 }}
        >
          {increase}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;
