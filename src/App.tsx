import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ImportStatement = lazy(() => import("./pages/ImportStatement"));
const Goals = lazy(() => import("./pages/Goals"));
const Help = lazy(() => import("./pages/Help"));
const Article = lazy(() => import("./pages/Article"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Features = lazy(() => import("./pages/Features"));
const Plans = lazy(() => import("./pages/Plans"));
const Subscription = lazy(() => import("./pages/Subscription"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Education = lazy(() => import("./pages/Education"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const WhatsAppSettings = lazy(() => import("./pages/WhatsAppSettings"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const FairLanding = lazy(() => import("./pages/FairLanding"));
const FairQRCodePage = lazy(() => import("./pages/FairQRCodePage"));
const FairSlidePage = lazy(() => import("./pages/FairSlidePage"));
const AdminEducation = lazy(() => import("./pages/AdminEducation"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load ChatBot - only loads when needed
const ChatBot = lazy(() => import("@/components/support-chat/ChatBot").then(m => ({ default: m.ChatBot })));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/importar-extrato" element={<ImportStatement />} />
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
            <Route path="/feira" element={<FairLanding />} />
            <Route path="/feira/qrcode" element={<FairQRCodePage />} />
            <Route path="/feira/slide" element={<FairSlidePage />} />
            <Route path="/admin/education" element={<AdminEducation />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
