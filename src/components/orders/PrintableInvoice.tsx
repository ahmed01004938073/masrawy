import React from "react";
import { Order, OrderItem } from "@/pages/Orders";
import { formatDate } from "@/lib/utils";

interface PrintableInvoiceProps {
  order: Order;
  companyName: string;
  companyLogo?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;

}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  order,
  companyName,
  companyLogo,
  companyPhone,
  companyEmail,
  companyAddress,

}) => {
  return (
    <div className="print-only" style={{ display: 'none' }}>
      <div style={{ width: '100mm', margin: '0 auto', padding: '5mm', fontSize: '10px', backgroundColor: 'white' }} id="printable-invoice">
        {/* Header - Logo and Name centered with refined styling */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '3mm', marginBottom: '4mm' }}>
          {companyLogo && (
            <div style={{ margin: '0', padding: '0', lineHeight: '0' }}>
              <img
                src={companyLogo}
                alt="Company Logo"
                style={{ maxHeight: '25mm', maxWidth: '50mm', objectFit: 'contain', display: 'inline-block', verticalAlign: 'bottom' }}
              />
            </div>
          )}
          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '28px',
            fontWeight: '900',
            margin: '0',
            padding: '0',
            lineHeight: '1.2',
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>{companyName}</h1>
        </div>

        {/* Customer Information Section Header */}
        <div style={{ borderBottom: '1px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2mm' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>بيانات العميل</h2>
            <div style={{ textAlign: 'left', fontSize: '10px', fontWeight: 'bold' }}>
              <div style={{ fontSize: '12px', fontWeight: '900' }}>رقم الطلب: #{order.orderNumber}</div>
              <div style={{ fontWeight: 'normal', color: '#333', marginTop: '1mm' }}>التاريخ: {formatDate(order.createdAt)}</div>
            </div>
          </div>
          <div style={{ fontSize: '9px', marginBottom: '1mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
              <span style={{ fontWeight: 'bold' }}>الاسم:</span>
              <span>{order.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
              <span style={{ fontWeight: 'bold' }}>الهاتف:</span>
              <span>{order.customerPhone}</span>
            </div>
            <div style={{ marginBottom: '1mm' }}>
              <span style={{ fontWeight: 'bold' }}>العنوان: </span>
              <span>{order.customerAddress}، {order.city}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '2mm' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2mm' }}>المنتجات</h2>
          <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'right', padding: '1mm' }}>#</th>
                <th style={{ textAlign: 'right', padding: '1mm' }}>المنتج</th>
                <th style={{ textAlign: 'center', padding: '1mm' }}>كمية</th>
                <th style={{ textAlign: 'center', padding: '1mm' }}>سعر</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '1mm' }}>{index + 1}</td>
                  <td style={{ padding: '1mm' }}>
                    {item.productName}
                    {item.color && <span style={{ color: '#666', marginRight: '2mm' }}>({item.color})</span>}
                    {item.size && <span style={{ color: '#666', marginRight: '2mm' }}>({item.size})</span>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '1mm' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'center', padding: '1mm' }}>{item.price} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div style={{ marginTop: '4mm' }}>
          <div style={{ marginLeft: 'auto', width: '60mm', display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>إجمالي المنتجات:</span>
              <span style={{ fontWeight: 'bold' }}>
                {order.items.reduce((sum, item) => sum + item.total, 0)} ج.م
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>تكلفة الشحن:</span>
              <span style={{ fontWeight: 'bold' }}>{order.shippingFee} ج.م</span>
            </div>

            {order.discount && order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#d00' }}>
                <span>الخصم:</span>
                <span style={{ fontWeight: 'bold' }}>- {order.discount} ج.م</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '2mm', fontSize: '11px', fontWeight: 'bold' }}>
              <span>إجمالي الفاتورة:</span>
              <span>
                {order.items.reduce((sum, item) => sum + item.total, 0) + order.shippingFee - (order.discount || 0)} ج.م
              </span>
            </div>

            {order.paid_amount && order.paid_amount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#080' }}>
                  <span>تم دفعه مقدماً (عربون):</span>
                  <span style={{ fontWeight: 'bold' }}>- {order.paid_amount} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px double #000', paddingTop: '1.5mm', fontSize: '13px', fontWeight: '900', color: '#000', backgroundColor: '#eee', padding: '1mm' }}>
                  <span>المطلوب تحصيله:</span>
                  <span>
                    {order.items.reduce((sum, item) => sum + item.total, 0) + order.shippingFee - (order.discount || 0) - (order.paid_amount || 0)} ج.م
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer - Contact Info replaced the inspection message */}
        <div className="mt-8 text-center border-t-2 border-black pt-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1mm', alignItems: 'center', fontWeight: 'bold', fontSize: '11px' }}>
            {companyPhone && <span>📞 تليفون: {companyPhone}</span>}
            {companyAddress && <span>📍 العنوان: {companyAddress}</span>}
            {companyEmail && <span style={{ fontSize: '9px', fontWeight: 'normal' }}>📧 {companyEmail}</span>}
          </div>
          <p style={{ marginTop: '3mm', fontSize: '10px', fontWeight: 'bold', color: '#000' }}>
            الرجاء معاينة الاوردر ف وجود مندوب الشحن
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
