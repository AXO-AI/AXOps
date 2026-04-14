import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AiAssistant from './AiAssistant';

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0F1117' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: '#0F1117' }}>
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
      <AiAssistant />
    </div>
  );
}
