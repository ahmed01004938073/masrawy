import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import { getStoredCart, saveStoredCart } from "@/services/marketerService";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  color?: string;
  size?: string;
  basePrice: number;
  sellPrice?: number;
  quantity: number;
  image: string;
  availableColors?: string[];
  availableSizes?: string[];
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updatePrice: (id: string, price: number) => void;
  updateColor: (id: string, color: string) => void;
  updateSize: (id: string, size: string) => void;
  clearCart: () => void;
  cartCount: number;
  totalCommission: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const isInitialLoad = useRef(true);

  // Load Cart Logic
  useEffect(() => {
    const loadCart = async () => {
      if (isLoading) return;

      if (user) {
        // 1. Load Remote Cart
        const remoteCart = await getStoredCart(user.id);
        const finalCart = remoteCart || [];
        setCartItems(finalCart);
      } else {
        setCartItems([]);
      }
      isInitialLoad.current = false;
    };

    loadCart();
  }, [user, isLoading]);

  // Save Cart Logic
  useEffect(() => {
    if (isLoading || isInitialLoad.current) return;

    if (user) {
      // Save Remote
      saveStoredCart(user.id, cartItems);
    }
  }, [cartItems, user, isLoading]);

  const addToCart = (item: Omit<CartItem, "id">) => {
    const itemId = `${item.productId}-${Date.now()}`;
    setCartItems((prev) => [...prev, { ...item, id: itemId }]);
    toast({
      title: "تمت الإضافة للسلة",
      description: `تم إضافة ${item.name} إلى السلة`,
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف المنتج من السلة",
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updatePrice = (id: string, price: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sellPrice: price } : item))
    );
  };

  const updateColor = (id: string, color: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, color } : item))
    );
  };

  const updateSize = (id: string, size: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, size } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalCommission = cartItems.reduce(
    (sum, item) => sum + ((item.sellPrice || item.basePrice) - item.basePrice) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        updateColor,
        updateSize,
        clearCart,
        cartCount,
        totalCommission,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
