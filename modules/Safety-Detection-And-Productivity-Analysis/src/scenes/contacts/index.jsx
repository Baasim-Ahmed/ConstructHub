import { Box } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataContacts } from "../../data/mockData";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import axios from "axios";

import React, { useCallback, useEffect, useState } from "react";
const Contacts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [source, setSource] = useState(
    "https://res.cloudinary.com/djmt6sc3a/video/upload/v1715800516/lqnjmbdcyp7hykhkqp0u.avi"
  );

  const [videoPathLocal, setvideoPathLocal] = useState("");

  // useEffect(() => {
  //   console.log(
  //     "asa",
  //     "https://res.cloudinary.com/djmt6sc3a/video/upload/v1715800516/lqnjmbdcyp7hykhkqp0u.avi"
  //   );
  //   const storedRes = localStorage.getItem("resData");
  //   const parsedRes = JSON.parse(storedRes);
  //   setvideoPathLocal(
  //     "https://res.cloudinary.com/djmt6sc3a/video/upload/v1715800516/lqnjmbdcyp7hykhkqp0u.avi"
  //   );
  //   if (parsedRes.videoPath) {
  //     setvideoPathLocal(
  //       "https://res.cloudinary.com/djmt6sc3a/video/upload/v1715800516/lqnjmbdcyp7hykhkqp0u.avi"
  //     );

  //     // Now, parsedRes contains the res object retrieved from local storage
  //     console.log(parsedRes);
  //   }

  //   // Convert the string back to an object using JSON.parse()
  // }, []);

  // useEffect(() => {
  //   console.log("videoPathLocal", videoPathLocal);

  //   // Convert the string back to an object using JSON.parse()
  // }, [videoPathLocal]);
  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "registrarId", headerName: "Registrar ID" },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "phone",
      headerName: "Phone Number",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
    },
    {
      field: "city",
      headerName: "City",
      flex: 1,
    },
    {
      field: "zipCode",
      headerName: "Zip Code",
      flex: 1,
    },
  ];

  return (
    <Box m="20px">
      <Header
        title="VIDEO RESULT"
        subtitle="BELOW GIVEN IS ANALYSIS OF VIDEO"
      />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
        }}
      >
        {/* {source && (
          <video
            className="VideoInput_video"
            width="100%"
            height="100%"
            controls
            src={source}
          />
        )} */}

        {/* <video
          src="https://drive.google.com/file/d/10NhmQdSSDvDWVLbVwKpfcvPhkT0YWpJ3/view?usp=drive_link"
          controls
        ></video> */}
        <img src="../../../public/assets/user.png"></img>

        {/* <video width="320" height="240" controls>
          <source
            src={videoPathLocal}
            type="video/avi"
          />
          Your browser does not support the video tag.
        </video> */}
        {/* {videoPathLocal && (
          <iframe
            width="100%"
            height="100%"
            controls
            src =  "./result.avi"
            >
            </iframe>
        )} */}
      </Box>
    </Box>
  );
};

export default Contacts;
