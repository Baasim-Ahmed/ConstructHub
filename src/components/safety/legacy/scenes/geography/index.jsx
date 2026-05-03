import { Box, useTheme } from "@mui/material";
import GeographyChart from "../../components/GeographyChart";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import LineChart from "../../components/LineChart";

const Geography = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [lineData, setLineData] = useState([]);
  const [lineData1, setLineData1] = useState([]);
  useEffect(() => {
    const storedRes = localStorage.getItem("resData");
    const parsedRes = JSON.parse(storedRes);
    if (parsedRes.data.LeftShoulderArr) {
      const formattedData = parsedRes.data.LeftShoulderArr.map(
        (score, index) => ({
          x: index.toString(), // Using array index as x-value
          y: score, // Confidence score as y-value
        })
      );
      setLineData([
        {
          id: "Movement",
          color: tokens("dark").greenAccent[500],
          data: formattedData,
        },
      ]);
      if (parsedRes?.data?.RightShoulderArr) {
        const formattedData = parsedRes.data.RightShoulderArr.map(
          (score, index) => ({
            x: index.toString(), // Using array index as x-value
            y: score, // Confidence score as y-value
          })
        );
        setLineData1([
          {
            id: "Movement",
            color: tokens("dark").greenAccent[500],
            data: formattedData,
          },
        ]);

        // Now, parsedRes contains the res object retrieved from local storage
      }
    }
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
