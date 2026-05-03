import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { mockPieData } from "../../data/mockData";
import { useEffect, useState } from "react";
const Bar = () => {
  const [lineData, setLineData] = useState([]);
  const checkAndPushItems = (array) => {};
  useEffect(() => {
    const storedRes = localStorage.getItem("resData");
    const parsedRes = JSON.parse(storedRes);
    if (parsedRes.data.labels) {
      const validItems = ["hard hat", "Gloves", "Mask", "safety vest"];
      const filteredItems = parsedRes.data.labels.filter((item) =>
        validItems.includes(item)
      );

      const uniqueItems = [...new Set(filteredItems)];

      const mockPieData = uniqueItems.map((item) => {
        let data = {};

        switch (item) {
          case "safety vest":
            data = {
              id: item,
              label: item,
              value: 0.2,
              color: "hsl(162, 70%, 50%)",
            };
            break;
          case "hard hat":
            data = {
              id: item,
              label: item,
              value: 0.7,
              color: "hsl(104, 70%, 50%)",
            };
            break;
          case "Gloves":
            data = {
              id: item,
              label: item,
              value: 0.2,
              color: "hsl(104, 70%, 50%)",
            };
            break;
          case "Mask":
            data = {
              id: item,
              label: item,
              value: 0.1,
              color: "hsl(104, 70%, 50%)",
            };
            break;
          default:
            break;
        }

        return data;
      });
      const sum = mockPieData.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0
      );
      const remainingValue = 1 - sum;
      const rdata = {
        id: "No Safety",
        label: "No Safety",
        value: remainingValue,
        color: "hsl(104, 70%, 50%)",
      };
      if (mockPieData.length > 0) {
        mockPieData.push(rdata);
        setLineData(mockPieData);
      } else {
        setLineData(rdata);
      }

      console.log("final", mockPieData);

      // Now, parsedRes contains the res object retrieved from local storage
    }
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
