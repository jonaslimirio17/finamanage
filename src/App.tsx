import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { ChatBot } from "@/components/support-chat/ChatBot";
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
// Temporarily disabled routes for landing page mode
// import Auth from "./pages/Auth";
// import Dashboard from "./pages/Dashboard";
// import Onboarding from "./pages/Onboarding";
// import ImportCSV from "./pages/ImportCSV";
// import Goals from "./pages/Goals";
// import Help from "./pages/Help";
// import Article from "./pages/Article";
// import PrivacyPolicy from "./pages/PrivacyPolicy";
// import Features from "./pages/Features";
// import Plans from "./pages/Plans";
// import About from "./pages/About";
// import Blog from "./pages/Blog";
// import Education from "./pages/Education";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
// import WhatsAppSettings from "./pages/WhatsAppSettings";
// import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Landing page only mode - set to false to restore all routes
const LANDING_ONLY_MODE = false;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {LANDING_ONLY_MODE ? (
            // Redirect all routes to coming soon page in landing mode
            <Route path="*" element={<ComingSoon />} />
          ) : (
            <>
              {/* Uncomment these routes when ready to restore full app */}
              {/* <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/import-csv" element={<ImportCSV />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/help" element={<Help />} />
              <Route path="/help/article/:id" element={<Article />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/features" element={<Features />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/education" element={<Education />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/whatsapp" element={<WhatsAppSettings />} />
              <Route path="*" element={<NotFound />} /> */}
            </>
          )}
        </Routes>
        {/* ChatBot temporarily disabled in landing mode */}
        {/* {!LANDING_ONLY_MODE && <ChatBot />} */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
