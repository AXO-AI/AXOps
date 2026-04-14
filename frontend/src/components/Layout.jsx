import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AiAssistant from './AiAssistant';
import ENV from '../data/envBanner';

const ENV_BANNERS = {
  INT: { bg: 'rgba(88,166,255,0.15)', color: '#58A6FF', label: 'INT Environment' },
  QA: { bg: 'rgba(210,153,34,0.15)', color: '#D29922', label: 'QA Environment' },
  STAGE: { bg: 'rgba(124,111,255,0.15)', color: '#7C6FFF', label: 'STAGE Environment' },
};

export default function Layout() {
  const banner = ENV_BANNERS[ENV];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0B0F1A' }}>
      {banner && (
        <div className="flex items-center justify-center text-[11px] font-medium shrink-0"
          style={{ height: 28, background: banner.bg, color: banner.color, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {banner.label}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#0B0F1A' }}>
          <div className="p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
