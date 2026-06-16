import React, { useState, useMemo } from 'react';
import { initialData, CATEGORIES } from './data';
import './App.css';

const CATEGORY_COLORS = {
  '無類別': '#6b7280',
  '今天':   '#1a73e8',
  '昨天':   '#f59e0b',
};

const STORAGE_KEY = 'bjc-checklist-v1';

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return initialData;
}

function EditModal({ row, onSave, onClose }) {
  const [form, setForm] = useState({
    應有: row.應有 ?? '',
    成功: row.成功 ?? '',
    失敗: row.失敗 ?? '',
    類別: row.類別,
    審查: !!row.審查,
    複查: !!row.複查,
    備註: row.備註 ?? '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">BJC {row.bjc}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label>應有數量
            <input type="number" value={form.應有} onChange={set('應有')} placeholder="－" inputMode="numeric" />
          </label>
          <label>成功數量
            <input type="number" value={form.成功} onChange={set('成功')} placeholder="－" inputMode="numeric" />
          </label>
          <label>失敗
            <input type="number" value={form.失敗} onChange={set('失敗')} placeholder="－" inputMode="numeric" />
          </label>
          <label>類別
            <select value={form.類別} onChange={set('類別')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="label-checkbox">
            <input type="checkbox" checked={form.審查}
              onChange={(e) => setForm((f) => ({ ...f, 審查: e.target.checked }))} />
            審查
          </label>
          <label className="label-checkbox">
            <input type="checkbox" checked={form.複查}
              onChange={(e) => setForm((f) => ({ ...f, 複查: e.target.checked }))} />
            複查
          </label>
          <label>備註
            <textarea value={form.備註} onChange={set('備註')} placeholder="輸入備註..." rows={3} />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => onSave(form)}>儲存</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(loadData);
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const handleToggle = (id, field) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, [field]: !r[field] } : r
    );
    save(updated);
  };

  const save = (updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRows(updated);
  };

  const handleSave = (form) => {
    const updated = rows.map((r) =>
      r.id === editing.id
        ? {
            ...r,
            應有: form.應有 === '' ? null : Number(form.應有),
            成功: form.成功 === '' ? null : Number(form.成功),
            失敗: form.失敗 === '' ? null : Number(form.失敗),
            類別: form.類別,
            審查: form.審查 || null,
            複查: form.複查 || null,
            備註: form.備註 || null,
          }
        : r
    );
    save(updated);
    setEditing(null);
  };

  const handleReset = () => {
    if (window.confirm('確定要清除所有資料並重置？')) {
      save(initialData);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `bjc-checklist-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error();
        save(data);
        alert('匯入成功！');
      } catch {
        alert('檔案格式錯誤，請選擇正確的 JSON 檔案。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== '全部') list = list.filter((r) => r.類別 === filter);
    if (search.trim()) {
      const q = search.trim();
      list = list.filter((r) => String(r.bjc).includes(q) || (r.備註 || '').includes(q));
    }
    return list;
  }, [rows, filter, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    done: rows.filter((r) => r.審查 || r.複查).length,
    noted: rows.filter((r) => r.備註).length,
  }), [rows]);

  return (
    <div className="app">
      <header className="header">
        <h1>BJC 審和單</h1>
        <div className="header-actions">
          <button className="reset-btn" onClick={handleExport}>匯出</button>
          <label className="reset-btn import-btn">
            匯入
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button className="reset-btn" onClick={handleReset}>重置</button>
        </div>
      </header>

      <div className="stats-bar">
        <span>共 {stats.total} 筆</span>
        <span>已審 {stats.done} 筆</span>
        <span>備註 {stats.noted} 筆</span>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="搜尋 BJC 序號或備註…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['全部', ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`tab ${filter === c ? 'active' : ''}`}
              style={filter === c && c !== '全部' ? { background: CATEGORY_COLORS[c] } : {}}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="list">
        {filtered.length === 0 && (
          <div className="empty">沒有符合的資料</div>
        )}
        {filtered.map((row) => {
          const color = CATEGORY_COLORS[row.類別] || '#6b7280';
          const isDone = row.審查 || row.複查;
          return (
            <div
              key={row.id}
              className={`card ${isDone ? 'card-done' : ''}`}
              onClick={() => setEditing(row)}
            >
              <div className="card-left">
                <span className="bjc-num">BJC {row.bjc}</span>
                <span className="badge" style={{ background: color }}>{row.類別}</span>
              </div>
              <div className="card-center">
                <span className="num-cell">
                  <span className="num-label">應有</span>
                  <span className="num-val">{row.應有 ?? '－'}</span>
                </span>
                <span className="num-cell">
                  <span className="num-label">成功</span>
                  <span className="num-val success">{row.成功 ?? '－'}</span>
                </span>
                <span className="num-cell">
                  <span className="num-label">失敗</span>
                  <span className="num-val fail">{row.失敗 ?? '－'}</span>
                </span>
              </div>
              <div className="card-right">
                <label className="card-check" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={!!row.審查}
                    onChange={() => handleToggle(row.id, '審查')} />
                  <span>審</span>
                </label>
                <label className="card-check" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={!!row.複查}
                    onChange={() => handleToggle(row.id, '複查')} />
                  <span>複</span>
                </label>
                {row.備註 && <span className="note-icon">📝</span>}
                <span className="arrow">›</span>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EditModal
          row={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
