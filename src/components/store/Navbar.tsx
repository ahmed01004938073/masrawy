import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/store/NotificationsContext";
import { useCart } from "@/contexts/store/CartContext";
import { useFavorites } from "@/contexts/store/FavoritesContext";
import { useProducts } from "@/contexts/store/ProductsContext";
import { useUser } from "@/contexts/store/UserContext";
import { getSiteSettings } from "@/services/siteSettingsService";
import { getMarketerStats } from "@/services/marketerService";
import {
  ShoppingBag,
  Search,
  Bell,
  Heart,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Package,
  Trash2,
  CheckCheck,
  Wallet,
  Home,
  List
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("متجر الكتروني");
  const [siteLogo, setSiteLogo] = useState("");
  const [storeNameImage, setStoreNameImage] = useState("");
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  const { products } = useProducts();
  const { logout, user } = useUser();

  const favoritesCount = favorites.length;

  // تحميل رصيد المحفظة للمسوق
  const { data: marketerStats } = useQuery({
    queryKey: ['marketer-stats-navbar', user?.id],
    queryFn: () => getMarketerStats(user?.id || ""),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const formatTime = useCallback((date: Date | string) => {
    const now = new Date();
    const targetDate = new Date(date);
    // Validate date
    if (isNaN(targetDate.getTime())) return "غير محدد";

    const diff = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }, []);

  // Load site settings using React Query for automatic updates
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName || settings.siteName || "متجر الكتروني");
      setSiteLogo(settings.logo || "");
      setStoreNameImage(settings.storeNameImage || "");
    }
  }, [settings]);

  // Sync search input with URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || '';
    setSearchQuery(searchParam);
  }, [location.search]);

  // Auto-search with debounce
  useEffect(() => {
    if (location.pathname !== '/products') return;

    const delayDebounce = setTimeout(() => {
      const currentParams = new URLSearchParams(location.search);
      const currentSearch = currentParams.get('search') || '';

      // Only navigate if the search query is different from the current URL param
      if (searchQuery.trim() !== currentSearch) {
        if (searchQuery.trim()) {
          navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        } else if (!currentSearch && !currentParams.has('category')) {
          // If already on /products without search or category, no need to navigate
          return;
        } else {
          navigate("/products");
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, navigate, location]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(location.search);
    const currentSearch = currentParams.get('search') || '';

    if (searchQuery.trim() !== currentSearch) {
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate("/products");
      }
    }
  }, [navigate, searchQuery, location.search]);

  const activePath = location.pathname;

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 shadow-sm bg-white dark:bg-zinc-950 border-b border-border/40">
        <div className="max-w-[1440px] mx-auto px-6">
          {/* Main Navbar */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/products")}
            >
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={displayName}
                  className="h-10 w-10 object-cover rounded-full transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              {storeNameImage ? (
                <img
                  src={storeNameImage}
                  alt={displayName}
                  className="h-10 w-auto object-contain hidden sm:block"
                />
              ) : (
                <h1 className="text-xl md:text-2xl font-bold text-primary hidden sm:block">
                  {displayName}
                </h1>
              )}
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-2">
              <NavLinks activePath={activePath} onNavigate={() => { }} />
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-10"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2">
              <ModeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 hover:bg-blue-600 text-white border-none shadow-sm">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-0 z-[100]">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">الإشعارات</h3>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                        <CheckCheck className="w-3 h-3 ml-1" />
                        تعليم الكل كمقروء
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>لا توجد إشعارات جديدة</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${!notif.read ? "bg-primary/5" : ""}`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-0.5">{notif.title}</p>
                                <p className="text-sm text-muted-foreground mb-1">{notif.message}</p>
                                <p className="text-xs text-muted-foreground">{formatTime(notif.created_at)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={() => navigate("/favorites")}>
                <Heart className={`w-5 h-5 ${activePath === "/favorites" ? "fill-primary text-primary" : ""}`} />
              </Button>

              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 hover:bg-blue-600 text-white border-none shadow-sm">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="w-4 h-4 ml-2" />
                    حسابي
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-primary px-4 pt-3 pb-5 rounded-b-3xl shadow-lg">

          {/* Row 1: Avatar + Name (left) | Wallet (right) */}
          <div className="flex items-center justify-between mb-3">
            {/* Avatar + Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
                <span className="text-white font-black text-base font-cairo">
                  {user?.name?.charAt(0) || "م"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 font-bold leading-none mb-0.5">أهلاً بك 👋</span>
                <span className="text-sm font-black text-white font-cairo leading-none truncate max-w-[120px]">
                  {user?.name || "ضيفنا العزيز"}
                </span>
              </div>
            </div>

            {/* Wallet Balance */}
            <div
              className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/20 cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate("/wallet")}
            >
              <Wallet className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-black text-white font-cairo">
                {marketerStats?.available?.toLocaleString() ?? 0} ج.م
              </span>
            </div>
          </div>

          {/* Row 2: Search Bar + Bell + Cart */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-9 h-9 bg-white dark:bg-zinc-900 border-none rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-white/50 font-cairo text-sm placeholder:text-slate-400"
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Bell */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:scale-90 transition-transform border border-white/20 shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Favorites */}
            <button
              onClick={() => navigate("/favorites")}
              className="relative w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center active:scale-90 transition-transform border border-white/20 shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Heart className={`w-4 h-4 ${activePath === "/favorites" ? "fill-white text-white" : "text-white"}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full border border-white">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>


      {/* Spacers */}
      <div className="md:hidden h-[110px]" />
      <div className="hidden md:block h-[88px]" />

      {/* Bottom Nav */}
      <BottomNavigation activePath={activePath} navigate={navigate} cartCount={cartCount} />
    </>
  );
};

// Extracted NavLinks component
const NavLinks = ({ mobile = false, onNavigate = () => { }, activePath }: { mobile?: boolean; onNavigate?: () => void, activePath: string }) => {
  const navigate = useNavigate();
  const isActive = (path: string) => activePath === path;

  return (
    <div className={`flex ${mobile ? 'flex-col space-y-2' : 'items-center gap-2'}`}>
      <button
        onClick={() => { navigate("/products"); onNavigate(); }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/products")
          ? "bg-primary text-primary-foreground shadow-glow"
          : "text-foreground hover:bg-accent"
          }`}
      >
        <Home className="w-4 h-4 ml-2 inline" />
        الرئيسية
      </button>

      <button
        onClick={() => { navigate("/orders"); onNavigate(); }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/orders")
          ? "bg-primary text-primary-foreground shadow-glow"
          : "text-foreground hover:bg-accent"
          }`}
      >
        <Package className="w-4 h-4 ml-2 inline" />
        طلباتي
      </button>

      <button
        onClick={() => { navigate("/wallet"); onNavigate(); }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/wallet")
          ? "bg-primary text-primary-foreground shadow-glow"
          : "text-foreground hover:bg-accent"
          }`}
      >
        <Wallet className="w-4 h-4 ml-2 inline" />
        محفظتي
      </button>
    </div>
  );
};

// Extracted BottomNavigation component
const BottomNavigation = ({ activePath, navigate, cartCount = 0 }: { activePath: string, navigate: (path: string) => void, cartCount?: number }) => {
  const isActive = (path: string) => activePath === path;

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg" style={{ position: 'fixed' }}>
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-[2.5rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] px-6 py-4 flex items-center justify-between pointer-events-auto overflow-visible">
        {/* Cart */}
        <button
          onClick={() => navigate("/cart")}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 bg-transparent border-none outline-none !shadow-none !before:hidden ${isActive("/cart") ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-zinc-400"}`}
        >
          <ShoppingCart className="w-6 h-6" />
          {isActive("/cart") && <span className="text-[10px] font-bold font-cairo">السلة</span>}
        </button>

        {/* Orders */}
        <button
          onClick={() => navigate("/orders")}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 bg-transparent border-none outline-none !shadow-none !before:hidden ${isActive("/orders") ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-zinc-400"}`}
        >
          <Package className="w-6 h-6" />
          {isActive("/orders") && <span className="text-[10px] font-bold font-cairo">طلباتي</span>}
        </button>

        {/* Home */}
        <button
          onClick={() => navigate("/products")}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 bg-transparent border-none outline-none !shadow-none !before:hidden ${isActive("/products") ? "text-emerald-600 dark:text-emerald-400 scale-125" : "text-zinc-400"}`}
        >
          <Home className="w-7 h-7" />
          {isActive("/products") && <span className="text-[10px] font-bold font-cairo">الرئيسية</span>}
        </button>

        {/* Wallet */}
        <button
          onClick={() => navigate("/wallet")}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 bg-transparent border-none outline-none !shadow-none !before:hidden ${isActive("/wallet") ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-zinc-400"}`}
        >
          <Wallet className="w-6 h-6" />
          {isActive("/wallet") && <span className="text-[10px] font-bold font-cairo">المحفظة</span>}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 bg-transparent border-none outline-none !shadow-none !before:hidden ${isActive("/profile") ? "text-emerald-600 dark:text-emerald-400 scale-110" : "text-zinc-400"}`}
        >
          <User className="w-6 h-6" />
          {isActive("/profile") && <span className="text-[10px] font-bold font-cairo">حسابي</span>}
        </button>
      </div>

      {/* Cart Badge - outside the pill to avoid backdrop-blur clipping */}
      {cartCount > 0 && (
        <div
          onClick={() => navigate("/cart")}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '22px',
            minWidth: '22px',
            height: '22px',
            fontSize: '12px',
            fontWeight: '900',
            background: '#ef4444',
            color: 'white',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            zIndex: 10001,
            boxShadow: '0 0 0 2.5px white',
            cursor: 'pointer',
          }}
        >
          {cartCount > 99 ? "99+" : cartCount}
        </div>
      )}
    </div>
  );
};

export default Navbar;