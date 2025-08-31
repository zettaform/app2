import React, { useState, useEffect } from 'react';
import ModalBasic from '../../components/ModalBasic';

export default function AdminAddUserModal({ open, setOpen, onCreated, creating }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Debug
    // eslint-disable-next-line no-console
    console.log('[AdminAddUserModal] open changed:', open);
    if (open) {
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setDisabled(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('Username, email, and password are required');
      return;
    }
    onCreated && onCreated({
      username,
      email,
      password,
      full_name: fullName || undefined,
      disabled,
    });
  };

  return (
    <ModalBasic id="admin-add-user" modalOpen={open} setModalOpen={setOpen} title="Add User">
      <div className="px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-rose-500">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Username <span className="text-rose-500">*</span></label>
            <input className="form-input w-full" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-rose-500">*</span></label>
            <input className="form-input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input className="form-input w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password <span className="text-rose-500">*</span></label>
            <input className="form-input w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <label className="flex items-center">
            <input type="checkbox" className="form-checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
            <span className="text-sm ml-2">Disabled</span>
          </label>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button type="button" className="btn border-slate-200 hover:border-slate-300 text-slate-600" onClick={() => setOpen && setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn bg-indigo-500 hover:bg-indigo-600 text-white" disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </ModalBasic>
  );
}
