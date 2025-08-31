import React, { useState, useEffect, useRef } from 'react';
import "datatables.net-dt/css/dataTables.dataTables.css";
import DataTable from 'datatables.net-dt';
import FeedbackTableItem from './FeedbackTableItem';

function FeedbackTable({ selectedItems }) {
  const [selectAll, setSelectAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line
  }, []);

  // Initialize DataTable when feedbackList changes
  useEffect(() => {
    if (tableRef.current) {
      const dt = new DataTable(tableRef.current, {
        paging: true,
        searching: true,
        ordering: true,
        destroy: true,
      });
      return () => {
        dt.destroy();
      };
    }
  }, [feedbackList]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      // Load feedback from localStorage instead of backend
      const storedFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      setFeedbackList(storedFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError('Failed to load feedback');
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setIsCheck(feedbackList.map(item => item.id));
    if (selectAll) {
      setIsCheck([]);
    }
  };

  const handleClick = e => {
    const { id, checked } = e.target;
    setSelectAll(false);
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter(item => item !== id));
    }
  };

  useEffect(() => {
    selectedItems(isCheck);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheck]);

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500 dark:text-slate-400">Loading feedback...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700 relative">
      <header className="px-5 py-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">All Feedback <span className="text-slate-400 dark:text-slate-500 font-medium">{feedbackList.length}</span></h2>
      </header>
      <div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table ref={tableRef} className="table-auto w-full dark:text-slate-300">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-t border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                    </label>
                  </div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">User</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Rating</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Message</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Date</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <span className="sr-only">Menu</span>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-700">
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-2 first:pl-5 last:pr-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No feedback submitted yet
                  </td>
                </tr>
              ) : (
                feedbackList.map(feedback => (
                  <FeedbackTableItem
                    key={feedback.id}
                    id={feedback.id}
                    username={feedback.username}
                    rating={feedback.rating}
                    message={feedback.message}
                    timestamp={feedback.timestamp}
                    handleClick={handleClick}
                    isChecked={isCheck.includes(feedback.id)}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default FeedbackTable;
