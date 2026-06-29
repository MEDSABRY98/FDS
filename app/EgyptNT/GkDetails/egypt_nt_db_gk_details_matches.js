"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import { GK_TOTAL_ROW_STYLE, GK_TOTAL_LABEL_STYLE, GK_TOTAL_VAL_STYLE } from "./egypt_nt_db_gk_details_utils";

export default function EgyptNTGKMatches({ stats, renderEventsCell }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [threshold, setThreshold] = useState(1);
    const [operator, setOperator] = useState('>=');
    const pageSize = 50;

    const filteredMatches = useMemo(() => {
        return stats.matchHistory.filter(m => {
            if (filter === 'all') return true;
            let val = 0;
            if (filter === 'gc') val = (m.gc || 0);
            else if (filter === 'cs') val = (m.gc === 0 ? 1 : 0);
            else if (filter === 'psm') val = (m.psm || 0);
            else if (filter === 'pg') val = (m.pg || 0);

            const numThreshold = parseInt(threshold) || 1;
            if (operator === '>=') return val >= numThreshold;
            if (operator === '==') return val === numThreshold;
            if (operator === '<=') return val <= numThreshold && val > 0;
            return true;
        });
    }, [stats.matchHistory, filter, threshold, operator]);

    const totalMatchesNum = filteredMatches.length;
    const totalPages = Math.ceil(totalMatchesNum / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = filteredMatches.slice(startIdx, startIdx + pageSize);

    const summary = useMemo(() => {
        const s = { gc: 0, cs: 0, psm: 0, pg: 0 };
        filteredMatches.forEach(m => {
            s.gc += (m.gc || 0);
            if (m.clean) s.cs += 1;
            s.psm += (m.psm || 0);
            s.pg += (m.pg || 0);
        });
        return s;
    }, [filteredMatches]);

    return (
        <div className="history-section fade-in">
            <div className="gk-matches-header">
                <div className="gk-matches-controls-row">
                    <div className="gk-matches-filter-group">
                        <select
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                            className="gk-event-white-select gk-type-select"
                            aria-label="Filter matches by stat"
                        >
                            <option value="all">ALL MATCHES</option>
                            <option value="gc">GOALS CONC.</option>
                            <option value="cs">CLEAN SHEETS</option>
                            <option value="psm">PEN SAVED</option>
                            <option value="pg">PEN GOALS</option>
                        </select>

                        <div className={`gk-matches-filter-extra ${filter === 'all' ? 'is-disabled' : ''}`}>
                            <select
                                value={operator}
                                onChange={(e) => { setOperator(e.target.value); setCurrentPage(1); }}
                                className="gk-event-white-select gk-op-select"
                                disabled={filter === 'all'}
                                aria-label="Comparison operator"
                            >
                                <option value=">=">≥</option>
                                <option value="==">=</option>
                                <option value="<=">≤</option>
                            </select>

                            <input
                                type="number"
                                min="1"
                                value={threshold}
                                onChange={(e) => { setThreshold(e.target.value); setCurrentPage(1); }}
                                className="gk-event-white-input"
                                disabled={filter === 'all'}
                                aria-label="Threshold value"
                            />
                        </div>
                    </div>

                    <div className="gk-event-summary-box">
                        <div className="gk-sum-item">
                            <span className="gk-sum-label">MATCHES</span>
                            <span className="gk-sum-val">{totalMatchesNum}</span>
                        </div>
                        <div className="gk-sum-divider" />
                        <div className={`gk-sum-item ${filter === 'all' ? 'is-muted' : ''}`}>
                            <span className="gk-sum-label">
                                TOTAL {filter === 'all' ? 'STATS' : (filter === 'psm' ? 'PS' : filter.toUpperCase())}
                            </span>
                            <span className="gk-sum-val gk-sum-val-accent">
                                {filter === 'all' ? '—' : (summary[filter] || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                {totalMatchesNum === 0 ? (
                    <NoData_db message="NO MATCH RECORDS FOUND FOR THIS GK" />
                ) : (
                    <table className="player-match-table gk-matches-table">
                        <colgroup>
                            <col style={{ width: 44 }} />
                            <col style={{ width: 140 }} />
                            <col style={{ width: 102 }} />
                            <col style={{ width: 128 }} />
                            <col style={{ width: "24%" }} />
                            <col style={{ width: 88 }} />
                            <col style={{ width: 96 }} />
                            <col style={{ width: 132 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MATCH ID</th>
                                <th>DATE</th>
                                <th>SEASON</th>
                                <th>OPPONENT TEAM</th>
                                <th>STATUS</th>
                                <th>GOALS CONC.</th>
                                <th>STATS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMatches.map((m, idx) => (
                                <tr key={startIdx + idx}>
                                    <td className="gk-cell-idx">{startIdx + idx + 1}</td>
                                    <td className="m-id-cell gk-cell-id">
                                        <span className="gk-match-id-text">{m.idx}</span>
                                    </td>
                                    <td className="gk-cell-date">{m.date}</td>
                                    <td className="gk-cell-season">{m.season}</td>
                                    <td className="gk-cell-opp">{m.opponent}</td>
                                    <td>
                                        <span className={`m-role-pill ${m.role === 'اساسي' ? 'role-starter' : 'role-sub'}`}>
                                            {m.role === 'اساسي' || !m.role ? 'Starter' : 'Sub'}
                                        </span>
                                    </td>
                                    <td style={{ color: m.gc > 0 ? '#e74c3c' : '#2ecc71', fontWeight: '900' }}>{m.gc}</td>
                                    <td>{renderEventsCell(m)}</td>
                                </tr>
                            ))}
                            <tr style={GK_TOTAL_ROW_STYLE}>
                                <td colSpan={6} style={GK_TOTAL_LABEL_STYLE}>TOTAL</td>
                                <td style={{ ...GK_TOTAL_VAL_STYLE, color: summary.gc > 0 ? "#ff6b6b" : "#5ef193" }}>{summary.gc || "—"}</td>
                                <td style={GK_TOTAL_VAL_STYLE}>
                                    <div className="m-stats-cell" style={{ display: "flex", gap: "4px", flexWrap: "nowrap", alignItems: "center", justifyContent: "center" }}>
                                        {summary.cs > 0 && <div className="m-mini-pill" style={{ background: "#2ecc71", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>{summary.cs} CS</div>}
                                        {summary.psm > 0 && <div className="m-mini-pill" style={{ background: "#3498db", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>{summary.psm} PS</div>}
                                        {summary.pg > 0 && <div className="m-mini-pill" style={{ background: "#9b59b6", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>{summary.pg} PG</div>}
                                        {summary.cs === 0 && summary.psm === 0 && summary.pg === 0 && <span style={{ color: "#ccc" }}>—</span>}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="gk-matches-pagination">
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>←</button>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>→</button>
                </div>
            )}

            <style jsx global>{`
                .gk-matches-table {
                    table-layout: fixed;
                    width: 100%;
                }
                .gk-matches-table .gk-cell-idx,
                .gk-matches-table td:nth-child(7) {
                    white-space: nowrap;
                }
                .gk-matches-table .gk-cell-id {
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    line-height: 1.35;
                }
                .gk-match-id-text {
                    display: inline;
                    font-family: 'Space Mono', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--player-gold, var(--gold));
                }
                .gk-matches-table .gk-cell-date {
                    white-space: nowrap;
                    font-size: 14px;
                    font-weight: 700;
                }
                .gk-matches-table .gk-cell-season {
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    line-height: 1.35;
                    font-size: 13px;
                }
                .gk-matches-table .gk-cell-opp {
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    line-height: 1.35;
                    color: var(--gold);
                    font-weight: 800;
                }
            `}</style>

            <style jsx>{`
                .gk-matches-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .gk-matches-controls-row {
                    display: flex;
                    gap: 14px;
                    align-items: stretch;
                    justify-content: center;
                    flex-wrap: wrap;
                    width: 100%;
                    max-width: 760px;
                }
                .gk-matches-filter-group {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    background: #fff;
                    padding: 6px;
                    border-radius: 15px;
                    border: 1px solid #e0e0e0;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                }
                .gk-matches-filter-extra {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    transition: opacity 0.3s;
                }
                .gk-matches-filter-extra.is-disabled {
                    opacity: 0.35;
                    pointer-events: none;
                }
                .gk-event-white-select {
                    appearance: none;
                    -webkit-appearance: none;
                    background: #fff;
                    border: 1px solid #ececec;
                    color: #000;
                    padding: 10px 34px 10px 14px;
                    border-radius: 10px;
                    font-family: 'Space Mono', monospace;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    outline: none;
                    transition: 0.2s;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                }
                .gk-type-select { min-width: 150px; }
                .gk-op-select {
                    width: 64px;
                    text-align: center;
                    text-align-last: center;
                    background-color: #f5f5f5;
                    color: var(--player-gold, #c9a84c);
                    padding-left: 10px;
                    padding-right: 28px;
                }
                .gk-event-white-select:hover:not(:disabled) {
                    border-color: var(--player-gold, #c9a84c);
                    background-color: #fafafa;
                }
                .gk-event-white-select:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .gk-event-white-input {
                    background: #fff;
                    border: 1px solid #ececec;
                    width: 58px;
                    padding: 8px 6px;
                    border-radius: 10px;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 20px;
                    color: #000;
                    text-align: center;
                    outline: none;
                    transition: 0.2s;
                }
                .gk-event-white-input:focus:not(:disabled) {
                    border-color: var(--player-gold, #c9a84c);
                }
                .gk-event-white-input:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .gk-event-white-input::-webkit-inner-spin-button { opacity: 1; }

                .gk-event-summary-box {
                    display: flex;
                    align-items: center;
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    padding: 6px 22px;
                    border-radius: 15px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
                    min-height: 52px;
                }
                .gk-sum-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4px 14px;
                    transition: opacity 0.3s;
                }
                .gk-sum-item.is-muted { opacity: 0.35; }
                .gk-sum-divider {
                    width: 1px;
                    height: 30px;
                    background: #eee;
                }
                .gk-sum-label {
                    font-family: 'Space Mono', monospace;
                    font-size: 9px;
                    color: #aaa;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .gk-sum-val {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 24px;
                    color: #000;
                    letter-spacing: 1px;
                    line-height: 1.1;
                }
                .gk-sum-val-accent {
                    color: var(--player-gold, #c9a84c);
                }

                .gk-matches-pagination {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    justify-content: center;
                    margin-top: 20px;
                }
                .gk-matches-pagination button {
                    background: rgba(201, 168, 76, 0.15);
                    border: 1px solid rgba(201, 168, 76, 0.3);
                    color: var(--player-gold, #c9a84c);
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-family: 'Space Mono', monospace;
                    font-weight: 700;
                    font-size: 11px;
                    cursor: pointer;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gk-matches-pagination button:hover:not(:disabled) {
                    background: var(--player-gold, #c9a84c);
                    color: #000;
                    border-color: var(--player-gold, #c9a84c);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.2);
                    transform: translateY(-1px);
                }
                .gk-matches-pagination button:disabled {
                    opacity: 0.2;
                    cursor: not-allowed;
                }
                .gk-matches-pagination span {
                    font-family: 'Space Mono', monospace;
                    font-size: 13px;
                    color: var(--player-gold, #c9a84c);
                    letter-spacing: 2px;
                    font-weight: 800;
                }

                @media (max-width: 640px) {
                    .gk-matches-controls-row {
                        flex-direction: column;
                        align-items: center;
                    }
                    .gk-matches-filter-group,
                    .gk-event-summary-box {
                        width: 100%;
                        max-width: 360px;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
