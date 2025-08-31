import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import PaginationClassic from '../../components/PaginationClassic';
import ModalBasic from '../../components/ModalBasic';

import User01 from '../../images/user-32-01.jpg';
import User02 from '../../images/user-32-02.jpg';
import User07 from '../../images/user-32-07.jpg';
import changelogData from '../../data/changelog.json';

function Changelog() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Announcements',
    date: new Date().toISOString().slice(0, 10),
    author: 'System',
    body: '',
  });
  const [userEntries, setUserEntries] = useState([]);

  const filters = ['All', 'Announcements', 'Bug Fix', 'Product', 'Exciting News'];

  // Load persisted user entries
  useEffect(() => {
    try {
      const raw = localStorage.getItem('changelog_user_entries');
      if (raw) setUserEntries(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load changelog_user_entries', e);
    }
  }, []);

  const allEntries = useMemo(() => {
    // User entries first, then packaged entries
    return [...userEntries, ...changelogData];
  }, [userEntries]);

  const normalized = (cat) => (cat || '').toLowerCase();
  const filteredEntries = useMemo(() => {
    if (activeFilter === 'All') return allEntries;
    const map = {
      Announcements: 'announcement',
      'Bug Fix': 'bug fix',
      Product: 'product',
      'Exciting News': 'exciting news',
    };
    const target = map[activeFilter];
    return allEntries.filter(e => normalized(e.category) === target);
  }, [activeFilter, allEntries]);

  // Sort descending by date
  const displayedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredEntries]);

  const categoryBadge = (category) => {
    const c = normalized(category);
    if (c === 'product') return 'bg-emerald-100 dark:bg-emerald-400/30 text-emerald-600 dark:text-emerald-400';
    if (c === 'announcement') return 'bg-amber-100 dark:bg-amber-400/30 text-amber-600 dark:text-amber-400';
    if (c === 'bug fix') return 'bg-rose-100 dark:bg-rose-500/30 text-rose-500 dark:text-rose-400';
    return 'bg-sky-100 dark:bg-sky-500/30 text-sky-600 dark:text-sky-400';
  };

  const avatarMap = {
    user01: User01,
    user02: User02,
    user07: User07,
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">

              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">Changelog ✨</h1>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">

                {/* Add board button */}
                <button
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddOpen(true);
                  }}
                >
                  <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="ml-2">Add Entry</span>
                </button>

              </div>

            </div>

            <div className="border-t border-slate-200 dark:border-slate-700">
              <div className="max-w-3xl m-auto mt-8">

                {/* Filters */}
                <div className="xl:pl-32 xl:-translate-x-16 mb-2">
                  <ul className="flex flex-wrap -m-1">
                    {filters.map(label => (
                      <li key={label} className="m-1">
                        <button
                          onClick={() => setActiveFilter(label)}
                          className={
                            'inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm duration-150 ease-in-out ' +
                            (activeFilter === label
                              ? 'border-transparent bg-indigo-500 text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                          }
                        >
                          {label === 'All' ? 'View All' : label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Posts */}
                <div className="xl:-translate-x-16">
                  {displayedEntries.map((post, idx) => (
                    <article key={idx} className="pt-6">
                      <div className="xl:flex">
                        <div className="w-32 shrink-0">
                          <div className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 xl:leading-8">
                            {(() => {
                              const d = new Date(post.date);
                              const fmt = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
                              return fmt.toUpperCase();
                            })()}
                          </div>
                        </div>
                        <div className="grow pb-6 border-b border-slate-200 dark:border-slate-700">
                          <header>
                            <h2 className="text-2xl text-slate-800 dark:text-slate-100 font-bold mb-3">{post.title}</h2>
                            <div className="flex flex-nowrap items-center space-x-2 mb-4">
                              <div className="flex items-center">
                                <span className="block mr-2 shrink-0">
                                  <img className="rounded-full border-2 border-white dark:border-slate-800 box-content" src={avatarMap[post.author?.avatar] || User07} width="32" height="32" alt={post.author?.name || 'Author'} />
                                </span>
                                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {post.author?.name || 'System'}
                                </span>
                              </div>
                              <div className="text-slate-400 dark:text-slate-600">·</div>
                              <div>
                                <div className={`text-xs inline-flex font-medium rounded-full text-center px-2.5 py-1 ${categoryBadge(post.category)}`}>{post.category}</div>
                              </div>
                            </div>
                          </header>
                          <div className="space-y-3">
                            {post.body?.map((p, i) => (
                              <p key={i}>{p}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                <div className="xl:pl-32 xl:-translate-x-16 mt-6">
                  <PaginationClassic />
                </div>

              </div>
            </div>

            {/* Add Entry Modal */}
            <ModalBasic id="add-entry" modalOpen={addOpen} setModalOpen={setAddOpen} title="Add Changelog Entry">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const bodyArray = form.body
                    .split(/\n\n|\n/)
                    .map(s => s.trim())
                    .filter(Boolean);
                  const entry = {
                    title: form.title.trim(),
                    category: form.category,
                    date: form.date,
                    body: bodyArray,
                    author: { name: form.author || 'System', avatar: 'user07' },
                  };
                  const next = [entry, ...userEntries];
                  setUserEntries(next);
                  try {
                    localStorage.setItem('changelog_user_entries', JSON.stringify(next));
                  } catch {}
                  setAddOpen(false);
                  setForm({ title: '', category: 'Announcements', date: new Date().toISOString().slice(0,10), author: 'System', body: '' });
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title<span className="text-rose-500">*</span></label>
                    <input
                      className="form-input w-full"
                      required
                      value={form.title}
                      onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Add a descriptive title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        className="form-select w-full"
                        value={form.category}
                        onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                      >
                        {filters.filter(f => f !== 'All').map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input
                        type="date"
                        className="form-input w-full"
                        value={form.date}
                        onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Author</label>
                    <input
                      className="form-input w-full"
                      value={form.author}
                      onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Body</label>
                    <textarea
                      className="form-textarea w-full min-h-[120px]"
                      value={form.body}
                      onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                      placeholder={'Write your update...\nUse new lines to split paragraphs.'}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button type="button" className="btn border-slate-200 dark:border-slate-700" onClick={() => setAddOpen(false)}>Cancel</button>
                  <button type="submit" className="btn bg-indigo-500 hover:bg-indigo-600 text-white">Save Entry</button>
                </div>
              </form>
            </ModalBasic>

          </div>
        </main>

      </div>

    </div>
  );
}

export default Changelog;