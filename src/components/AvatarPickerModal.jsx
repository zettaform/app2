import React, { useEffect, useState } from 'react';
import { buildAvatarUrl } from '../services/api';
import ModalBasic from './ModalBasic';
import { authApi } from '../services/api';

const AvatarPickerModal = ({ open, setOpen, onPicked, picking = false }) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      setError('');
      setLoading(true);
      try {
        const list = await authApi.getAvatars();
        setAvatars(list || []);
      } catch (e) {
        console.error('Failed to load avatars', e);
        setError(e?.message || 'Failed to load avatars');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const grid = (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {avatars.map((a) => (
        <button
          key={a}
          disabled={picking}
          onClick={() => onPicked?.(a)}
          className="border rounded-lg p-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title={a.replace('.png','')}
        >
          {/* Avatars served by backend helper to avoid Netlify dependency */}
          <img src={buildAvatarUrl(a)} alt={a} className="w-16 h-16 object-contain" />
        </button>
      ))}
    </div>
  );

  return (
    <ModalBasic id="avatar-picker" modalOpen={open} setModalOpen={setOpen} title="Choose your avatar">
      <div className="px-5 py-4">
        {error && <div className="text-sm text-rose-500 mb-3">{error}</div>}
        {loading ? (
          <div className="text-slate-500">Loading avatars…</div>
        ) : avatars.length ? (
          grid
        ) : (
          <div className="text-slate-500">No avatars available.</div>
        )}
      </div>
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
    </ModalBasic>
  );
};

export default AvatarPickerModal;
