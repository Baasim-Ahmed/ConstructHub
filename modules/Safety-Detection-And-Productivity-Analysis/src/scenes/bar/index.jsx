import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { useEffect, useState } from "react";
import { buildDetectionPieData, readStoredAnalysis } from "../../utils/analysisData";
const Bar = () => {
  const [lineData, setLineData] = useState([]);
  useEffect(() => {
    const analysis = readStoredAnalysis();
    setLineData(buildDetectionPieData(analysis));
  }, []);

  useEffect(() => {
    console.log("aa", lineData);
  }, [lineData]);
  return (
    <Box m="20px">
      <Header title="Safety Detection" subtitle="" />
      <Box height="75vh">
        <PieChart data={lineData} />
      </Box>
    </Box>
  );
};

export default Bar;
