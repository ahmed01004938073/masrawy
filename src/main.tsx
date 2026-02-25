import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// تعطيل إعادة التحميل التلقائي
if (import.meta.hot) {
  import.meta.hot.accept(() => {});
  import.meta.hot.dispose(() => {});
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
