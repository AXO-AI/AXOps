import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AiAssistant from './AiAssistant';

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: '#F7F8FA' }}>
        <div style={{ padding: '14px 18px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
      <AiAssistant />
    </div>
  );
}
