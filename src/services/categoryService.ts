import { API_URL } from "@/config/apiConfig";

// واجهة القسم
export interface Category {
  id: number;
  name: string;
  description?: string; // وصف القسم
  imageUrl: string;
  productsCount: number;
  active: boolean; // Deprecated, use status
  status: 'active' | 'inactive';
  order: number; // ترتيب القسم (للعرض في الموقع)
  showInHomepage: boolean; // عرض في الصفحة الرئيسية
  slug?: string; // الرابط المخصص للقسم
  seoTitle?: string; // عنوان SEO
  seoDescription?: string; // وصف SEO
}

import { fetchJson } from "@/utils/apiUtils";


const getStoredCategories = async (): Promise<Category[]> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/categories`);
    console.log("📦 Stored Categories:", data ? data.length : 0);
    // Migration: ensure status exists
    return (data || []).map((c: any) => ({
      ...c,
      status: c.status || (c.active ? 'active' : 'inactive'),
      active: c.active !== undefined ? c.active : (c.status === 'active' || c.status === 'نشط')
    }));
  } catch (error) {
    console.error("Failed to get stored categories:", error);
    return [];
  }
};

const saveStoredCategories = async (items: Category[]) => {
  console.log("💾 Saving Categories:", items.length);
  // Ensure sync
  const sanitizedItems = items.map(c => ({
    ...c,
    active: (c.status as any) === 'active' || (c.status as any) === 'نشط'
  }));
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'categories', value: sanitizedItems })
  });
};

// تهيئة الأقسام في API
export const initializeCategories = async (): Promise<void> => {
  // تم إزالة البيانات الافتراضية الثابتة بناءً على طلب المستخدم
};

// الحصول على الأقسام
export const getCategories = async (page?: number, limit?: number): Promise<Category[] | { data: Category[], total: number, page: number, totalPages: number }> => {
  try {
    const url = (page && limit) ? `${API_URL}/categories?page=${page}&limit=${limit}` : `${API_URL}/categories`;
    const data = await fetchJson(url);

    const mapCategory = (c: any) => ({
      ...c,
      id: Number(c.id),
      imageUrl: c.image || c.imageUrl || null,
      active: c.active === 1 || c.active === true,
      status: (c.active === 1 || c.active === 'active') ? 'active' : 'inactive'
    });

    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(mapCategory)
      };
    }

    return (data || []).map(mapCategory);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};



// الحصول على قسم محدد بواسطة المعرف
export const getCategoryById = async (id: number): Promise<Category | undefined> => {
  const result = await getCategories();
  const categories = Array.isArray(result) ? result : result.data;
  return categories.find(category => category.id === id);
};

// إضافة قسم جديد
export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const data = await fetchJson(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });

  return { ...category, id: data.id } as Category;
};

// تحديث قسم موجود
export const updateCategory = async (updatedCategory: Category): Promise<Category | null> => {
  await fetchJson(`${API_URL}/categories`, {
    method: 'POST', // Backend uses REPLACE INTO
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCategory)
  });

  return updatedCategory;
};

// تغيير حالة تنشيط القسم
export const toggleCategoryActive = async (id: number, active: boolean): Promise<boolean> => {
  const data = await fetchJson(`${API_URL}/categories/toggle-active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, active })
  });

  return data.success;
};

// حذف قسم
export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    await fetchJson(`${API_URL}/categories/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (e) {
    return false;
  }
};
