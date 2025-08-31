import React from 'react';

function CustomersTableItem(props) {
  return (
    <tr>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center">
          <label className="inline-flex">
            <span className="sr-only">Select</span>
            <input id={props.id} className="form-checkbox" type="checkbox" onChange={props.handleClick} checked={props.isChecked} />
          </label>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center relative">
          <button type="button" onClick={() => props.onToggleFavorite && props.onToggleFavorite(props.id)} aria-label="Toggle favourite">
            <svg
              className={`w-4 h-4 shrink-0 fill-current ${props.fav ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}`}
              viewBox="0 0 16 16"
            >
              <path d="M8 0L6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934h-6L8 0z" />
            </svg>
          </button>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3">
            {props.image ? (
              <img className="rounded-full" src={props.image} width="40" height="40" alt={props.name} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 text-sm font-medium">
                {(props.name || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="font-medium text-slate-800 dark:text-slate-100">{props.name}</div>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left">{props.email}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left">{props.location}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-center">{props.orders}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left font-medium text-sky-500">{props.lastOrder}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-left font-medium text-emerald-500">{props.spent}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-center">{props.refunds}</div>
      </td>
      {props.showExtraColumn && (
        <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
          <div className="text-left">
            {props.extraData ? (
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Score: <span className="text-emerald-600 dark:text-emerald-400">{props.extraData.score}</span>
                </div>
                <div className="text-xs">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    props.extraData.status === 'Active' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300'
                  }`}>
                    {props.extraData.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last: {props.extraData.lastActivity}
                </div>
              </div>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs">Loading...</span>
            )}
          </div>
        </td>
      )}
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        {/* Menu button */}
        <button className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 rounded-full">
          <span className="sr-only">Menu</span>
          <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="2" />
            <circle cx="10" cy="16" r="2" />
            <circle cx="22" cy="16" r="2" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default CustomersTableItem;
