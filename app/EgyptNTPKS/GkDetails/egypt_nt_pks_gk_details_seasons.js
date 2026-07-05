"use client";
import React, { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";

export default function EgyptNTPKSGkDetailsSeasons({ gkKicks }) {
    const stats = useMemo(() => {
        const map = {};
        gkKicks.forEach(k => {
            const sName = k["SEASON"] || "Unknown";
            if (!map[sName]) map[sName] = { name: sName, faced: 0, saved: 0, missed: 0, conceded: 0 };
            map[sName].faced++;
            const sStatus = String(k.status || "").toUpperCase();
            if (sStatus.includes("GOAL") || sStatus === "G") map[sName].conceded++;
            else if (k.isSave) map[sName].saved++;
            else map[sName].missed++;
        });

        return Object.values(map).map(r => ({
            ...r,
            saveRate: r.faced > 0 ? ((r.saved / r.faced) * 100).toFixed(1) : "0.0"
        })).sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' }));
    }, [gkKicks]);

    if (stats.length === 0) return <NoData_db message="NO SEASON DATA FOUND" />;

    return (
        <div className="table-container-premium">
            <table className="modern-h2h-table">
                <thead>
                    <tr>
                        <th style={{ width: "50px", textAlign: "center" }}>#</th>
                        <th style={{ textAlign: "center" }}>SEASON</th>
                        <th style={{ textAlign: "center" }}>FACED</th>
                        <th style={{ textAlign: "center" }}>SAVED</th>
                        <th style={{ textAlign: "center" }}>CONCEDED</th>
                        <th style={{ textAlign: "center" }}>MISSED</th>
                        <th style={{ textAlign: "center" }}>SAVE %</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ textAlign: "center", fontWeight: 'bold' }}>{row.name}</td>
                            <td style={{ textAlign: "center", fontSize: "17px", fontWeight: 'bold' }}>{row.faced}</td>
                            <td style={{ textAlign: "center", color: '#2ecc71', fontSize: "17px", fontWeight: 'bold' }}>{row.saved}</td>
                            <td style={{ textAlign: "center", color: '#e74c3c', fontSize: "17px", fontWeight: 'bold' }}>{row.conceded}</td>
                            <td style={{ textAlign: "center", fontSize: "17px", fontWeight: 'bold' }}>{row.missed}</td>
                            <td style={{ textAlign: "center" }}>
                                <span className="rate-badge" style={{ color: parseFloat(row.saveRate) >= 50 ? '#2e7d32' : '#c62828' }}>{row.saveRate}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="2" style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", letterSpacing: "2px" }}>TOTAL</td>
                        <td style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.faced, 0)}</td>
                        <td style={{ textAlign: "center", color: '#2ecc71', fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.saved, 0)}</td>
                        <td style={{ textAlign: "center", color: '#e74c3c', fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.conceded, 0)}</td>
                        <td style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>{stats.reduce((acc, curr) => acc + curr.missed, 0)}</td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>
                            {(() => {
                                const f = stats.reduce((acc, curr) => acc + curr.faced, 0);
                                const s = stats.reduce((acc, curr) => acc + curr.saved, 0);
                                return f > 0 ? ((s / f) * 100).toFixed(1) + "%" : "0.0%";
                            })()}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
