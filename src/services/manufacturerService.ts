import { API_URL } from "@/config/apiConfig";

// واجهة المصنع
export interface Manufacturer {
    id: string;
    name: string;
    address: string;
    phone: string;
    createdAt: string;
}

import { fetchJson } from "@/utils/apiUtils";


const getStoredManufacturers = async (): Promise<Manufacturer[]> => {
    try {
        const data = await fetchJson(`${API_URL}/kv/manufacturers`);
        return data || [];
    } catch {
        return [];
    }
};

const saveStoredManufacturers = async (items: Manufacturer[]) => {
    await fetchJson(`${API_URL}/kv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'manufacturers', value: items })
    });
};

// البيانات الافتراضية للمصانع
const defaultManufacturers: Manufacturer[] = [
    {
        id: 'm1',
        name: 'مصنع النور',
        address: 'العاشر من رمضان - المنطقة الصناعية',
        phone: '01000000001',
        createdAt: new Date().toISOString()
    },
    {
        id: 'm2',
        name: 'مصنع البركة',
        address: '6 أكتوبر - المنطقة الثالثة',
        phone: '01100000002',
        createdAt: new Date().toISOString()
    }
];

// دالة لجلب جميع المصانع
export const getManufacturers = async (): Promise<Manufacturer[]> => {
    const manufacturers = await getStoredManufacturers();
    if (!manufacturers || (manufacturers as any).length === 0) {
        // Initialize if empty (optional, but consistent with partial behavior)
        // await saveStoredManufacturers(defaultManufacturers);
        // return defaultManufacturers;
        return [];
    }
    return manufacturers;
};

// دالة لجلب مصنع بواسطة المعرف
export const getManufacturerById = async (id: string): Promise<Manufacturer | undefined> => {
    const manufacturers = await getManufacturers();
    return manufacturers.find(m => m.id === id);
};

// دالة لإضافة مصنع جديد
export const addManufacturer = async (manufacturer: Omit<Manufacturer, 'id' | 'createdAt'>): Promise<Manufacturer> => {
    const manufacturers = await getManufacturers();
    const newManufacturer: Manufacturer = {
        ...manufacturer,
        id: `m${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    manufacturers.push(newManufacturer);
    await saveStoredManufacturers(manufacturers);
    return newManufacturer;
};

// دالة لتحديث بيانات مصنع
export const updateManufacturer = async (id: string, updates: Partial<Manufacturer>): Promise<Manufacturer | null> => {
    const manufacturers = await getManufacturers();
    const index = manufacturers.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedManufacturer = { ...manufacturers[index], ...updates };
    manufacturers[index] = updatedManufacturer;
    await saveStoredManufacturers(manufacturers);
    return updatedManufacturer;
};

// دالة لحذف مصنع
export const deleteManufacturer = async (id: string): Promise<boolean> => {
    const manufacturers = await getManufacturers();
    const newManufacturers = manufacturers.filter(m => m.id !== id);

    if (manufacturers.length === newManufacturers.length) return false;

    await saveStoredManufacturers(newManufacturers);
    return true;
};
