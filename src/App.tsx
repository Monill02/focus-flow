import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUserId, getActiveSessionId } from "@/lib/store";

import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import SessionSetup from "./pages/SessionSetup";
import Cockpit from "./pages/Cockpit";
import Reflection from "./pages/Reflection";
import BuilderLog from "./pages/BuilderLog";
import Settings from "./pages/Settings";
import BountyView from "./pages/BountyView";
import BountyCaught from "./pages/BountyCaught";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userId = getCurrentUserId();
  if (!userId) return <Navigate to="/onboard" replace />;

  // If user has active session, redirect to cockpit
  const activeSessionId = getActiveSessionId();
  if (activeSessionId && !window.location.pathname.startsWith("/session/")) {
    return <Navigate to={`/session/${activeSessionId}`} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/session/new" element={<ProtectedRoute><SessionSetup /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><Cockpit /></ProtectedRoute>} />
          <Route path="/session/:id/reflect" element={<ProtectedRoute><Reflection /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><BuilderLog /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* Public bounty routes */}
          <Route path="/bounty/:uuid" element={<BountyView />} />
          <Route path="/bounty/:uuid/caught" element={<BountyCaught />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
