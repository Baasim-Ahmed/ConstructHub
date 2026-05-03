import { Box, Button, TextField } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import React, { useState } from "react";
import { pdfjs } from "react-pdf";
import { Document, Page } from "react-pdf";
const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const handleFormSubmit = (values) => {
    console.log(values);
  };
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  return (
    <Box m="20px">
      <Header
        title="DETAILED REPORT"
        subtitle="REPORT OF SAFETY DETECTION AND PRODUCTIVITY ANALYSIS"
      />
      <Button
        variant="contained"
        color="primary"
        size="large"
        style={{ marginTop: "20px", backgroundColor: "#70d8bd" }}
      >
        <a
          href="https://drive.google.com/uc?export=download&id=1mJ5EkltjZX4tuf0vgZ8j6FBhiXijPwD3"
          style={{ color: "white", textDecoration: "none" }}
        >
          Download PDF
        </a>
      </Button>
      <iframe
        src="https://drive.google.com/file/d/1mJ5EkltjZX4tuf0vgZ8j6FBhiXijPwD3/preview"
        width="100%"
        height="1000px"
        allow="autoplay"
      ></iframe>

      {/* <div>
        <Document
          file={{
            url: "https://drive.google.com/ucid=1mJ5EkltjZX4tuf0vgZ8j6FBhiXijPwD3/view",
          }}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={pageNumber} />
        </Document>
        <p>
          Page {pageNumber} of {numPages}
        </p>
      </div> */}
    </Box>
  );
};

export default Form;
