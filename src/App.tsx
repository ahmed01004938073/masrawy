import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Admin Context
import { AuthProvider } from "./contexts/AuthContext";

// Store Contexts
import { UserProvider } from "@/contexts/store/UserContext";
import { NotificationsProvider } from "@/contexts/store/NotificationsContext";
import { CartProvider } from "@/contexts/store/CartContext";
import { WalletProvider } from "@/contexts/store/WalletContext";
import { OrdersProvider } from "@/contexts/store/OrdersContext";
import { FavoritesProvider } from "@/contexts/store/FavoritesContext";
import { ProductsProvider } from "@/contexts/store/ProductsContext";

import { registerServiceWorker } from "./utils/performance";
import ErrorBoundary from "./components/ErrorBoundary";
import { initializeSecurity, performSecurityAudit } from "./middleware/security";
import { initializeDeliveryOrders, initializeSampleOrders } from "./services/orderService";
import { initializeProducts } from "./services/productService";
import { initializeCategories } from "./services/categoryService";
import { initializeEmployees } from "./services/employeeService";
import { initializeUnifiedEmployees } from "./services/unifiedEmployeeService";
import { fixAllImages } from "./services/imageFixService";
import { getSiteSettings } from "./services/siteSettingsService";
// import { initializeShippingCompanies } from "./services/shippingCompanyService"; // Removed: legacy service deleted
import StoreStatusWrapper from "./components/StoreStatusWrapper";
import StoreProtectedRoute from "./components/StoreProtectedRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import SEOMetaTags from "./components/SEOMetaTags";
import VisitTracker from "./components/VisitTracker";

// Store Pages (Customer-facing)

import StoreLogin from "./pages/store/Login";
import StoreRegister from "./pages/store/Register";
import StoreProducts from "./pages/store/Products";
import StoreProductDetail from "./pages/store/ProductDetail";
import StoreCart from "./pages/store/Cart";
import StoreCartCheckout from "./pages/store/CartCheckout";
import StoreOrders from "./pages/store/Orders";
import StoreOrderDetail from "./pages/store/OrderDetail";
import StoreOrderConfirmation from "./pages/store/OrderConfirmation";
import StoreCategories from "./pages/store/Categories";
import StoreFavorites from "./pages/store/Favorites";
import StoreWallet from "./pages/store/Wallet";
import StoreProfile from "./pages/store/Profile";
import StoreForgotPassword from "./pages/store/ForgotPassword";
import StoreNotifications from "./pages/store/Notifications";
import StoreAbout from "./pages/store/About";
import StoreRefundPolicy from "./pages/store/RefundPolicy";
import StoreContact from "./pages/store/Contact";

// Admin Pages (Employee-only) - Lazy loaded
const AdminLogin = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const Products = lazy(() => import("./pages/Products"));
const ProductAttributes = lazy(() => import("./pages/ProductAttributes"));
const Orders = lazy(() => import("./pages/Orders"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const EditOrder = lazy(() => import("./pages/EditOrder"));
const Warehouse = lazy(() => import("./pages/Warehouse"));
const Shipping = lazy(() => import("./pages/Shipping"));
const InDelivery = lazy(() => import("./pages/InDelivery"));
const Archive = lazy(() => import("./pages/Archive"));
const Marketers = lazy(() => import("./pages/Marketers"));
const MarketerDetails = lazy(() => import("./pages/MarketerDetails"));
const Commissions = lazy(() => import("./pages/Commissions"));
const Employees = lazy(() => import("./pages/Employees"));
const ShippingSettings = lazy(() => import("./pages/ShippingSettings"));
const Settings = lazy(() => import("./pages/Settings"));
const SiteSettings = lazy(() => import("./pages/SiteSettings"));
const Manufacturers = lazy(() => import("./pages/Manufacturers"));
const DepartmentReports = lazy(() => import("./pages/DepartmentReports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Reports = lazy(() => import("./pages/Reports"));
const PurchaseDashboard = lazy(() => import("./pages/PurchaseDashboard"));
const PaymentConfirmation = lazy(() => import("./pages/admin/PaymentConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient();

initializeProducts();
initializeCategories();
initializeEmployees();
initializeUnifiedEmployees();

registerServiceWorker();


try {
  initializeSecurity();
  setTimeout(() => {
    const securityIssues = performSecurityAudit();
    if (securityIssues.length === 0) {
      console.log('✅ Security check complete');
    }
  }, 1000);
} catch (error) {
  console.warn('⚠️ Security init error:', error);
}

import SiteMetadataUpdater from "./components/SiteMetadataUpdater";
import SiteSettingsListener from "./components/SiteSettingsListener";
import ThemeApplicator from "./components/ThemeApplicator";
import { ThemeProvider } from "./components/theme-provider";
import { DynamicFavicon } from "./components/DynamicFavicon";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">جاري التحميل...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <SiteSettingsListener />
        <ThemeApplicator />
        <SiteMetadataUpdater />
        <DynamicFavicon />
        <SEOMetaTags />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <VisitTracker />
            <ErrorBoundary>
              <UserProvider>
                <AuthProvider>
                  <NotificationsProvider>
                    <CartProvider>
                      <WalletProvider>
                        <OrdersProvider>
                          <FavoritesProvider>
                            <ProductsProvider>
                              <Suspense fallback={<PageLoader />}>
                                <Routes>
                                  {/* Store Routes (Customer-facing) */}
                                  <Route path="/login" element={<StoreLogin />} />
                                  <Route path="/register" element={<StoreRegister />} />
                                  <Route path="/forgot-password" element={<StoreForgotPassword />} />
                                  <Route path="/about" element={<StoreAbout />} />
                                  <Route path="/refund-policy" element={<StoreRefundPolicy />} />
                                  <Route path="/contact" element={<StoreContact />} />
                                  <Route
                                    path="/products"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreProducts />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/product/:id"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreProductDetail />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/categories"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreCategories />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/cart"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreCart />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/cart/checkout"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreCartCheckout />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/orders"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreOrders />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/order/:id"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreOrderDetail />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/order-confirmation"
                                    element={
                                      <StoreProtectedRoute>
                                        <StoreStatusWrapper>
                                          <StoreOrderConfirmation />
                                        </StoreStatusWrapper>
                                      </StoreProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/favorites"
                                    element={
                                      <StoreStatusWrapper>
                                        <StoreFavorites />
                                      </StoreStatusWrapper>
                                    }
                                  />
                                  <Route
                                    path="/wallet"
                                    element={
                                      <StoreStatusWrapper>
                                        <StoreWallet />
                                      </StoreStatusWrapper>
                                    }
                                  />
                                  <Route
                                    path="/profile"
                                    element={
                                      <StoreStatusWrapper>
                                        <StoreProfile />
                                      </StoreStatusWrapper>
                                    }
                                  />
                                  <Route
                                    path="/notifications"
                                    element={
                                      <StoreStatusWrapper>
                                        <StoreNotifications />
                                      </StoreStatusWrapper>
                                    }
                                  />

                                  {/* Admin Routes (Employee-only) */}
                                  <Route path="/admin/login" element={<AdminLogin />} />
                                  <Route
                                    path="/admin/dashboard"
                                    element={
                                      <ProtectedRoute>
                                        <Dashboard />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/categories"
                                    element={
                                      <ProtectedRoute>
                                        <Categories />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/products"
                                    element={
                                      <ProtectedRoute>
                                        <Products />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/payment-confirmation"
                                    element={
                                      <ProtectedRoute>
                                        <PaymentConfirmation />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/orders"
                                    element={
                                      <ProtectedRoute>
                                        <Orders />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/products/attributes"
                                    element={
                                      <ProtectedRoute>
                                        <ProductAttributes />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/products/add"
                                    element={
                                      <ProtectedRoute>
                                        <AddProduct />
                                      </ProtectedRoute>
                                    }
                                  />
                                  {/* Route for compatibility with old links */}
                                  <Route
                                    path="/admin/add-product"
                                    element={
                                      <ProtectedRoute>
                                        <AddProduct />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/edit-product/:id"
                                    element={
                                      <ProtectedRoute>
                                        <EditProduct />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/products/:id"
                                    element={
                                      <ProtectedRoute>
                                        <ProductDetails />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/orders/:id"
                                    element={
                                      <ProtectedRoute>
                                        <OrderDetails />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/orders/edit/:id"
                                    element={
                                      <ProtectedRoute>
                                        <EditOrder />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/warehouse"
                                    element={
                                      <ProtectedRoute>
                                        <Warehouse />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/warehouse/orders/:id"
                                    element={
                                      <ProtectedRoute>
                                        <OrderDetails />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/shipping"
                                    element={
                                      <ProtectedRoute>
                                        <Shipping />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/in-delivery"
                                    element={
                                      <ProtectedRoute>
                                        <InDelivery />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/archive"
                                    element={
                                      <ProtectedRoute>
                                        <Archive />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/marketers"
                                    element={
                                      <ProtectedRoute>
                                        <Marketers />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/marketers/:id"
                                    element={
                                      <ProtectedRoute>
                                        <MarketerDetails />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/commissions"
                                    element={
                                      <ProtectedRoute>
                                        <Commissions />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/employees"
                                    element={
                                      <ProtectedRoute>
                                        <Employees />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/shipping-settings"
                                    element={
                                      <ProtectedRoute>
                                        <ShippingSettings />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/settings"
                                    element={
                                      <ProtectedRoute>
                                        <Settings />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/site-settings"
                                    element={
                                      <ProtectedRoute>
                                        <SiteSettings />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/manufacturers"
                                    element={
                                      <ProtectedRoute>
                                        <Manufacturers />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/department-reports"
                                    element={
                                      <ProtectedRoute>
                                        <DepartmentReports />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/notifications"
                                    element={
                                      <ProtectedRoute>
                                        <Notifications />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/reports"
                                    element={
                                      <ProtectedRoute>
                                        <Reports />
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/purchase-dashboard"
                                    element={
                                      <ProtectedRoute>
                                        <PurchaseDashboard />
                                      </ProtectedRoute>
                                    }
                                  />

                                  {/* Redirects for common missing paths */}
                                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                  <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

                                  {/* Root redirect */}
                                  <Route path="/" element={<Navigate to="/login" replace />} />

                                  {/* 404 */}
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </Suspense>
                            </ProductsProvider>
                          </FavoritesProvider>
                        </OrdersProvider>
                      </WalletProvider>
                    </CartProvider>
                  </NotificationsProvider>
                </AuthProvider>
              </UserProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider >
  );
};

export default App;
