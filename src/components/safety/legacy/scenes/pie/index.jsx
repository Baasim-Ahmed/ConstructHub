import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { mockPieData1 } from "../../data/mockData";
import { useEffect, useState } from "react";
const Pie = () => {
  const [lineData, setLineData] = useState([]);
  useEffect(() => {
    const storedRes = localStorage.getItem("resData");
    const parsedRes = JSON.parse(storedRes);
    if (parsedRes.data.threshold) {
      if (parsedRes.data.threshold < 0.2) {
        let data = [
          {
            id: "Working Slow",
            label: "Working Good",
            value: 0.25,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "More Effort",
            label: "More Effort",
            value: 0.75,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData(data);
      } else if (
        parsedRes.data.threshold >= 0.2 &&
        parsedRes.data.threshold < 0.8
      ) {
        let data = [
          {
            id: "Working Good",
            label: "Working Good",
            value: 0.75,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "More Effort",
            label: "More Effort",
            value: 0.25,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData(data);
      } else if (parsedRes.data.threshold >= 0.8) {
        let data = [
          {
            id: "No Effort Need",
            label: "No Effort Need",
            value: 0.01,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "High Effort",
            label: "More Effort",
            value: 1,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData(data);
      }

      // Now, parsedRes.data contains the res object retrieved from local storage
    }
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
