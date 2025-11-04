import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import MarketplaceChat from "./pages/MarketplaceChat";
import SellItem from "./pages/SellItem";
import Delivery from "./pages/Delivery";
import WellnessChat from "./pages/WellnessChat";
import GigBrowse from "./pages/GigBrowse";
import WorkerProfile from "./pages/WorkerProfile";
import BrowseWorkers from "./pages/BrowseWorkers";
import MyGigApplications from "./pages/MyGigApplications";
import MyPostedGigs from "./pages/MyPostedGigs";
import PostGig from "./pages/PostGig";
import FamilyGroupChat from "./pages/FamilyGroupChat";
import DeliveryDriverApplication from "./pages/DeliveryDriverApplication";
import AdminDriverApplications from "./pages/AdminDriverApplications";
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
import StoreMenu from "./pages/StoreMenu";
import CategoryStores from "./pages/CategoryStores";
import OrderCheckout from "./pages/OrderCheckout";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Header from "./components/Header";
import AutoFeatureLauncher from "./components/AutoFeatureLauncher";
import VoiceAssistant from "./components/VoiceAssistant";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import MissionControl from "./pages/MissionControl";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <AutoFeatureLauncher />
          <VoiceAssistant />
          <div className="pt-16 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/subscription-plans" element={<SubscriptionPlans />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/checkout/pro" element={<CheckoutPro />} />
              <Route path="/checkout/elite" element={<CheckoutElite />} />
              <Route path="/checkout/veteran" element={<CheckoutVeteran />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/product/:id" element={<ProductDetail />} />
              <Route path="/marketplace/chat" element={<MarketplaceChat />} />
              <Route path="/marketplace/chat/:conversationId" element={<MarketplaceChat />} />
            <Route path="/sell-item" element={<SellItem />} />
            <Route path="/business-marketplace" element={<BusinessMarketplace />} />
              <Route path="/business-registration" element={<BusinessRegistration />} />
              <Route path="/business-dashboard" element={<BusinessDashboard />} />
              <Route path="/brand-partnership" element={<BrandPartnership />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/category-stores" element={<CategoryStores />} />
              <Route path="/store/:storeName" element={<StoreMenu />} />
        <Route path="/order-checkout" element={<OrderCheckout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/wellness-chat" element={<WellnessChat />} />
              <Route path="/gig-browse" element={<GigBrowse />} />
              <Route path="/worker-profile" element={<WorkerProfile />} />
              <Route path="/worker-profile/:workerId" element={<WorkerProfile />} />
              <Route path="/browse-workers" element={<BrowseWorkers />} />
              <Route path="/my-gig-applications" element={<MyGigApplications />} />
              <Route path="/my-posted-gigs" element={<MyPostedGigs />} />
              <Route path="/post-gig" element={<PostGig />} />
              <Route path="/family-chat" element={<FamilyGroupChat />} />
              <Route path="/driver-application" element={<DeliveryDriverApplication />} />
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              <Route path="/admin/driver-applications" element={<AdminDriverApplications />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/mission-control" element={<MissionControl />} />
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
