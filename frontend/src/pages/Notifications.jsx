import { useState, useEffect } from 'react';
import { Bell, Send, Filter, Trash2, Loader2, CheckCircle2, AlertTriangle, Info, Rocket } from 'lucide-react';
import { api } from '../api';

const STORAGE_KEY = 'axops_notifications';

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  deploy: Rocket,
};
const typeColors = {
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  deploy: 'var(--accent)',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setNotifications(saved);
    } catch {
      setNotifications([]);
    }
  }, []);

  const save = (list) => {
    setNotifications(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api.teams.notify({ title: title.trim(), text: message.trim(), type });
    } catch {
      // still log locally
    }
    const entry = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      type,
      date: new Date().toISOString(),
    };
    save([entry, ...notifications]);
    setTitle('');
    setMessage('');
    setSending(false);
  };

  const remove = (id) => save(notifications.filter((n) => n.id !== id));
  const clearAll = () => save([]);

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);
  const tabs = ['all', 'info', 'success', 'warning', 'deploy'];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Notifications</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Send size={14} style={{ color: 'var(--accent)' }} /> Send Notification
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="deploy">Deploy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title</label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm border-none outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Message</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm border-none outline-none resize-none h-24"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message..."
              />
            </div>
            <button
              onClick={sendNotification}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'white', opacity: sending || !title.trim() || !message.trim() ? 0.5 : 1 }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </div>

        {/* Log */}
        <div className="lg:col-span-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-4">
            <Filter size={14} style={{ color: 'var(--text-tertiary)' }} className="mr-2" />
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer capitalize"
                style={{
                  background: filter === t ? 'var(--accent)' : 'var(--bg-card)',
                  color: filter === t ? 'white' : 'var(--text-secondary)',
                }}
              >
                {t}
              </button>
            ))}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="ml-auto px-3 py-1.5 rounded-md text-xs border-none cursor-pointer flex items-center gap-1"
                style={{ background: 'rgba(248,81,73,0.1)', color: 'var(--danger)' }}
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          {/* Notification list */}
          {filtered.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Bell size={32} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No notifications</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const Icon = typeIcons[n.type] || Info;
                const color = typeColors[n.type] || 'var(--info)';
                return (
                  <div key={n.id} className="rounded-lg p-4 flex items-start gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <Icon size={16} style={{ color, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                      <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(n.date).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(n.id)}
                      className="bg-transparent border-none cursor-pointer p-1 shrink-0"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
