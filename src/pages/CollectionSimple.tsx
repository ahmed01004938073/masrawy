import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CollectionSimplePage = () => {
  const [companies, setCompanies] = useState([
    {
      id: "sc1",
      name: "شركة التوصيل السريع",
      phone: "01XXXXXXXXX",
      balance: 12500,
    },
    {
      id: "sc2",
      name: "شركة النقل المتحدة",
      phone: "01XXXXXXXXX",
      balance: 8700,
    },
    {
      id: "sc3",
      name: "شركة الشحن الدولية",
      phone: "01XXXXXXXXX",
      balance: 15200,
    },
  ]);

  const [payments, setPayments] = useState([
    {
      id: "p1",
      companyId: "sc1",
      amount: 5000,
      date: "2023-06-10",
      paymentMethod: "تحويل بنكي",
    },
    {
      id: "p2",
      companyId: "sc2",
      amount: 3000,
      date: "2023-06-12",
      paymentMethod: "نقدي",
    },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">التحصيل والمتابعة (مبسط)</h1>

        <Card>
          <CardHeader>
            <CardTitle>شركات الشحن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-right">الاسم</th>
                    <th className="border p-2 text-center">رقم الهاتف</th>
                    <th className="border p-2 text-center">المستحقات</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b">
                      <td className="border p-2 text-right">{company.name}</td>
                      <td className="border p-2 text-center">{company.phone}</td>
                      <td className="border p-2 text-center text-red-600">{company.balance} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-right">الشركة</th>
                    <th className="border p-2 text-center">المبلغ</th>
                    <th className="border p-2 text-center">طريقة الدفع</th>
                    <th className="border p-2 text-center">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const company = companies.find(c => c.id === payment.companyId);
                    return (
                      <tr key={payment.id} className="border-b">
                        <td className="border p-2 text-right">{company?.name || "غير معروف"}</td>
                        <td className="border p-2 text-center text-green-600">{payment.amount} ج.م</td>
                        <td className="border p-2 text-center">{payment.paymentMethod}</td>
                        <td className="border p-2 text-center">{payment.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-100 rounded-md">
          <h2 className="text-lg font-bold mb-2">معلومات التصحيح:</h2>
          <p>عدد شركات الشحن: {companies.length}</p>
          <p>عدد المدفوعات: {payments.length}</p>
          <p>إجمالي المستحقات: {companies.reduce((sum, company) => sum + company.balance, 0)} ج.م</p>
          <p>إجمالي المدفوعات: {payments.reduce((sum, payment) => sum + payment.amount, 0)} ج.م</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollectionSimplePage;
