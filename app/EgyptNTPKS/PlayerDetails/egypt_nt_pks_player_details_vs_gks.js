"use client";
import React, { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function EgyptNTPKSPlayerDetailsVsGks({ playerKicks }) {
    const stats = useMemo(() => {
        const map = {};
        playerKicks.forEach(k => {
            const gk = k.gk || "Unknown";
            
            if (!map[gk]) map[gk] = { name: gk, total: 0, goals: 0, saved: 0, missed: 0 };
            map[gk].total++;
            
            const s = String(k.status || "").toUpperCase();
            const howMissStr = String(k.howMiss || "").toLowerCase();
            
            if (s.includes("GOAL") || s === "G") {
                map[gk].goals++;
            } else if (howMissStr.includes("حارس") || howMissStr.includes("الحارس") || howMissStr.includes("صد") || s.includes("SAVED") || s === "S") {
                map[gk].saved++;
            } else {
                map[gk].missed++;
            }
        });

        return Object.values(map).map(r => ({
            ...r,
            successRate: r.total > 0 ? ((r.goals / r.total) * 100).toFixed(1) : "0.0"
        })).sort((a, b) => b.total - a.total);
    }, [playerKicks]);

    if (stats.length === 0) return <NoData_db message="NO GOALKEEPER DATA FOUND" />;

    return (
        <div className="table-container-premium">
            <table className="modern-h2h-table">
                <thead>
                    <tr>
                        <th style={{ width: "50px", textAlign: "center" }}>#</th>
                        <th style={{ textAlign: "center" }}>GOALKEEPER</th>
                        <th style={{ textAlign: "center" }}>TOTAL KICKS</th>
                        <th style={{ textAlign: "center" }}>GOALS</th>
                        <th style={{ textAlign: "center" }}>SAVED</th>
                        <th style={{ textAlign: "center" }}>MISSED</th>
                        <th style={{ textAlign: "center" }}>SUCCESS %</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ textAlign: "center", fontWeight: 'bold' }}>{row.name}</td>
                            <td style={{ textAlign: "center", fontSize: "17px", fontWeight: 'bold' }}>{row.total}</td>
                            <td style={{ textAlign: "center", color: '#2ecc71', fontSize: "17px", fontWeight: 'bold' }}>{row.goals}</td>
                            <td style={{ textAlign: "center", color: '#e67e22', fontSize: "17px", fontWeight: 'bold' }}>{row.saved}</td>
                            <td style={{ textAlign: "center", color: '#e74c3c', fontSize: "17px", fontWeight: 'bold' }}>{row.missed}</td>
                            <td style={{ textAlign: "center" }}>
                                <span className="rate-badge" style={{ color: parseFloat(row.successRate) >= 50 ? '#2e7d32' : '#c62828' }}>{row.successRate}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="2" style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", letterSpacing: "2px" }}>TOTAL</td>
                        <td style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.total, 0)}</td>
                        <td style={{ textAlign: "center", color: '#2ecc71', fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.goals, 0)}</td>
                        <td style={{ textAlign: "center", color: '#e67e22', fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.saved, 0)}</td>
                        <td style={{ textAlign: "center", color: '#e74c3c', fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.missed, 0)}</td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>
                            {(() => {
                                const t = stats.reduce((acc, curr) => acc + curr.total, 0);
                                const g = stats.reduce((acc, curr) => acc + curr.goals, 0);
                                return t > 0 ? ((g / t) * 100).toFixed(1) + "%" : "0.0%";
                            })()}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
