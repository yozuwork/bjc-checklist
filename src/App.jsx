import React, { useState, useMemo } from "react";
import { initialData, CATEGORIES } from "./data";
import "./App.css";

const CATEGORY_COLORS = {
  無類別: "#6b7280",
  今天: "#1a73e8",
  昨天: "#f59e0b",
};

const STORAGE_KEY = "bjc-checklist-v1";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return initialData;
}

function FailDialog({ onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">輸入失敗數量</div>
        <input
          className="dialog-input"
          type="text"
          inputMode="numeric"
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(val)}
        />
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button className="btn-save" onClick={() => onConfirm(val)}>
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ row, onSave, onClose }) {
  const [form, setForm] = useState({
    應有: row.應有 ?? "",
    成功: row.成功 ?? "",
    失敗: row.失敗 ?? "",
    類別: row.類別,
    審查: !!row.審查,
    複查: !!row.複查,
    已登記: !!row.已登記,
    已提供釐正或問題原因: !!row.已提供釐正或問題原因,
    找: row.找 ?? "找今天",
    備註: row.備註 ?? "",
    cb成功: row.結果 === "成功",
    cb失敗: row.結果 === "失敗",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCb成功 = (checked) => {
    setForm((f) => ({
      ...f,
      cb成功: checked,
      cb失敗: checked ? false : f.cb失敗,
      ...(checked ? { 失敗: "0" } : {}),
    }));
  };

  const [showFailDialog, setShowFailDialog] = useState(false);

  const handleCb失敗 = (checked) => {
    if (checked) {
      const val = form.失敗;
      const isEmpty = val === '' || val === '0' || val === 0 || val === null;
      if (isEmpty) {
        setForm((f) => ({ ...f, 失敗: '', cb成功: false }));
        setShowFailDialog(true);
      } else {
        setForm((f) => ({ ...f, cb失敗: true, cb成功: false }));
      }
    } else {
      setForm((f) => ({ ...f, cb失敗: false }));
    }
  };

  const confirmFail = (val) => {
    const n = val === '' ? '0' : val;
    setForm((f) => ({ ...f, cb失敗: true, cb成功: false, 失敗: n }));
    setShowFailDialog(false);
  };

  const handle應有 = (e) => {
    const v = e.target.value;
    setForm((f) => {
      if (f.cb成功) return { ...f, 應有: v, 成功: v };
      if (f.cb失敗) {
        const s =
          v === "" ? "" : String(Math.max(0, Number(v) - Number(f.失敗 || 0)));
        return { ...f, 應有: v, 成功: s };
      }
      return { ...f, 應有: v };
    });
  };

  const handle成功 = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, 成功: v, ...(f.cb成功 ? { 應有: v } : {}) }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">BJC {row.bjc}</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="cb-row">
            <label className="label-checkbox">
              <input
                type="checkbox"
                checked={form.cb成功}
                onChange={(e) => handleCb成功(e.target.checked)}
              />
              成功
            </label>
            <label className="label-checkbox">
              <input
                type="checkbox"
                checked={form.cb失敗}
                onChange={(e) => handleCb失敗(e.target.checked)}
              />
              失敗
            </label>
          </div>
          {form.類別 !== "無類別" && ![2001, 2002, 2003].includes(row.bjc) && (
            <>
              <label>
                應有數量
                <input
                  type="number"
                  value={form.應有}
                  onChange={handle應有}
                  placeholder="－"
                  inputMode="numeric"
                />
              </label>
              <label>
                成功數量
                <input
                  type="number"
                  value={form.成功}
                  onChange={handle成功}
                  placeholder="－"
                  inputMode="numeric"
                />
              </label>
              <label>
                失敗
                <input
                  type="number"
                  value={form.失敗}
                  onChange={set("失敗")}
                  placeholder="－"
                  inputMode="numeric"
                />
              </label>
              {form.cb失敗 && (
                <label className="label-checkbox">
                  <input
                    type="checkbox"
                    checked={form.已提供釐正或問題原因}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        已提供釐正或問題原因: e.target.checked,
                      }))
                    }
                  />
                  已提供釐正或問題原因
                </label>
              )}
            </>
          )}
          {form.類別 !== "無類別" && [2001, 2002, 2003].includes(row.bjc) && (
            <div className="bjc-note">
              BJC2001 至 BJC2003
              紀錄範圍較大，適用於直接複製貼上，因此不需要填寫數量，可填寫在備註。
            </div>
          )}
          <label>
            類別
            <select value={form.類別} onChange={set("類別")}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {form.類別 === "無類別" && (
            <label>
              找
              <select value={form.找} onChange={set("找")}>
                <option>找今天</option>
                <option>找昨天</option>
              </select>
            </label>
          )}
          <label className="label-checkbox">
            <input
              type="checkbox"
              checked={form.審查}
              onChange={(e) =>
                setForm((f) => ({ ...f, 審查: e.target.checked }))
              }
            />
            審查
          </label>
          <label className="label-checkbox">
            <input
              type="checkbox"
              checked={form.複查}
              onChange={(e) =>
                setForm((f) => ({ ...f, 複查: e.target.checked }))
              }
            />
            複查
          </label>
          <label className="label-checkbox">
            <input
              type="checkbox"
              checked={form.已登記}
              onChange={(e) =>
                setForm((f) => ({ ...f, 已登記: e.target.checked }))
              }
            />
            已登記
          </label>
          <label>
            備註
            <textarea
              value={form.備註}
              onChange={set("備註")}
              placeholder="輸入備註..."
              rows={3}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-save" onClick={() => onSave(form)}>
            儲存
          </button>
        </div>
      </div>
      {showFailDialog && (
        <FailDialog onConfirm={confirmFail} onCancel={() => setShowFailDialog(false)} />
      )}
    </div>
  );
}

const ABOUT_TEXT =
  "此頁面的目的是讓使用者可直接用手機記錄所有結果，最後再一次整理並填入 Excel，避免操作過程中頻繁切換 Excel 視窗，提升工作效率。";

function WelcomeDialog({ onClose }) {
  return (
    <div
      className="dialog-backdrop"
      style={{ position: "fixed", zIndex: 300 }}
      onClick={onClose}
    >
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 300 }}
      >
        <div className="dialog-title">關於此頁面</div>
        <p className="welcome-text">{ABOUT_TEXT}</p>
        <div className="dialog-actions">
          <button className="btn-save" style={{ flex: 1 }} onClick={onClose}>
            了解
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(loadData);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState("list");
  const [showWelcome, setShowWelcome] = useState(true);
  const [statsFilter, setStatsFilter] = useState(null);

  const handleToggle = (id, field) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, [field]: !r[field] } : r,
    );
    save(updated);
  };

  const save = (updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRows(updated);
  };

  const handleCardSelect = (id, val) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, 找: val } : r));
    save(updated);
  };

  const handleSave = (form) => {
    const updated = rows.map((r) =>
      r.id === editing.id
        ? {
            ...r,
            應有: form.應有 === "" ? null : Number(form.應有),
            成功: form.成功 === "" ? null : Number(form.成功),
            失敗: form.失敗 === "" ? null : Number(form.失敗),
            類別: form.類別,
            審查: form.審查 || null,
            複查: form.複查 || null,
            已登記: form.已登記 || null,
            已提供釐正或問題原因: form.已提供釐正或問題原因 || null,
            找: form.找 || null,
            結果: form.cb成功 ? "成功" : form.cb失敗 ? "失敗" : null,
            備註: form.備註 || null,
          }
        : r,
    );
    save(updated);
    setEditing(null);
  };

  const handleReset = () => {
    if (window.confirm("確定要清除所有資料並重置？")) {
      save(initialData);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        alert("匯入成功！");
      } catch {
        alert("檔案格式錯誤，請選擇正確的 JSON 檔案。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "全部") list = list.filter((r) => r.類別 === filter);
    if (search.trim()) {
      const q = search.trim();
      list = list.filter(
        (r) => String(r.bjc).includes(q) || (r.備註 || "").includes(q),
      );
    }
    if (statsFilter === "done") list = list.filter((r) => r.審查 || r.複查);
    if (statsFilter === "noted") list = list.filter((r) => r.備註);
    if (statsFilter === "success") list = list.filter((r) => r.結果 === "成功");
    if (statsFilter === "fail") list = list.filter((r) => r.結果 === "失敗");
    return list;
  }, [rows, filter, search, statsFilter]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      done: rows.filter((r) => r.審查 || r.複查).length,
      noted: rows.filter((r) => r.備註).length,
      success: rows.filter((r) => r.結果 === "成功").length,
      fail: rows.filter((r) => r.結果 === "失敗").length,
    }),
    [rows],
  );

  const toggleStatsFilter = (key) =>
    setStatsFilter((prev) => (prev === key ? null : key));

  return (
    <div className="app">
      <header className="header">
        <h1>BJC 審查單</h1>
        <div className="header-actions">
          {page === "list" && (
            <>
              <button className="reset-btn" onClick={handleExport}>
                匯出
              </button>
              <label className="reset-btn import-btn">
                匯入
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleImport}
                />
              </label>
              <button className="reset-btn" onClick={handleReset}>
                重置
              </button>
            </>
          )}
          <button
            className="reset-btn"
            onClick={() => setPage(page === "about" ? "list" : "about")}
          >
            {page === "about" ? "返回" : "關於"}
          </button>
        </div>
      </header>

      {page === "about" && (
        <div className="about-page">
          <div className="about-card">
            <h2 className="about-title">關於此頁面</h2>
            <p className="about-text">{ABOUT_TEXT}</p>
          </div>
        </div>
      )}

      {page === "list" && (
        <>
          <div className="stats-bar">
            <span
              className={statsFilter === null ? "stats-active" : ""}
              onClick={() => setStatsFilter(null)}
            >
              共 {stats.total} 筆
            </span>
            <span
              className={statsFilter === "done" ? "stats-active" : ""}
              onClick={() => toggleStatsFilter("done")}
            >
              已審 {stats.done} 筆
            </span>
            <span
              className={statsFilter === "noted" ? "stats-active" : ""}
              onClick={() => toggleStatsFilter("noted")}
            >
              備註 {stats.noted} 筆
            </span>
            <span
              className={statsFilter === "success" ? "stats-active" : ""}
              onClick={() => toggleStatsFilter("success")}
            >
              成功 {stats.success} 筆
            </span>
            <span
              className={statsFilter === "fail" ? "stats-active" : ""}
              onClick={() => toggleStatsFilter("fail")}
            >
              失敗 {stats.fail} 筆
            </span>
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
              {["全部", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  className={`tab ${filter === c ? "active" : ""}`}
                  style={
                    filter === c && c !== "全部"
                      ? { background: CATEGORY_COLORS[c] }
                      : {}
                  }
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
              const color = CATEGORY_COLORS[row.類別] || "#6b7280";
              const isDone = row.審查 || row.複查;
              return (
                <div
                  key={row.id}
                  className={`card ${isDone ? "card-done" : ""}`}
                  onClick={() => setEditing(row)}
                >
                  <div className="card-left">
                    <span className="bjc-num">BJC {row.bjc}</span>
                    <span className="badge" style={{ background: color }}>
                      {row.類別}
                    </span>
                  </div>
                  {row.類別 !== "無類別" && (
                    <div className="card-center">
                      <span className="num-cell">
                        <span className="num-label">應有</span>
                        <span className="num-val">{row.應有 ?? "－"}</span>
                      </span>
                      <span className="num-cell">
                        <span className="num-label">成功</span>
                        <span className="num-val success">
                          {row.成功 ?? "－"}
                        </span>
                      </span>
                      <span className="num-cell">
                        <span className="num-label">失敗</span>
                        <span className="num-val fail">{row.失敗 ?? "－"}</span>
                      </span>
                    </div>
                  )}
                  {row.類別 === "無類別" && (
                    <select
                      className="card-find-select"
                      value={row.找 ?? "找今天"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCardSelect(row.id, e.target.value);
                      }}
                    >
                      <option>找今天</option>
                      <option>找昨天</option>
                    </select>
                  )}
                  <div className="card-right">
                    <label
                      className="card-check"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!row.審查}
                        onChange={() => handleToggle(row.id, "審查")}
                      />
                      <span>審</span>
                    </label>
                    <label
                      className="card-check"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!row.複查}
                        onChange={() => handleToggle(row.id, "複查")}
                      />
                      <span>複</span>
                    </label>
                    <label
                      className="card-check"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!row.已登記}
                        onChange={() => handleToggle(row.id, "已登記")}
                      />
                      <span>登</span>
                    </label>
                    {row.備註 && <span className="note-icon">📝</span>}
                    <span className="arrow">›</span>
                  </div>
                  {row.結果 && (
                    <span
                      className={`result-tag ${row.結果 === "成功" ? "success-tag" : "fail-tag"}`}
                    >
                      {row.結果}
                    </span>
                  )}
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
        </>
      )}

      {showWelcome && <WelcomeDialog onClose={() => setShowWelcome(false)} />}
    </div>
  );
}
