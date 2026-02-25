import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/rich-editor.css';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  Type,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "أدخل وصف المنتج...",
  className = ""
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // تكوين شريط الأدوات المخصص
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // صف الخطوط والأحجام
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],

        // صف التنسيق الأساسي
        ['bold', 'italic', 'underline', 'strike'],

        // صف الألوان
        [{ 'color': [] }, { 'background': [] }],

        // صف المحاذاة والاتجاه
        [{ 'align': ['', 'center', 'right', 'justify'] }],
        [{ 'direction': 'rtl' }],

        // صف القوائم والمسافات
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],

        // صف الروابط والصور
        ['link', 'image', 'video'],

        // صف إضافي للتنسيقات المتقدمة
        ['blockquote', 'code-block'],

        // صف التنظيف
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  // تكوين التنسيقات المدعومة
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'direction',
    'color', 'background'
  ];

  // دالة إدراج صورة مقاسات
  const insertSizeChart = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      // HTML لجدول المقاسات
      const sizeChartHTML = `
        <div style="margin: 20px auto; max-width: 600px; font-family: 'Cairo', sans-serif;">
          <h4 style="text-align: center; color: #0f766e; margin-bottom: 20px; font-size: 1.25rem; font-weight: 700;">📏 جدول المقاسات</h4>
          <div style="overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <table style="width: 100%; border-collapse: collapse; background-color: white; font-size: 0.95rem;">
              <thead>
                <tr style="background-color: #0f766e; color: white;">
                  <th style="padding: 12px 16px; text-align: center; border: 1px solid #115e59;">المقاس</th>
                  <th style="padding: 12px 16px; text-align: center; border: 1px solid #115e59;">الطول (سم)</th>
                  <th style="padding: 12px 16px; text-align: center; border: 1px solid #115e59;">العرض (سم)</th>
                  <th style="padding: 12px 16px; text-align: center; border: 1px solid #115e59;">الوزن المناسب</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: #f0fdfa;">
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1; font-weight: bold; color: #0f766e;">S</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">65</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">45</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">50-60 كجم</td>
                </tr>
                <tr style="background-color: white;">
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1; font-weight: bold; color: #0f766e;">M</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">70</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">50</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">60-70 كجم</td>
                </tr>
                <tr style="background-color: #f0fdfa;">
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1; font-weight: bold; color: #0f766e;">L</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">75</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">55</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">70-80 كجم</td>
                </tr>
                <tr style="background-color: white;">
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1; font-weight: bold; color: #0f766e;">XL</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">80</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">60</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">80-90 كجم</td>
                </tr>
                <tr style="background-color: #f0fdfa;">
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1; font-weight: bold; color: #0f766e;">XXL</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">85</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">65</td>
                  <td style="padding: 12px 16px; text-align: center; border: 1px solid #ccfbf1;">90-100 كجم</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      quill.clipboard.dangerouslyPasteHTML(index, sizeChartHTML);
    }
  };

  // دالة إدراج نص ملون
  const insertColoredText = (color: string, text: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      quill.insertText(index, text);
      quill.formatText(index, text.length, 'color', color);
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* أزرار مخصصة إضافية */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={insertSizeChart}
          className="flex items-center gap-3 px-6 py-3 text-base font-medium hover:bg-blue-100 border-blue-300"
        >
          <Image className="h-5 w-5" />
          📏 إدراج جدول مقاسات
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => insertColoredText('#ef4444', '🔥 عرض خاص ')}
          className="flex items-center gap-3 px-6 py-3 text-base font-medium hover:bg-red-100 border-red-300"
        >
          <Palette className="h-5 w-5" />
          🔥 نص عرض خاص
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => insertColoredText('#22c55e', '✅ متوفر الآن ')}
          className="flex items-center gap-3 px-6 py-3 text-base font-medium hover:bg-green-100 border-green-300"
        >
          <Type className="h-5 w-5" />
          ✅ نص متوفر
        </Button>
      </div>

      {/* محرر النصوص */}
      <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            minHeight: '450px',
            direction: 'rtl',
            textAlign: 'right',
            fontSize: '16px'
          }}
        />
      </div>

      {/* نصائح سريعة */}
      <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
        <h4 className="text-lg font-bold text-green-800 mb-3">💡 نصائح سريعة للاستخدام:</h4>
        <ul className="text-sm text-green-700 space-y-2 font-medium">
          <li>🎯 استخدم الأزرار الملونة أعلاه لإدراج جداول المقاسات والنصوص الملونة</li>
          <li>🔄 يمكنك تغيير اتجاه النص من اليسار لليمين باستخدام زر الاتجاه في شريط الأدوات</li>
          <li>📏 استخدم أحجام الخطوط المختلفة (صغير، عادي، كبير، ضخم) لإبراز المعلومات المهمة</li>
          <li>🖼️ أضف صور للمنتج باستخدام زر الصورة في شريط الأدوات</li>
          <li>🎨 استخدم الألوان والتنسيقات لجعل الوصف أكثر جاذبية</li>
        </ul>
      </div>
    </div>
  );
};

export default RichTextEditor;
