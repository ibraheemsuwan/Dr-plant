import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { PlantScan } from "./components/PlantScan";
import { Weather } from "./components/Weather";
import { SeasonalCrops } from "./components/SeasonalCrops";
import { BlogPage } from "./pages/BlogPage/BlogPage";
import { Contact } from "./components/Contact";
import { Login } from "./components/Login";
import { Settings } from "./components/Settings";
import { AdminDashboard } from "./pages/AdminDashboard/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "scan", Component: PlantScan },
      { path: "weather", Component: Weather },
      { path: "seasonal-crops", Component: SeasonalCrops },
      { path: "blog", Component: BlogPage },
      { path: "contact", Component: Contact },
      { path: "settings", Component: Settings },
      { path: "admin", Component: AdminDashboard },
      { path: "login", Component: Login },
      { path: "register", Component: Login },
    ],
  },
]);
