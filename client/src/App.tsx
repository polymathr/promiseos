import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CaptureForm from "./components/CaptureForm";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import People from "./pages/People";
import PromiseDetail from "./pages/PromiseDetail";
import Promises from "./pages/Promises";
import Settings from "./pages/Settings";
import Today from "./pages/Today";
import Welcome from "./pages/Welcome";

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Switch><Route path="/" component={Today} /><Route path="/welcome" component={Welcome} /><Route path="/capture" component={CaptureForm} /><Route path="/promises" component={Promises} /><Route path="/promises/:id" component={PromiseDetail} /><Route path="/people" component={People} /><Route path="/settings" component={Settings} /><Route path="/invite/:token" component={Invite} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
