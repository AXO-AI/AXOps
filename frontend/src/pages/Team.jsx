import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, Pencil, Eye } from 'lucide-react';
import Badge from '../components/Badge';

const STORAGE_KEY = 'axops_team_members';

const defaultPermissions = ['view', 'commit', 'merge', 'deploy', 'admin'];
const rolePresets = {
  Admin: ['view', 'commit', 'merge', 'deploy', 'admin'],
  Developer: ['view', 'commit', 'merge'],
  Viewer: ['view'],
  DevOps: ['view', 'commit', 'merge', 'deploy'],
};

export default function Team() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setMembers(saved.length > 0 ? saved : [
        { id: 1, name: 'Admin User', email: 'admin@axops.io', role: 'Admin', permissions: rolePresets.Admin },
      ]);
    } catch {
      setMembers([]);
    }
  }, []);

  const save = (list) => {
    setMembers(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addMember = () => {
    if (!name.trim() || !email.trim()) return;
    const member = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      role,
      permissions: rolePresets[role] || ['view'],
    };
    save([...members, member]);
    setName('');
    setEmail('');
  };

  const removeMember = (id) => save(members.filter((m) => m.id !== id));

  const togglePerm = (memberId, perm) => {
    save(
      members.map((m) => {
        if (m.id !== memberId) return m;
        const perms = m.permissions || [];
        return {
          ...m,
          permissions: perms.includes(perm) ? perms.filter((p) => p !== perm) : [...perms, perm],
        };
      })
    );
  };

  const roleColor = (r) => {
    if (r === 'Admin') return 'var(--danger)';
    if (r === 'DevOps') return 'var(--warning)';
    if (r === 'Developer') return 'var(--info)';
    return 'var(--text-tertiary)';
  };

  const permIcon = (p) => {
    if (p === 'admin') return Shield;
    if (p === 'commit') return Pencil;
    if (p === 'view') return Eye;
    return Shield;
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Team</h1>

      {/* Invite form */}
      <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <UserPlus size={14} style={{ color: 'var(--accent)' }} /> Invite Member
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[160px] border-none outline-none"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[200px] border-none outline-none"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {Object.keys(rolePresets).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={addMember}
            disabled={!name.trim() || !email.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium border-none cursor-pointer flex items-center gap-2"
            style={{ background: 'var(--accent)', color: 'white', opacity: !name.trim() || !email.trim() ? 0.5 : 1 }}
          >
            <UserPlus size={14} /> Invite
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-lg overflow-hidden mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <Users size={14} style={{ color: 'var(--accent)' }} />
          Members ({members.length})
        </div>
        {members.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No team members</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${roleColor(m.role)}20`, color: roleColor(m.role) }}
              >
                {(m.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.email}</div>
              </div>
              <Badge text={m.role} color={roleColor(m.role)} />
              <button
                onClick={() => removeMember(m.id)}
                className="bg-transparent border-none cursor-pointer p-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Permissions matrix */}
      {members.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Permissions Matrix</div>
          <div className="rounded-lg overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Member</th>
                  {defaultPermissions.map((p) => (
                    <th key={p} className="text-center px-4 py-3 text-xs font-medium capitalize" style={{ color: 'var(--text-tertiary)' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                    {defaultPermissions.map((p) => (
                      <td key={p} className="text-center px-4 py-3">
                        <input
                          type="checkbox"
                          checked={(m.permissions || []).includes(p)}
                          onChange={() => togglePerm(m.id, p)}
                          className="cursor-pointer accent-[#7F77DD]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
