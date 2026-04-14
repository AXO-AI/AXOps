import { useState, useEffect } from 'react';
import { Loader2, Headphones, Plus, MessageSquare, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api, timeAgo } from '../api';
import Badge from '../components/Badge';

const priorityColors = { urgent: 'var(--danger)', high: '#F0883E', medium: 'var(--warning)', low: 'var(--info)' };
const statusColors = { open: 'var(--info)', 'in-progress': 'var(--warning)', resolved: 'var(--success)', closed: 'var(--text-tertiary)' };

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.support.tickets();
      setTickets(Array.isArray(res) ? res : res?.tickets || []);
    } catch {
      setTickets([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const createTicket = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.support.create({ title: title.trim(), description: description.trim(), priority });
      setTitle('');
      setDescription('');
      setShowForm(false);
      await loadTickets();
    } catch {
      // silent
    }
    setSubmitting(false);
  };

  const addComment = async () => {
    if (!comment.trim() || !selected) return;
    try {
      await api.support.comment(selected.id || selected._id, 'User', comment.trim());
      setComment('');
      const updated = await api.support.ticket(selected.id || selected._id);
      if (updated) setSelected(updated);
    } catch {
      // silent
    }
  };

  const selectTicket = async (t) => {
    try {
      const full = await api.support.ticket(t.id || t._id);
      setSelected(full || t);
    } catch {
      setSelected(t);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Support</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-2"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={14} /> New Ticket
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 rounded-lg text-sm border-none outline-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full px-3 py-2 rounded-lg text-sm border-none outline-none resize-none h-24"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              placeholder="Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <select
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={createTicket}
                disabled={submitting || !title.trim() || !description.trim()}
                className="px-5 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-2"
                style={{ background: 'var(--success)', color: 'white', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
          ) : tickets.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Headphones size={32} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No support tickets</div>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {tickets.map((t) => (
                <div
                  key={t.id || t._id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selected?.id === t.id || selected?._id === t._id ? 'var(--bg-secondary)' : 'transparent',
                  }}
                  onClick={() => selectTicket(t)}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: priorityColors[t.priority] || 'var(--text-tertiary)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(t.createdAt || t.created_at)}</div>
                  </div>
                  <Badge text={t.status || 'open'} color={statusColors[t.status] || 'var(--info)'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.title}</div>
                <div className="flex gap-2 mt-2">
                  <Badge text={selected.priority || 'medium'} color={priorityColors[selected.priority] || 'var(--warning)'} />
                  <Badge text={selected.status || 'open'} color={statusColors[selected.status] || 'var(--info)'} />
                </div>
              </div>
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                {selected.description || 'No description'}
              </div>
              {/* Comments */}
              <div className="px-4 py-3">
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Comments</div>
                {(selected.comments || []).length === 0 ? (
                  <div className="text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>No comments yet</div>
                ) : (
                  <div className="space-y-2 mb-3">
                    {(selected.comments || []).map((c, i) => (
                      <div key={i} className="rounded p-2 text-xs" style={{ background: 'var(--bg-secondary)' }}>
                        <span className="font-medium" style={{ color: 'var(--accent)' }}>{c.author || 'User'}</span>
                        <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{c.text || c.body || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 px-2 py-1.5 rounded text-xs border-none outline-none"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    placeholder="Add comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    disabled={!comment.trim()}
                    className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                    style={{ background: 'var(--accent)', color: 'white', opacity: !comment.trim() ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <MessageSquare size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Select a ticket to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
