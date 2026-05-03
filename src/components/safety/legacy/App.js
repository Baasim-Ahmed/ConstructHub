import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/contacts";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import Geography from "./scenes/geography";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar/calendar";
import { useUser, ClerkProvider, SignIn } from "@clerk/clerk-react";

function App() {
  const [theme, colorMode] = useMode();
  const clerkPublishableKey =
    "pk_test_c2F2ZWQtZ29vc2UtMy5jbGVyay5hY2NvdW50cy5kZXYk";
  const navigate = useNavigate();
  const user = useUser();

  // useEffect(() => {
  //   console.log(user.isSignedIn);
  //   if (!user.isSignedIn) {
  //     navigate("/sign-in");
  //   }
  // }, [user, navigate]);

  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <div className="app">
      {user.isSignedIn ? (
        <>
          <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Sidebar isSidebar={isSidebar} />
              <main className="content">
                <Topbar setIsSidebar={setIsSidebar} />
                <Routes>
                  <Route path="/" element={<Team />} />
                  <Route path="/team" element={<Dashboard />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/form" element={<Form />} />
                  <Route path="/bar" element={<Bar />} />
                  <Route path="/pie" element={<Pie />} />
                  <Route path="/line" element={<Line />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/geography" element={<Geography />} />
                </Routes>
              </main>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            width: "100vw",
          }}
        >
          <SignIn />
        </Box>
      )}
    </div>
  );
}

export default App;
