import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Send,
  Package,
  Truck,
  MapPin,
  Phone,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getOrdersBySection } from "@/services/orderService";
import { Order } from "@/pages/Orders";

// شركات الشحن المتاحة
const SHIPPING_COMPANIES = [
  { id: "aramex", name: "أرامكس", phone: "16023", hasAPI: true },
  { id: "fedex", name: "فيديكس", phone: "19633", hasAPI: true },
  { id: "dhl", name: "DHL", phone: "19633", hasAPI: true },
  { id: "egypt_post", name: "بوستا مصر", phone: "16789", hasAPI: false },
  { id: "speedy", name: "سبيدي", phone: "19991", hasAPI: false },
  { id: "eagle", name: "إيجل", phone: "16050", hasAPI: false },
  { id: "fast_cargo", name: "فاست كارجو", phone: "19997", hasAPI: false },
  { id: "mylerz", name: "مايلرز", phone: "15543", hasAPI: false },
  { id: "bosta", name: "بوستا", phone: "15204", hasAPI: false }
];

const ShippingExport = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv" | "pdf">("excel");

  useEffect(() => {
    // جلب الطلبات الجاهزة للشحن
    const shippingOrders = getOrdersBySection("shipping");
    setOrders(shippingOrders);
  }, []);

  // تحديد/إلغاء تحديد طلب
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // تحديد/إلغاء تحديد جميع الطلبات
  const toggleAllOrders = () => {
    setSelectedOrders(
      selectedOrders.length === orders.length
        ? []
        : orders.map(order => order.id)
    );
  };

  // تصدير الطلبات
  const exportOrders = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طلب واحد على الأقل للتصدير",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompany) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار شركة الشحن",
        variant: "destructive"
      });
      return;
    }

    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    const company = SHIPPING_COMPANIES.find(c => c.id === selectedCompany);

    // إنشاء البيانات للتصدير
    const exportData = selectedOrdersData.map((order, index) => ({
      "رقم الطلب": order.orderNumber,
      "اسم العميل": order.customerName,
      "رقم الهاتف": order.customerPhone,
      "العنوان": order.customerAddress,
      "المحافظة": order.province,
      "المدينة": order.city,
      "قيمة الطلب": order.totalAmount,
      "رسوم الشحن": order.shippingFee,
      "طريقة الدفع": order.paymentMethod === "cash" ? "كاش" : "كارت",
      "ملاحظات": order.notes || "",
      "المسوق": order.marketerName,
      "تاريخ الطلب": new Date(order.createdAt).toLocaleDateString('ar-EG')
    }));

    // تحويل إلى CSV
    if (exportFormat === "csv" || exportFormat === "excel") {
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `طلبات_${company?.name}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }

    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير ${selectedOrders.length} طلب لشركة ${company?.name}`
    });
  };

  // طباعة ملصقات الشحن
  const printLabels = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طلب واحد على الأقل للطباعة",
        variant: "destructive"
      });
      return;
    }

    // فتح نافذة طباعة
    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ملصقات الشحن</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; }
              .label { 
                border: 2px solid #000; 
                padding: 20px; 
                margin: 10px; 
                page-break-after: always;
                width: 400px;
              }
              .header { font-size: 18px; font-weight: bold; text-align: center; }
              .info { margin: 10px 0; }
              .barcode { text-align: center; font-family: monospace; font-size: 24px; }
            </style>
          </head>
          <body>
            ${selectedOrdersData.map(order => `
              <div class="label">
                <div class="header">ملصق شحن - ${order.orderNumber}</div>
                <div class="info"><strong>العميل:</strong> ${order.customerName}</div>
                <div class="info"><strong>الهاتف:</strong> ${order.customerPhone}</div>
                <div class="info"><strong>العنوان:</strong> ${order.customerAddress}</div>
                <div class="info"><strong>المحافظة:</strong> ${order.province} - ${order.city}</div>
                <div class="info"><strong>القيمة:</strong> ${order.totalAmount} ج.م</div>
                <div class="info"><strong>المسوق:</strong> ${order.marketerName}</div>
                <div class="barcode">||||| ${order.orderNumber} |||||</div>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "تم إرسال للطباعة",
      description: `تم إرسال ${selectedOrders.length} ملصق للطباعة`
    });
  };

  // إرسال عبر WhatsApp
  const sendViaWhatsApp = () => {
    if (selectedOrders.length === 0 || !selectedCompany) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الطلبات وشركة الشحن",
        variant: "destructive"
      });
      return;
    }

    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    const company = SHIPPING_COMPANIES.find(c => c.id === selectedCompany);

    let message = `🚚 طلبات شحن جديدة لشركة ${company?.name}\n\n`;

    selectedOrdersData.forEach((order, index) => {
      message += `📦 طلب رقم: ${order.orderNumber}\n`;
      message += `👤 العميل: ${order.customerName}\n`;
      message += `📱 الهاتف: ${order.customerPhone}\n`;
      message += `📍 العنوان: ${order.customerAddress}\n`;
      message += `🏙️ المحافظة: ${order.province} - ${order.city}\n`;
      message += `💰 القيمة: ${order.totalAmount} ج.م\n`;
      message += `📝 ملاحظات: ${order.notes || "لا توجد"}\n`;
      message += `-------------------\n`;
    });

    const whatsappUrl = `https://wa.me/${company?.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "تم الإرسال",
      description: `تم فتح WhatsApp لإرسال ${selectedOrders.length} طلب`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تصدير طلبات الشحن</h1>
          <p className="text-muted-foreground">
            تصدير وإرسال الطلبات لشركات الشحن
          </p>
        </div>

        {/* إعدادات التصدير */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              إعدادات التصدير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="company">شركة الشحن</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر شركة الشحن" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_COMPANIES.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          {company.name}
                          {company.hasAPI && <Badge variant="secondary">API</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">صيغة التصدير</Label>
                <Select value={exportFormat} onValueChange={(value: "excel" | "csv" | "pdf") => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={exportOrders} className="flex-1">
                  <Download className="ml-2 h-4 w-4" />
                  تصدير ({selectedOrders.length})
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={printLabels}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة ملصقات
              </Button>
              <Button variant="outline" onClick={sendViaWhatsApp}>
                <Send className="ml-2 h-4 w-4" />
                إرسال واتساب
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* قائمة الطلبات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                الطلبات الجاهزة للشحن ({orders.length})
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onCheckedChange={toggleAllOrders}
                />
                <Label>تحديد الكل</Label>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد طلبات جاهزة للشحن
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="font-semibold">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">{order.customerName}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.customerPhone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.province} - {order.city}</span>
                      </div>

                      <div className="text-left">
                        <div className="font-semibold text-green-600">{order.totalAmount} ج.م</div>
                        <div className="text-sm text-muted-foreground">{order.marketerName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ShippingExport;

