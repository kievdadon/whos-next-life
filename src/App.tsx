import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Delivery from "./pages/Delivery";
import WellnessChat from "./pages/WellnessChat";
import GigBrowse from "./pages/GigBrowse";
import FamilyGroupChat from "./pages/FamilyGroupChat";
import DeliveryDriverApplication from "./pages/DeliveryDriverApplication";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/wellness-chat" element={<WellnessChat />} />
            <Route path="/gig-browse" element={<GigBrowse />} />
            <Route path="/family-chat" element={<FamilyGroupChat />} />
            <Route path="/driver-application" element={<DeliveryDriverApplication />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Navigation />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
