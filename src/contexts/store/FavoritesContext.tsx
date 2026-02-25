import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/store/UserContext';
import { toast } from '@/hooks/use-toast';
import { API_URL } from '@/config/apiConfig';

interface FavoritesContextType {
  favorites: string[]; // Changed to string IDs to match API/DB standard
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useUser();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load Favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (isLoading) return;

      if (user) {
        try {
          const res = await fetch(`${API_URL}/favorites/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setFavorites(data);
          }
        } catch (e) {
          console.error("Failed to load favorites", e);
        }
      } else {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, [user, isLoading]);

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "يرجى تسجيل الدخول لإضافة المفضلة", variant: "destructive" });
      return;
    }

    // Optimistic Update
    const oldFavorites = [...favorites];
    const isFav = favorites.includes(productId);

    setFavorites(prev => isFav ? prev.filter(id => id !== productId) : [...prev, productId]);

    try {
      const res = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });

      if (!res.ok) {
        // Revert on failure
        setFavorites(oldFavorites);
        toast({ title: "خطأ", description: "فشل تحديث المفضلة", variant: "destructive" });
        return;
      }

      const data = await res.json();
      toast({
        title: data.status === "added" ? "تمت الإضافة للمفضلة" : "تم الحذف من المفضلة",
        description: data.status === "added" ? "تم إضافة المنتج لقائمة المفضلة" : "تم حذف المنتج من قائمة المفضلة",
      });

    } catch (e) {
      setFavorites(oldFavorites);
      console.error("Failed to toggle favorite", e);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
