import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CommerceDashboard from "./pages/commerce/CommerceDashboard";
import UserDashboard from "./pages/user/UserDashboard";
import Ranking from "./pages/Ranking";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";
import ProtectedCommerceRoute from "./components/auth/ProtectedCommerceRoute";
import ProtectedUserRoute from "./components/auth/ProtectedUserRoute";

// Create QueryClient outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/commerce" 
                  element={
                    <ProtectedCommerceRoute>
                      <CommerceDashboard />
                    </ProtectedCommerceRoute>
                  } 
                />
                <Route 
                  path="/minha-conta" 
                  element={
                    <ProtectedUserRoute>
                      <UserDashboard />
                    </ProtectedUserRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
