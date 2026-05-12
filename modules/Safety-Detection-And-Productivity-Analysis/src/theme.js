import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#f8fafc",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        primary: {
          100: "#2a211c",
          200: "#241b16",
          300: "#1f1814",
          400: "#171412",
          500: "#12100e",
          600: "#0d0b0a",
          700: "#090807",
          800: "#060505",
          900: "#030303",
        },
        greenAccent: {
          100: "#fff0e4",
          200: "#ffd5b3",
          300: "#ffb173",
          400: "#ff8d3a",
          500: "#f46a06",
          600: "#d95e08",
          700: "#a5480b",
          800: "#71320a",
          900: "#3d1b05",
        },
        redAccent: {
          100: "#fff1ed",
          200: "#ffd6cc",
          300: "#ffb29f",
          400: "#fb7f6a",
          500: "#e4604f",
          600: "#bf4d3f",
          700: "#8e3930",
          800: "#602520",
          900: "#31120f",
        },
        blueAccent: {
          100: "#e7eef8",
          200: "#c6d8f0",
          300: "#8fb4e0",
          400: "#5d8fcb",
          500: "#1f4f82",
          600: "#173e68",
          700: "#112f4f",
          800: "#0b2036",
          900: "#06111d",
        },
      }
    : {
        grey: {
          100: "#111827",
          200: "#1f2937",
          300: "#334155",
          400: "#475569",
          500: "#64748b",
          600: "#94a3b8",
          700: "#cbd5e1",
          800: "#e2e8f0",
          900: "#f8fafc",
        },
        primary: {
          100: "#1a1a1a",
          200: "#1f2937",
          300: "#e9eef5",
          400: "#ffffff",
          500: "#f8f9fa",
          600: "#eef2f7",
          700: "#d8e1ea",
          800: "#c4cfdd",
          900: "#93a4b8",
        },
        greenAccent: {
          100: "#fff0e4",
          200: "#ffd5b3",
          300: "#ffb173",
          400: "#ff8d3a",
          500: "#f46a06",
          600: "#d95e08",
          700: "#a5480b",
          800: "#71320a",
          900: "#3d1b05",
        },
        redAccent: {
          100: "#fff1ed",
          200: "#ffd6cc",
          300: "#ffb29f",
          400: "#fb7f6a",
          500: "#e4604f",
          600: "#bf4d3f",
          700: "#8e3930",
          800: "#602520",
          900: "#31120f",
        },
        blueAccent: {
          100: "#e7eef8",
          200: "#c6d8f0",
          300: "#8fb4e0",
          400: "#5d8fcb",
          500: "#1f4f82",
          600: "#173e68",
          700: "#112f4f",
          800: "#0b2036",
          900: "#06111d",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
