import { Box, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import LineChart from "../../components/LineChart";
import { buildLineSeries, readStoredAnalysis } from "../../utils/analysisData";

const Geography = () => {
  const theme = useTheme();
  const [lineData, setLineData] = useState([]);
  const [lineData1, setLineData1] = useState([]);
  useEffect(() => {
    const analysis = readStoredAnalysis();
    setLineData(
      buildLineSeries(
        analysis?.leftShoulderAngles || [],
        "Left Shoulder",
        tokens("dark").greenAccent[500]
      )
    );
    setLineData1(
      buildLineSeries(
        analysis?.rightShoulderAngles || [],
        "Right Shoulder",
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
        title="Shoulder Movement Activity"
        subtitle="RIGHT AND LEFT Shoulder MOVEMENT"
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

export default Geography;
