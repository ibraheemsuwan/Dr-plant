import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { PlantScan } from "./components/PlantScan";
import { Contact } from "./components/Contact";
import { Login } from "./components/Login";
import { RouteError } from "./components/RouteError";
import { NotFound } from "./pages/NotFound/NotFound";

// Heavier or less-visited pages load on demand (smaller first download on mobile)
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: Home },
      { path: "scan", Component: PlantScan },
      {
        path: "weather",
        lazy: async () => ({ Component: (await import("./components/Weather")).Weather }),
      },
      {
        path: "seasonal-crops",
        lazy: async () => ({ Component: (await import("./components/SeasonalCrops")).SeasonalCrops }),
      },
      {
        path: "blog",
        lazy: async () => ({ Component: (await import("./pages/BlogPage/BlogPage")).BlogPage }),
      },
      { path: "contact", Component: Contact },
      {
        path: "settings",
        lazy: async () => ({ Component: (await import("./components/Settings")).Settings }),
      },
      {
        path: "admin",
        lazy: async () => ({ Component: (await import("./pages/AdminDashboard/AdminDashboard")).AdminDashboard }),
      },
      {
        path: "my-diagnoses",
        lazy: async () => ({ Component: (await import("./pages/MyDiagnoses/MyDiagnoses")).MyDiagnoses }),
      },
      {
        path: "privacy",
        lazy: async () => ({ Component: (await import("./pages/Legal/Legal")).PrivacyPage }),
      },
      {
        path: "terms",
        lazy: async () => ({ Component: (await import("./pages/Legal/Legal")).TermsPage }),
      },
      {
        path: "forgot-password",
        lazy: async () => ({ Component: (await import("./pages/Auth/PasswordReset")).ForgotPasswordPage }),
      },
      {
        path: "reset-password",
        lazy: async () => ({ Component: (await import("./pages/Auth/PasswordReset")).ResetPasswordPage }),
      },
      { path: "login", Component: Login },
      { path: "register", Component: Login },
      { path: "*", Component: NotFound },
    ],
  },
]);
