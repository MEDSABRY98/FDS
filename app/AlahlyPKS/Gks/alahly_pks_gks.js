"use client";

import { useMemo, useState, useEffect } from "react";
import { AlAhlyService } from "../../Alahly/Service/alahly_db_service";
import { AlAhlyPksExcelExport } from "../ExportExcel/alahly_pks_export_excel";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import "./alahly_pks_gks.css";

export default function AlAhlyPKsGKs({ pksData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [gkScope, setGkScope] = useState("ALL"); // ALL, AHLY, OPPONENTS
    const scopeOptions = [
        { value: "ALL", label: "ALL GKs" },
        { value: "AHLY", label: "AL AHLY GKs" },
        { value: "OPPONENTS", label: "OPPONENT GKs" }
    ];
    const [sortConfig, setSortConfig] = useState({ key: 'faced', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    // Aggregate GK statistics
    const gkStats = useMemo(() => {
        const stats = {};

        (pksData || []).forEach(kick => {
            const addGkStat = (gkName, opponentPlayerName, opponentStatus, howMiss, isAhlyGK) => {
                if (!gkName || gkName === "---" || !opponentPlayerName) return;

                if (!stats[gkName]) {
                    stats[gkName] = {
                        name: gkName,
                        isAhly: isAhlyGK,
                        matchIds: new Set(),
                        faced: 0,
                        saved: 0,
                        conceded: 0,
                    };
                }

                const gk = stats[gkName];
                const matchId = kick.PKS_ID || kick.MATCH_ID;
                if (matchId) gk.matchIds.add(matchId);

                gk.faced++;
                const statusStr = String(opponentStatus || "").toUpperCase();
                const howMissStr = String(howMiss || "").toLowerCase();

                if (statusStr.includes("GOAL")) {
                    gk.conceded++;
                } else if ((statusStr.includes("MISS") || statusStr.includes("SAVED")) && howMissStr.includes("الحارس")) {
                    // Only a real save if HowMiss mentions the goalkeeper
                    gk.saved++;
                }
                // else: missed for another reason (post, over bar, etc.) — not counted as a save
            };

            // Ahly GK faces opponent kicks → check HOWMISS OPPONENT
            if (gkScope === "ALL" || gkScope === "AHLY") {
                addGkStat(
                    kick["AHLY GK"],
                    kick["OPPONENT PLAYER"],
                    kick["OPPONENT STATUS"],
                    kick["HOWMISS OPPONENT"],
                    true
                );
            }

            // Opponent GK faces Ahly kicks → check HOWMISS AHLY
            if (gkScope === "ALL" || gkScope === "OPPONENTS") {
                addGkStat(
                    kick["OPPONENT GK"],
                    kick["AHLY PLAYER"],
                    kick["AHLY STATUS"],
                    kick["HOWMISS AHLY"],
                    false
                );
            }
        });

        return Object.values(stats).map(gk => ({
            ...gk,
            matches: gk.matchIds.size,
            saveRate: gk.faced > 0 ? ((gk.saved / gk.faced) * 100).toFixed(1) : "0.0",
        }));
    }, [pksData, gkScope]);

    const filteredStats = useMemo(() => {
        let result = gkStats;
        if (searchTerm) {
            const low = searchTerm.toLowerCase().trim();
            result = result.filter(g => g.name.toLowerCase().includes(low));
        }
        return result;
    }, [gkStats, searchTerm]);

    const sortedStats = useMemo(() => {
        let sortable = [...filteredStats];
        sortable.sort((a, b) => {
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name, "ar")
                    : b.name.localeCompare(a.name, "ar");
            }
            const aVal = parseFloat(a[sortConfig.key]) || 0;
            const bVal = parseFloat(b[sortConfig.key]) || 0;
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return sortable;
    }, [filteredStats, sortConfig]);

    const totalPages = Math.ceil(sortedStats.length / pageSize);
    const paginatedStats = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedStats.slice(start, start + pageSize);
    }, [sortedStats, currentPage]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === 'desc' ? "↓" : "↑";
    };

    const handleExport = () => {
        const exportData = sortedStats.map((g, i) => ({
            "#": i + 1,
            "GK NAME": g.name,
            "TEAM": g.isAhly ? "AL AHLY" : "OPPONENT",
            "MATCHES": g.matches,
            "FACED": g.faced,
            "SAVED": g.saved,
            "CONCEDED": g.conceded,
            "SAVE RATE": g.saveRate + "%",
        }));
        AlAhlyPksExcelExport.exportToExcel(exportData, "AlAhly_PKs_GK_Stats");
    };

    useEffect(() => {
        const handler = () => handleExport();
        window.addEventListener('alahly-export-excel', handler);
        return () => window.removeEventListener('alahly-export-excel', handler);
    }, [sortedStats]);

    return (
        <div className="pks-gks-container fade-in">
            {/* HEADER */}
            <div className="gks-header-row">
                <h1 className="gks-title">AL AHLY <span className="gold-text">PKs GOALKEEPERS</span></h1>

                <div className="gks-controls-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                    {/* Search */}
                    <div style={{ flex: 1, maxWidth: '450px' }}>
                        <SearchBar_db
                            value={searchTerm}
                            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                            placeholder="Search goalkeeper name..."
                        />
                    </div>

                    {/* Scope Dropdown */}
                    <div style={{ width: '250px' }}>
                        <DropDownList_db
                            options={scopeOptions}
                            value={gkScope}
                            onChange={(val) => { setGkScope(val); setCurrentPage(1); }}
                            placeholder="Select Scope"
                        />
                    </div>
                </div>
            </div>


            {/* TABLE */}
            <div className="gks-table-wrapper">
                <table className="gks-table">
                    <thead>
                        <tr>
                            <th className="col-rank">#</th>
                            <th className="col-gk-name clickable" onClick={() => requestSort('name')}>
                                GOALKEEPER NAME {getSortIcon('name')}
                            </th>
                            <th className="col-stat clickable" onClick={() => requestSort('matches')}>
                                M {getSortIcon('matches')}
                            </th>
                            <th className="col-stat clickable" onClick={() => requestSort('faced')}>
                                FACED {getSortIcon('faced')}
                            </th>
                            <th className="col-stat clickable" onClick={() => requestSort('saved')}>
                                SAVED {getSortIcon('saved')}
                            </th>
                            <th className="col-stat clickable" onClick={() => requestSort('saveRate')}>
                                SAVE % {getSortIcon('saveRate')}
                            </th>
                            <th className="col-stat clickable" onClick={() => requestSort('conceded')}>
                                CONCEDED {getSortIcon('conceded')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStats.length === 0 ? (
                            <NoData_db isTable={true} colSpan={7} message="NO GOALKEEPER RECORDS FOUND" />
                        ) : (
                            paginatedStats.map((gk, i) => (
                                <tr key={i} className="gks-row">
                                    <td className="col-rank">
                                        <span className="gks-rank-badge">{(currentPage - 1) * pageSize + i + 1}</span>
                                    </td>
                                    <td className="col-gk-name">{gk.name}</td>
                                    <td className="col-stat">{gk.matches}</td>
                                    <td className="col-stat faced">{gk.faced}</td>
                                    <td className="col-stat saved">{gk.saved}</td>
                                    <td className="col-stat rate">
                                        <span className="rate-badge" style={{
                                            color: parseFloat(gk.saveRate) >= 50 ? '#2e7d32' : '#c62828'
                                        }}>
                                            {gk.saveRate}%
                                        </span>
                                    </td>
                                    <td className="col-stat conceded">{gk.conceded}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {paginatedStats.length > 0 && (
                        <tfoot>
                            <tr className="gks-total-row">
                                <td colSpan={2} style={{ textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '2px' }}>
                                    TOTAL
                                </td>
                                <td className="col-stat">—</td>
                                <td className="col-stat">{filteredStats.reduce((a, b) => a + b.faced, 0)}</td>
                                <td className="col-stat">{filteredStats.reduce((a, b) => a + b.saved, 0)}</td>
                                <td className="col-stat">
                                    {(() => {
                                        const totalFaced = filteredStats.reduce((a, b) => a + b.faced, 0);
                                        const totalSaved = filteredStats.reduce((a, b) => a + b.saved, 0);
                                        return totalFaced > 0 ? ((totalSaved / totalFaced) * 100).toFixed(1) + "%" : "0%";
                                    })()}
                                </td>
                                <td className="col-stat">{filteredStats.reduce((a, b) => a + b.conceded, 0)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="gks-pagination">
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        PREV
                    </button>
                    <span className="page-info">PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        NEXT
                    </button>
                </div>
            )}

            {/* LEGEND */}
            <div className="gks-legend">
                <span><strong>M:</strong> Matches</span>
                <span><strong>FACED:</strong> Total kicks faced</span>
                <span><strong>SAVED:</strong> Kicks saved/missed</span>
                <span><strong>CONCEDED:</strong> Goals let in</span>
                <span><strong>SAVE %:</strong> Save percentage</span>
            </div>
        </div>
    );
}
