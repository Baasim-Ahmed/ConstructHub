import { Box, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import PieChart from "../../components/PieChart";
import { buildCountPieData, readStoredAnalysis } from "../../utils/analysisData";

const Invoices = () => {
  const theme = useTheme();
  const [lineData, setLineData] = useState([]);
  const colors = tokens(theme.palette.mode);

  useEffect(() => {
    const analysis = readStoredAnalysis();
    setLineData(
      buildCountPieData(
        analysis?.counter || 0,
        analysis?.productivityBand,
        analysis?.durationSeconds || 0
      )
    );
  }, []);
  useEffect(() => {
    console.log("line", lineData);
  }, [lineData]);
  return (
    <Box m="20px">
      <Header title="Counts" subtitle="counts detected from video" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <PieChart data={lineData} />
      </Box>
    </Box>
  );
};

export default Invoices;
