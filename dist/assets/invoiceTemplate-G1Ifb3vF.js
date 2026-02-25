import{f as s}from"./index-cWDgXWlM.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=s("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]),a=(t,o)=>`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة #${t.orderNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;800;900&family=Montserrat:wght@700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          color: #000;
          padding: 15px;
          background: #fff;
        }
        
        .invoice-container {
          width: 80mm;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 0;
        }
        
        /* Header - No background, only borders */
        .header {
          border-bottom: 2px solid #000;
          padding: 1mm;
          text-align: center;
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .company-name {
          font-size: 14px;
          font-weight: 900;
          color: #000;
          margin-bottom: 2mm;
        }
        
        .invoice-box {
          border: 2px solid #000;
          padding: 10px 15px;
          text-align: center;
        }
        
        .invoice-label {
          font-size: 12px;
          font-weight: 700;
        }
        
        .invoice-number {
          font-size: 22px;
          font-weight: 900;
          margin: 3px 0;
        }
        
        .company-info {
          text-align: right;
        }
        
        .invoice-date {
          font-size: 13px;
          color: #666;
          margin-top: 5px;
        }
        
        .subtitle {
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          border-top: 1px solid #000;
          padding-top: 10px;
        }
        
        /* Content */
        .content {
          padding: 1mm;
          font-size: 9px;
        }
        
        .section {
          margin-bottom: 1mm;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 800;
          border-bottom: 2px solid #000;
          padding-bottom: 2px;
          margin-bottom: 2px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 2px;
          margin-bottom: 2px;
        }
        
        .invoice-number-inline {
          font-size: 14px;
          font-weight: 700;
          color: #000;
        }
        
        /* Customer Info - Only borders */
        .customer-box {
          border: 2px solid #000;
          padding: 5px;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 2px;
          font-size: 13px;
          border-bottom: 1px dotted #000;
          padding-bottom: 2px;
        }
        
        .info-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: 700;
          min-width: 90px;
        }
        
        .info-value {
          flex: 1;
          font-weight: 600;
        }
        
        .location-box {
          border: 2px solid #000;
          border-top: none;
          padding: 10px 15px;
          margin: 0 -2px -2px -2px;
        }
        
        .location-row {
          display: flex;
          justify-content: space-around;
          font-size: 13px;
          font-weight: 700;
        }
        
        /* Notes Section */
        .notes-box {
          border: 2px solid #000;
          border-top: none;
          padding: 10px 15px;
          margin: 0 -2px -2px -2px;
        }
        
        .notes-label {
          font-weight: 800;
          font-size: 13px;
          margin-bottom: 5px;
        }
        
        .notes-text {
          font-size: 12px;
          line-height: 1.5;
          padding: 5px;
          border: 1px dashed #000;
        }
        
        /* Products Table */
        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin: 5px 0;
        }
        
        thead tr {
          border-bottom: 3px solid #000;
        }
        
        th {
          padding: 2px;
          text-align: center;
          font-weight: 800;
          font-size: 10px;
          border-left: 1px solid #000;
        }
        
        th:first-child {
          border-right: none;
        }
        
        tbody tr {
          border-bottom: 1px solid #000;
        }
        
        tbody tr:last-child {
          border-bottom: none;
        }
        
        td {
          padding: 2px;
          text-align: center;
          font-size: 9px;
          border-left: 1px solid #000;
        }
        
        td:first-child {
          font-weight: 800;
        }
        
        td.product-name {
          text-align: right;
          font-weight: 600;
        }
        
        td.total-cell {
          font-weight: 800;
        }
        
        /* Summary Box */
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin: 20px 0;
        }
        
        .summary-box {
          border: 3px solid #000;
          padding: 15px;
          min-width: 280px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dotted #000;
          font-size: 14px;
        }
        
        .summary-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .summary-row.total-row {
          border-top: 3px solid #000;
          border-bottom: none;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 16px;
          font-weight: 900;
        }
        
        .summary-label {
          font-weight: 700;
        }
        
        .summary-value {
          font-weight: 800;
        }
        
        /* Warning Box */
        .warning-box {
          border: 3px solid #000;
          border-right: 8px solid #000;
          padding: 12px;
          margin: 20px 0;
          text-align: center;
          font-size: 15px;
          font-weight: 800;
        }
        
        /* Footer */
        .footer {
          border-top: 3px solid #000;
          padding: 5px;
        }
        
        .footer-title {
          font-size: 16px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid #000;
        }
        
        .footer-info {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .footer-item {
          padding: 5px 10px;
        }
        
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header" style="padding: 10px 0; border-bottom: 2px solid #000; text-align: center;">
          ${o.companyLogo?`
            <div style="margin-bottom: 5px; padding: 0; line-height: 0;">
              <img src="${o.companyLogo}" alt="Logo" style="max-height: 90px; max-width: 200px; object-fit: contain; vertical-align: bottom;">
            </div>
          `:""}
          <div class="company-name" style="font-family: 'Montserrat', sans-serif; font-size: 30px; font-weight: 900; margin: 5px 0 0 0; padding: 0; line-height: 1; letter-spacing: 2px; text-transform: uppercase;">${o.companyName}</div>
        </div>

        <div style="height: 3mm;"></div>

        <!-- Content -->
        <div class="content">
          <!-- Customer Information -->
          <div class="section">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="section-title" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">بيانات العميل</div>
              <div style="text-align: left; font-size: 11px;">
                <div style="font-weight: 900; margin-bottom: 2px; font-size: 13px;">#${t.orderNumber}</div>
                <div style="font-weight: 400; color: #333;">${t.date}</div>
              </div>
            </div>
            <div class="customer-box">
              <div class="info-row">
                <span class="info-label">الاسم:</span>
                <span class="info-value">${t.customerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">الهاتف:</span>
                <span class="info-value">${t.customerPhone}</span>
              </div>
              ${t.customerPhone2?`
              <div class="info-row">
                <span class="info-label">الهاتف البديل:</span>
                <span class="info-value">${t.customerPhone2}</span>
              </div>
              `:""}
              <div class="info-row">
                <span class="info-label">العنوان:</span>
                <span class="info-value">${t.customerAddress}</span>
              </div>
              ${t.province||t.city?`
              <div class="info-row">
                <span class="info-label">المحافظة:</span>
                <span class="info-value">${[t.province,t.city].filter(Boolean).join(" - ")}</span>
              </div>
              `:""}
              ${t.page?`
              <div class="info-row">
                <span class="info-label">الصفحة:</span>
                <span class="info-value">${t.page}</span>
              </div>
              `:""}
              <div class="info-row" style="border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; display: block;">
                <span class="info-label" style="display: block; margin-bottom: 2px;">ملاحظات:</span>
                <div class="info-value" style="font-weight: 700; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; font-size: 11px;">${t.notes||"___________________________"}</div>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div class="section">
            <div class="section-title">تفاصيل المنتجات</div>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>اللون</th>
                  <th>المقاس</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                </tr>
              </thead>
              <tbody>
                ${t.items.map((e,n)=>`
                <tr>
                  <td class="product-name">${e.name}</td>
                  <td>${e.color||"-"}</td>
                  <td>${e.size||"-"}</td>
                  <td style="font-weight: 800;">${e.quantity}</td>
                  <td>${e.price.toLocaleString()} ج.م</td>
                </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div style="margin-top: 5px;">
            <div class="summary-box" style="border: 2px solid #000; padding: 8px; margin-top: 10px;">
              <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
                <span class="summary-label">إجمالي المنتجات:</span>
                <span class="summary-value">${Number(t.subtotal).toLocaleString()} ج.م</span>
              </div>
              <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
                <span class="summary-label">تكلفة الشحن:</span>
                <span class="summary-value">${Number(t.shippingFee).toLocaleString()} ج.م</span>
              </div>
              <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: 700; border-top: 1px solid #000; padding-top: 4px;">
                <span class="summary-label">إجمالي (المنتجات + الشحن):</span>
                <span class="summary-value">${Number(t.total).toLocaleString()} ج.م</span>
              </div>
              
              ${t.paidAmount&&Number(t.paidAmount)>0?`
                <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #d00; font-weight: 700;">
                  <span class="summary-label">المبلغ المدفوع (عربون):</span>
                  <span class="summary-value">- ${Number(t.paidAmount).toLocaleString()} ج.م</span>
                </div>
                <div class="summary-row total-row" style="display: flex; justify-content: space-between; background-color: #000; color: #fff; padding: 10px; margin-top: 5px; border-radius: 2px;">
                  <span class="summary-label" style="font-size: 16px; font-weight: 800;">المطلوب تحصيله:</span>
                  <span class="summary-value" style="font-size: 20px; font-weight: 900;">${(Number(t.total)-Number(t.paidAmount)).toLocaleString()} ج.م</span>
                </div>
              `:`
                <div class="summary-row total-row" style="display: flex; justify-content: space-between; background-color: #000; color: #fff; padding: 10px; margin-top: 5px; border-radius: 2px;">
                  <span class="summary-label" style="font-size: 16px; font-weight: 800;">الإجمالي المطلوب:</span>
                  <span class="summary-value" style="font-size: 20px; font-weight: 900;">${Number(t.total).toLocaleString()} ج.م</span>
                </div>
              `}
            </div>
          </div>


        </div>

        <!-- Footer - Contact info replaced warning message -->
        <div class="footer" style="padding: 10px 0; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 5px; font-weight: 800; font-size: 13px;">
            ${o.companyPhone?`<span>📞 تليفون: ${o.companyPhone}</span>`:""}
            ${o.companyAddress?`<span>📍 العنوان: ${o.companyAddress}</span>`:""}
          </div>
          <div style="margin-top: 10px; font-size: 13px; font-weight: 800; color: #000; border-top: 1px dashed #000; pt-2;">
            الرجاء معاينة الاوردر ف وجود مندوب الشحن
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `,l=(t,o)=>{const e=a(t,o),n=new Blob([e],{type:"text/html"}),i=URL.createObjectURL(n);if(!window.open(i,"_blank","width=800,height=800"))throw new Error("فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.")};export{d as P,l as p};
