import React, { useEffect, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const LineChart = ({
  isCustomLineColors = false,
  data,
  isDashboard = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Define state to hold peak points
  const [peakXValues, setPeakXValues] = useState([]);

  // Function to find peaks in data
  const findPeaks = (data) => {
    const peaks = [];

    for (let i = 1; i < data[0].data.length - 2; i++) {
      const prev = data[0].data[i - 1].y;
      const current = data[0].data[i].y;
      const next = data[0].data[i + 1].y;
      if (current > prev && current > next) {
        // peaks.push(data[0].data[i].x);
      }
    }

    // Skip first and last points as they cannot be peaks
    // for (let i = 1; i < data[0].data.length - 2; i++) {
    //   console.log("i", i);
    //   // const prev = data[0].data[i - 1]?.y;
    //   // const current = data[0].data[i]?.y;
    //   // const next = data[0].data[i + 1]?.y;

    //   // // Check if current point is a peak
    //   // if (current > prev && current > next) {
    //   //   peaks.push(data[i].x);
    //   // }
    // }

    return peaks;
  };

  // When the component mounts, find and save the peak points
  useEffect(() => {
    if (data.length > 0) {
      const peaks = findPeaks(data);
      setPeakXValues(peaks);
    }
  }, [data]);

  return (
    <ResponsiveLine
      data={data}
      theme={{
        axis: {
          domain: { line: { stroke: colors.primary[700] } },
          legend: { text: { fill: colors.grey[400] } },
          ticks: {
            line: { stroke: colors.primary[700], strokeWidth: 1 },
            text: { fill: colors.grey[500] },
          },
        },
        grid: {
          line: {
            stroke: colors.primary[700],
            strokeWidth: 1,
          },
        },
        legends: { text: { fill: colors.grey[400] } },
        tooltip: {
          container: {
            background: colors.primary[400],
            color: colors.grey[200],
            border: `1px solid ${colors.primary[700]}`,
            borderRadius: "12px",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
          },
        },
      }}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Frame Number",
        legendOffset: 36,
        legendPosition: "middle",
        tickValues: peakXValues, // Display x-axis labels only at peak points
      }}
      axisLeft={{
        orient: "left",
        tickValues: 5,
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Arm",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={true}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: { itemBackground: "rgba(0, 0, 0, .03)", itemOpacity: 1 },
            },
          ],
        },
      ]}
    />
  );
};

export default LineChart;
