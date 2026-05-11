import { Box } from "@mui/material";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import { buildLineSeries, readStoredAnalysis } from "../../utils/analysisData";

const Line = () => {
  const [lineData, setLineData] = useState([]);
  const [lineData1, setLineData1] = useState([]);
  useEffect(() => {
    const analysis = readStoredAnalysis();
    setLineData(
      buildLineSeries(
        analysis?.rightArmAngles || [],
        "Right Arm",
        tokens("dark").greenAccent[500]
      )
    );
    setLineData1(
      buildLineSeries(
        analysis?.leftArmAngles || [],
        "Left Arm",
        tokens("dark").blueAccent[400]
      )
    );
  }, []);

  useEffect(() => {
    console.log("aa", lineData);
  }, [lineData]);
  return (
    <Box m="20px">
      <Header
        title="Arm Movement Activity"
        subtitle="RIGHT AND LEFT ARM MOVEMENT"
      />
      <div style={{ display: "flex" }}>
        <Box height="39vh" width="100%">
          <LineChart data={lineData} />
        </Box>
        <Box height="39vh" width="100%">
          <LineChart data={lineData1} />
        </Box>
      </div>
    </Box>
  );
};

export default Line;
