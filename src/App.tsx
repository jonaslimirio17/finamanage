import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatBot } from "@/components/support-chat/ChatBot";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import ImportCSV from "./pages/ImportCSV";
import Goals from "./pages/Goals";
import Help from "./pages/Help";
import Article from "./pages/Article";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Features from "./pages/Features";
import Plans from "./pages/Plans";
import Subscription from "./pages/Subscription";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Education from "./pages/Education";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import SecuritySettings from "./pages/SecuritySettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/import-csv" element={<ImportCSV />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help/article/:id" element={<Article />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/features" element={<Features />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/education" element={<Education />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/whatsapp" element={<WhatsAppSettings />} />
          <Route path="/security" element={<SecuritySettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
