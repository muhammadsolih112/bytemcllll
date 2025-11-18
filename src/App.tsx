import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Bans from "./pages/Bans";
import Mutes from "./pages/Mutes";
import Kicks from "./pages/Kicks";
import NotFound from "./pages/NotFound";
import Rules from "./pages/Rules";
import SearchPage from "./pages/Search";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bytemc" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/bans" element={<Bans />} />
          <Route path="/mutes" element={<Mutes />} />
          <Route path="/kicks" element={<Kicks />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/rules" element={<Rules />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
