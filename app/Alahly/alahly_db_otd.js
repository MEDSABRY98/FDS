"use client";

import { useMemo, useState, useEffect } from "react";
import { Trophy, CheckCircle, MinusCircle, XCircle, Goal, ShieldAlert, Calendar } from "lucide-react";
import { AlAhlyExcelExport } from "./alahly_export_excel";
import "./alahly_db_otd.css";

export default function AlAhlyOTD({ matches }) {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    });

    const otdMatches = useMemo(() => {
        if (!selectedDate) return [];
        const [targetMonth, targetDay] = selectedDate.split('-').map(Number);

        return matches.filter(m => {
            if (!m.DATE) return false;
            let day, month;
            if (m.DATE.includes('/')) {
                const parts = m.DATE.split('/');
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
            } else {
                const d = new Date(m.DATE);
                if (isNaN(d.getTime())) return false;
                day = d.getDate();
                month = d.getMonth() + 1;
            }
            return day === targetDay && month === targetMonth;
        }).sort((a, b) => {
            const getYear = (d) => {
                if(d.includes('/')) return parseInt(d.split('/')[2], 10);
                return new Date(d).getFullYear();
            };
            return getYear(b.DATE) - getYear(a.DATE); // Sort newest first
        });
    }, [matches, selectedDate]);

    const stats = useMemo(() => {
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let gf = 0;
        let ga = 0;

        otdMatches.forEach(m => {
            const res = String(m["W-D-L"] || "").toUpperCase();
            if (res === "W") wins++;
            else if (res === "D") draws++;
            else if (res === "L") losses++;

            gf += parseInt(m.GF) || 0;
            ga += parseInt(m.GA) || 0;
        });

        return { total: otdMatches.length, wins, draws, losses, gf, ga };
    }, [otdMatches]);

    const opponents = useMemo(() => {
        const map = new Map();

        otdMatches.forEach(m => {
            const opp = m["OPPONENT TEAM"] || "Unknown";
            if (!map.has(opp)) {
                map.set(opp, { opp, total: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
            }
            const stat = map.get(opp);
            stat.total++;
            const res = String(m["W-D-L"] || "").toUpperCase();
            if (res === "W") stat.wins++;
            else if (res === "D") stat.draws++;
            else if (res === "L") stat.losses++;

            stat.gf += parseInt(m.GF) || 0;
            stat.ga += parseInt(m.GA) || 0;
        });

        return Array.from(map.values()).sort((a, b) => b.total - a.total || b.wins - a.wins);
    }, [otdMatches]);

    useEffect(() => {
        const handleGlobalExport = () => {
            const exportData = otdMatches.map((m, i) => ({
                "#": i + 1,
                "DATE": m.DATE,
                "SEASON": m["SEASON - NAME"],
                "STADIUM": m.STAD || "-",
                "OPPONENT": m["OPPONENT TEAM"],
                "SCORE": `${m.GF} - ${m.GA}`,
                "RESULT": m["W-D-L"]
            }));
            
            AlAhlyExcelExport.exportToExcel(exportData, `AlAhly_OTD_${selectedDate}`);
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [otdMatches, selectedDate]);

    return (
        <div className="tab-content" id="tab-otd">
            <div className="otd-wrap" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingBottom: '50px' }}>
                {/* Header & Date Picker */}
                <div className="otd-header-card">
                    <div className="otd-header-title">
                        <div className="otd-icon-box">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="otd-title-text">ON THIS <span style={{ color: '#C8102E' }}>DAY</span></h2>
                        </div>
                    </div>

                    <div className="otd-date-picker">
                        <label className="otd-date-label">SELECT DATE (MM-DD):</label>
                        <input 
                            type="text" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            placeholder="MM-DD"
                            className="otd-date-input"
                            maxLength={5}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="otd-stats-grid">
                    <StatCard title="MATCHES" value={stats.total} icon={<Trophy size={20} />} color="#333" />
                    <StatCard title="WINS" value={stats.wins} icon={<CheckCircle size={20} />} color="#2ecc71" />
                    <StatCard title="DRAWS" value={stats.draws} icon={<MinusCircle size={20} />} color="#f39c12" />
                    <StatCard title="DEFEATS" value={stats.losses} icon={<XCircle size={20} />} color="#e74c3c" />
                    <StatCard title="GOALS FOR" value={stats.gf} icon={<Goal size={20} />} color="#C8102E" />
                    <StatCard title="GOALS AGAINST" value={stats.ga} icon={<ShieldAlert size={20} />} color="#888" />
                </div>

                {/* Matches Table */}
                <div className="otd-section">
                    <h3 className="otd-section-title">
                        <Trophy size={18} color="#C8102E" /> HISTORICAL MATCHES
                    </h3>
                    <div className="otd-table-wrapper">
                        {otdMatches.length === 0 ? (
                            <div className="otd-empty-state">
                                NO MATCHES PLAYED ON THIS DAY.
                            </div>
                        ) : (
                            <table className="otd-table" style={{ minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>SEASON</th>
                                        <th>STADIUM</th>
                                        <th>OPPONENT</th>
                                        <th>SCORE</th>
                                        <th>RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otdMatches.map((m, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 700 }}>{m.DATE}</td>
                                            <td style={{ color: '#666', fontWeight: 600 }}>{m["SEASON - NAME"]}</td>
                                            <td style={{ color: '#888' }}>{m.STAD || "-"}</td>
                                            <td style={{ fontWeight: 700, color: '#1a1a1a' }}>{m["OPPONENT TEAM"]}</td>
                                            <td style={{ fontWeight: 800, color: '#C8102E', fontSize: '18px' }}>{m.GF} - {m.GA}</td>
                                            <td>
                                                <span className={`otd-result-badge ${String(m["W-D-L"]).toLowerCase()}`}>
                                                    {m["W-D-L"]}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Opponents Table */}
                {opponents.length > 0 && (
                    <div className="otd-section">
                        <h3 className="otd-section-title">
                            <ShieldAlert size={18} color="#C8102E" /> OPPONENTS STATS ON THIS DAY
                        </h3>
                        <div className="otd-table-wrapper">
                            <table className="otd-table" style={{ minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th>OPPONENT</th>
                                        <th>MATCHES</th>
                                        <th>W</th>
                                        <th>D</th>
                                        <th>L</th>
                                        <th>GF</th>
                                        <th>GA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opponents.map((opp, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 800, color: '#1a1a1a' }}>{opp.opp}</td>
                                            <td style={{ fontWeight: 700, color: '#333' }}>{opp.total}</td>
                                            <td style={{ fontWeight: 700, color: '#2ecc71' }}>{opp.wins}</td>
                                            <td style={{ fontWeight: 700, color: '#f39c12' }}>{opp.draws}</td>
                                            <td style={{ fontWeight: 700, color: '#e74c3c' }}>{opp.losses}</td>
                                            <td style={{ fontWeight: 700, color: '#333' }}>{opp.gf}</td>
                                            <td style={{ fontWeight: 700, color: '#333' }}>{opp.ga}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="otd-stat-card">
            <div className="otd-stat-icon" style={{ background: `${color}15`, color: color }}>
                {icon}
            </div>
            <div>
                <div className="otd-stat-title">{title}</div>
                <div className="otd-stat-value">{value}</div>
            </div>
        </div>
    );
}
