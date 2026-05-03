import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import GeographyChart from "../../components/GeographyChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import { mockLineData } from "../../data/mockData";
import { useEffect, useState } from "react";
import PieChart from "../../components/PieChart";
const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [lineData, setLineData] = useState([]);
  const [lineData2, setLineData2] = useState([]);
  const [lineData1, setLineData1] = useState([]);
  const [progress, setProgress] = useState(0);
  const [pieData, setPieData] = useState([]);
  const [total, setTotal] = useState(1);
  const [detectedElements, setDetetedElements] = useState([]);

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
      console.log("mock", mockPieData);
      if (mockPieData.length > 0) {
        mockPieData.push(rdata);
        setDetetedElements(mockPieData);
      } else {
        setDetetedElements(mockPieData);
      }

      // Now, parsedRes contains the res object retrieved from local storage
    }
    if (parsedRes.data.confidenceScores) {
      const formattedData = parsedRes.data.confidenceScores.map(
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

      // Now, parsedRes contains the res object retrieved from local storage
    }
    if (parsedRes?.data.LeftShoulderArr) {
      const formattedData = parsedRes.data.LeftShoulderArr.map(
        (score, index) => ({
          x: index.toString(), // Using array index as x-value
          y: score, // Confidence score as y-value
        })
      );
      setLineData2([
        {
          id: "Movement",
          color: tokens("dark").greenAccent[500],
          data: formattedData,
        },
      ]);

      // Now, parsedRes contains the res object retrieved from local storage
    }
    if (parsedRes.data.threshold) {
      if (parsedRes.data.threshold < 0.2) {
        let data = [
          {
            id: "Working Very Slow",
            label: "Working Very Slow",
            value: 0.125,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "Average",
            label: "Average",
            value: 0.375,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "High",
            label: "High",
            value: 0.75,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData1(data);
        setPerformance("slow");
        setTime("delay");
        setProgress(0.25);
      } else if (
        parsedRes.data.threshold >= 0.2 &&
        parsedRes.data.threshold < 0.8
      ) {
        let data = [
          {
            id: "Slow",
            label: "Slow",
            value: 0.125,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "Working Good",
            label: "Working Good",
            value: 0.375,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "High",
            label: "High",
            value: 0.75,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData1(data);
        setPerformance("good");
        setTime("finish");
        setProgress(0.8);
      } else if (parsedRes.data.threshold >= 0.8) {
        let data = [
          {
            id: "Slow",
            label: "Slow",
            value: 0.125,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "Average",
            label: "Average",
            value: 0.375,
            color: "hsl(162, 70%, 50%)",
          },
          {
            id: "Working Swiftly",
            label: "Working Swiftly",
            value: 0.75,
            color: "hsl(162, 70%, 50%)",
          },
        ];
        setLineData1(data);
        setPerformance("best");
        setTime("finish");
        setProgress(1);
      }

      // Now, parsedRes contains the res object retrieved from local storage
    }

    if (parsedRes.data.counter) {
      console.log("pares1", parsedRes.data.counter);
      if (parsedRes.data.threshold) {
        console.log("parsedRes.threshold", parsedRes.data.threshold);
        if (parsedRes.data.threshold < 0.2) {
          console.log("parsedRes.thresholds", parsedRes.data.threshold);
          setTotal((parsedRes.data.counter * 100) / 25);
          let data = [
            {
              id: `Working Slow Counts are ${parsedRes.data.counter}`,
              label: `Working Slow `,
              value: 0.25,
              color: "hsl(162, 70%, 50%)",
            },
            {
              id: `Expected Counts Should Be ${
                (parsedRes.data.counter * 100) / 25
              }`,
              label: `Expected Counts`,
              value: 0.75,
              color: "hsl(162, 70%, 50%)",
            },
          ];
          setPieData(data);
        } else if (
          parsedRes.data.threshold >= 0.2 &&
          parsedRes.data.threshold < 0.8
        ) {
          setTotal((parsedRes.data.counter * 100) / 75);
          console.log("parsedRes.threshold m", parsedRes.data.threshold);
          let data = [
            {
              id: `Working Good Counts are ${parsedRes.data.counter}`,
              label: `Working Good `,
              value: 0.75,
              color: "hsl(162, 70%, 50%)",
            },
            {
              id: `Expected Counts Should Be ${
                (parsedRes.data.counter * 100) / 75
              }`,
              label: "More Effort",
              value: 0.25,
              color: "hsl(162, 70%, 50%)",
            },
          ];
          setPieData(data);
        } else if (parsedRes.data.threshold > 0.8) {
          setTotal(parsedRes.data.counter);
          let data = [
            {
              id: `Working Effectively Counts are ${parsedRes.data.counter}`,
              label: `Working Effectively `,
              value: parsedRes.data.counter,
              color: "hsl(162, 70%, 50%)",
            },
            {
              id: `Expected Counts Should Be ${parsedRes.data.counter} `,
              label: `Expected Counts `,
              value: parsedRes.data.counter,
              color: "hsl(162, 70%, 50%)",
            },
          ];
          setPieData(data);
        }
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    console.log("detectedElements", detectedElements);
  }, [detectedElements]);
  const [time, setTime] = useState("");
  const [performance, setPerformance] = useState("");
  useEffect(() => {
    console.log("aa", lineData);
  }, [lineData]);
  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            onClick={handlePrint}
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {detectedElements?.map((item) => (
          <Box
            gridColumn="span 3"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={item.id}
              subtitle={`item value is ${item.value}`}
              progress={item.value}
            />
          </Box>
        ))}

        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Right Arm Movements
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              ></Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboard={true} data={lineData} />
          </Box>
        </Box>

        {/* <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            colors={colors.grey[100]}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Recent Transactions
            </Typography>
          </Box>
          {mockTransactions?.map((transaction, i) => (
            <Box
              key={`${transaction.txId}-${i}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  {transaction.txId}
                </Typography>
                <Typography color={colors.grey[100]}>
                  {transaction.user}
                </Typography>
              </Box>
              <Box color={colors.grey[100]}>{transaction.date}</Box>
              <Box
                backgroundColor={colors.greenAccent[500]}
                p="5px 10px"
                borderRadius="4px"
              >
                ${transaction.cost}
              </Box>
            </Box>
          ))}
        </Box> */}

        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Productivity
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle progress={progress} size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              Worker Is Showing {`${performance}`} Performance
            </Typography>
            <Typography>Work can be {`${time}`} </Typography>
          </Box>
        </Box>
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Left Arm Movements
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              ></Typography>
            </Box>
            <Box>
              <IconButton>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboard={true} data={lineData2} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Counts Detected
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            {/* <PieChart data={pieData} /> */}
            <ProgressCircle progress={pieData[0]?.value} size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              {`${pieData[0]?.id}`}
            </Typography>
            <Typography>{`${pieData[1]?.id}`} </Typography>
          </Box>
        </Box>
        {/* <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Sales Quantity
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          padding="30px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            Geography Based Traffic
          </Typography>
          <Box height="200px">
            <GeographyChart isDashboard={true} />
          </Box>
        </Box> */}
      </Box>
    </Box>
  );
};

export default Dashboard;
