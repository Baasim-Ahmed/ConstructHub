import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import { useEffect, useState } from "react";
import {
  buildCountPieData,
  buildLineSeries,
  buildSafetyStatCards,
  getProductivityCopy,
  readStoredAnalysis,
} from "../../utils/analysisData";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [rightArmSeries, setRightArmSeries] = useState([]);
  const [leftArmSeries, setLeftArmSeries] = useState([]);
  const [progress, setProgress] = useState(0);
  const [countPieData, setCountPieData] = useState([]);
  const [statCards, setStatCards] = useState([]);
  const [time, setTime] = useState("");
  const [performance, setPerformance] = useState("");
  const [processedFrames, setProcessedFrames] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [productivityRate, setProductivityRate] = useState(0);

  useEffect(() => {
    const analysis = readStoredAnalysis();
    if (!analysis) {
      return;
    }

    setRightArmSeries(
      buildLineSeries(analysis.rightArmAngles, "Right Arm", tokens("dark").greenAccent[500])
    );
    setLeftArmSeries(
      buildLineSeries(analysis.leftArmAngles, "Left Arm", tokens("dark").blueAccent[400])
    );
    setStatCards(buildSafetyStatCards(analysis));
    setCountPieData(
      buildCountPieData(
        analysis.counter,
        analysis.productivityBand,
        analysis.durationSeconds
      )
    );

    const productivity = getProductivityCopy({
      productivityBand: analysis.productivityBand,
      threshold: analysis.threshold,
    });
    setPerformance(productivity.performance);
    setTime(productivity.time);
    setProgress(productivity.progress);
    setProcessedFrames(analysis.frameCount || analysis.rightArmAngles.length || 0);
    setDurationSeconds(analysis.durationSeconds || 0);
    setProductivityRate(analysis.threshold || 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const countSummary = countPieData[0]?.id || "No count data yet";
  const remainingSummary = countPieData[1]?.id || "Upload a video to analyze work cycles";

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Live safety and productivity analytics" />

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
        {statCards.map((item) => (
          <Box
            key={item.id}
            gridColumn="span 3"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={item.id}
              subtitle={`detections: ${item.value}`}
              progress={item.progress}
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
              >
                {processedFrames} tracked frames
              </Typography>
              <Typography color={colors.grey[300]}>
                {durationSeconds.toFixed(2)} seconds analyzed
              </Typography>
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
            <LineChart isDashboard={true} data={rightArmSeries} />
          </Box>
        </Box>

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
              sx={{ mt: "15px", textTransform: "capitalize" }}
            >
              Worker performance: {performance}
            </Typography>
            <Typography>Schedule outlook: {time}</Typography>
            <Typography>Measured rate: {productivityRate.toFixed(2)} cycles/s</Typography>
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
            <LineChart isDashboard={true} data={leftArmSeries} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Count Summary
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle progress={Math.min(progress, 1)} size="125" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              {countSummary}
            </Typography>
            <Typography>{remainingSummary}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
