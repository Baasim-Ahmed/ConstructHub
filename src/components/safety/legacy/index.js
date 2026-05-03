import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  BrowserRouter,
  useNavigate,
  Route,
  Routes,
  Router,
} from "react-router-dom";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
const clerkPublishableKey =
  "pk_test_c2F2ZWQtZ29vc2UtMy5jbGVyay5hY2NvdW50cy5kZXYk";

console.log("aaaa=", clerkPublishableKey);
const root = ReactDOM.createRoot(document.getElementById("root"));
// const ClerkWithRoutes = () => {
//   const navigate = useNavigate();
//   return (
//     <ClerkProvider
//       publishableKey={clerkPublishableKey}
//       navigate={(to) => navigate(to)}
//     >
//       <Routes>
//         <Route path="/" element={<App />} />
//         <Route
//           path="/sign-in/"
//           element={
//             <SignIn  routing="path" path="/sign-in" />
//           }
//         />
//         <Route
//           path="/sign-up/"
//           element={
//             <SignUp  routing="path" path="/sign-up" />
//           }
//         />
//         <Route
//           path="/protected"
//           element={
//             <>
//               {" "}
//               <SignedIn>
//                 <App />
//               </SignedIn>
//               <SignedOut>
//                 <RedirectToSignIn />
//               </SignedOut>
//             </>
//           }
//         />
//       </Routes>
//     </ClerkProvider>
//   );
// };
root.render(
  // <ClerkProvider publishableKey={clerkPublishableKey}>
  //   {/* <React.StrictMode>
  //     <BrowserRouter>
  //       <App />
  //     </BrowserRouter>
  //   </React.StrictMode> */}
  //   <ClerkWithRoutes/>
  // </ClerkProvider>
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  </ClerkProvider>
);
