import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import CreateQuote from "./pages/CreateQuote";
import ModifyQuote from "./pages/ModifyQuote";
import ClientDetails from "./pages/ClientDetails";
import CustomQuoteNumber from "./pages/CustomQuoteNumber";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CompanySettingsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/create-quote" element={<CreateQuote />} />
            <Route path="/modify-quote/:id" element={<ModifyQuote />} />
            <Route path="/client-details" element={<ClientDetails />} />
            <Route path="/custom-quote-number" element={<CustomQuoteNumber />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CompanySettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
