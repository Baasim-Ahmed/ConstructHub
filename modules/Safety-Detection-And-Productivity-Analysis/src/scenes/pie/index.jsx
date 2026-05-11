import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { useEffect, useState } from "react";
import {
  buildProductivityPieData,
  readStoredAnalysis,
} from "../../utils/analysisData";
const Pie = () => {
  const [lineData, setLineData] = useState([]);
  useEffect(() => {
    const analysis = readStoredAnalysis();
    setLineData(
      buildProductivityPieData({
        productivityBand: analysis?.productivityBand,
        threshold: analysis?.threshold || 0,
      })
    );
  }, []);
  return (
    <Box m="20px">
      <Header title="Productivity Analysis" subtitle="" />
      <Box height="75vh">
        <PieChart data={lineData} />
      </Box>
    </Box>
  );
};

export default Pie;
