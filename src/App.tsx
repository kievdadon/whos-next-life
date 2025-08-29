import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import MarketplaceChat from "./pages/MarketplaceChat";
import SellItem from "./pages/SellItem";
import Delivery from "./pages/Delivery";
import WellnessChat from "./pages/WellnessChat";
import GigBrowse from "./pages/GigBrowse";
import FamilyGroupChat from "./pages/FamilyGroupChat";
import DeliveryDriverApplication from "./pages/DeliveryDriverApplication";
import DriverDashboard from "./pages/DriverDashboard";
import Auth from "./pages/Auth";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CheckoutPro from "./pages/CheckoutPro";
import CheckoutElite from "./pages/CheckoutElite";
import CheckoutVeteran from "./pages/CheckoutVeteran";
import BusinessMarketplace from "./pages/BusinessMarketplace";
import BusinessRegistration from "./pages/BusinessRegistration";
import BusinessDashboard from "./pages/BusinessDashboard";
import BrandPartnership from "./pages/BrandPartnership";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/subscription-plans" element={<SubscriptionPlans />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/checkout/pro" element={<CheckoutPro />} />
              <Route path="/checkout/elite" element={<CheckoutElite />} />
              <Route path="/checkout/veteran" element={<CheckoutVeteran />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/chat" element={<MarketplaceChat />} />
              <Route path="/marketplace/chat/:conversationId" element={<MarketplaceChat />} />
            <Route path="/sell-item" element={<SellItem />} />
            <Route path="/business-marketplace" element={<BusinessMarketplace />} />
              <Route path="/business-registration" element={<BusinessRegistration />} />
              <Route path="/business-dashboard" element={<BusinessDashboard />} />
              <Route path="/brand-partnership" element={<BrandPartnership />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/wellness-chat" element={<WellnessChat />} />
              <Route path="/gig-browse" element={<GigBrowse />} />
              <Route path="/family-chat" element={<FamilyGroupChat />} />
              <Route path="/driver-application" element={<DeliveryDriverApplication />} />
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Navigation />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
