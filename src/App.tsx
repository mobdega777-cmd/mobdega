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
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";
import ProtectedCommerceRoute from "./components/auth/ProtectedCommerceRoute";
import ProtectedUserRoute from "./components/auth/ProtectedUserRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
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
);

export default App;
