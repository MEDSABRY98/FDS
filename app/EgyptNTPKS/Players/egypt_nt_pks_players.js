"use client";

import { useMemo, useState, useEffect } from "react";
import { EgyptNTPKSService } from "../Service/egypt_nt_pks_service";
import { EgyptNTPksExcelExport } from "../ExportExcel/egypt_nt_pks_export_excel";
import EgyptNTPKSPlayerDetails from "../PlayerDetails/egypt_nt_pks_player_details";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import "./egypt_nt_pks_players.css";

export default function EgyptNTPKSPlayers({ pksData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [playerScope, setPlayerScope] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
    const pageSize = 50;

    const playerStats = useMemo(() => {
        const stats = {};

        (pksData || []).forEach(kick => {
            const addStat = (name, status, type) => {
                if (!name) return;
                if (!stats[name]) {
                    stats[name] = { name, total: 0, goals: 0, misses: 0, type };
                }
                stats[name].total++;
                const statusStr = String(status || "").toUpperCase();
                if (statusStr.includes("GOAL") || statusStr === "G") {
                    stats[name].goals++;
                } else if (statusStr.includes("MISS") || statusStr.includes("SAVED") || statusStr === "M") {
                    stats[name].misses++;
                }
            };

            if (playerScope === "ALL" || playerScope === "EGYPT") {
                addStat(kick["Egypt PLAYER"], kick["Egypt STATUS"], "EGYPT");
            }
            if (playerScope === "ALL" || playerScope === "OPPONENTS") {
                addStat(kick["OPPONENT PLAYER"], kick["OPPONENT STATUS"], "OPPONENT");
            }
        });

        return Object.values(stats).sort((a, b) => b.total - a.total);
    }, [pksData, playerScope]);

    const scopeOptions = [
        { value: "ALL", label: "ALL PLAYERS" },
        { value: "EGYPT", label: "EGYPT PLAYERS" },
        { value: "OPPONENTS", label: "OPPONENT PLAYERS" }
    ];

    const filteredStats = useMemo(() => {
        let result = playerStats;
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase().trim();
            result = result.filter(p => p.name.toLowerCase().includes(lowSearch));
        }
        return result;
    }, [playerStats, searchTerm]);

    const sortedStats = useMemo(() => {
        let sortable = [...filteredStats];
        if (sortConfig !== null) {
            sortable.sort((a, b) => {
                if (sortConfig.key === 'name') {
                    return sortConfig.direction === 'asc'
                        ? a.name.localeCompare(b.name, "ar")
                        : b.name.localeCompare(a.name, "ar");
                }
                const aVal = a[sortConfig.key] || 0;
                const bVal = b[sortConfig.key] || 0;
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }
        return sortable;
    }, [filteredStats, sortConfig]);

    const paginatedStats = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedStats.slice(start, start + pageSize);
    }, [sortedStats, currentPage]);

    const totalPages = Math.ceil(sortedStats.length / pageSize);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === 'desc' ? "↓" : "↑";
    };

    const handleExport = () => {
        const exportData = filteredStats.map((p, i) => ({
            "#": i + 1,
            "PLAYER": p.name,
            "TYPE": p.type,
            "TOTAL SHOTS": p.total,
            "GOALS": p.goals,
            "MISSES": p.misses,
            "SUCCESS RATE": p.total > 0 ? ((p.goals / p.total) * 100).toFixed(1) + "%" : "0%"
        }));
        EgyptNTPksExcelExport.exportToExcel(exportData, "Egypt_NT_PKs_Player_Stats");
    };

    useEffect(() => {
        const handleGlobalExport = () => handleExport();
        window.addEventListener('egyntpks-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyntpks-export-excel', handleGlobalExport);
    }, [filteredStats]);

    return (
        <div className="pks-players-container fade-in">
            {!selectedPlayer && (
                <div className="players-header-section">
                    <h1 className="players-title">EGYPT NT <span className="gold-text">PKs PLAYERS</span></h1>

                    <div className="players-controls-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ flex: 1, maxWidth: '450px' }}>
                            <SearchBar_db
                                value={searchTerm}
                                onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                                placeholder="Search player name..."
                            />
                        </div>

                        <div style={{ width: '250px' }}>
                            <DropDownList_db
                                options={scopeOptions}
                                value={playerScope}
                                onChange={(val) => { setPlayerScope(val); setCurrentPage(1); }}
                                placeholder="Select Scope"
                            />
                        </div>
                    </div>
                </div>
            )}

            {selectedPlayer ? (
                <EgyptNTPKSPlayerDetails
                    playerName={selectedPlayer}
                    pksData={pksData}
                    playerStats={playerStats}
                    onBack={() => setSelectedPlayer(null)}
                />
            ) : (
                <>
                    <div className="players-list-wrapper">
                        {paginatedStats.length === 0 ? (
                            <NoData_db message="NO PLAYER RECORDS FOUND." />
                        ) : (
                            <div className="players-table-lux">
                                <div className="players-header sortable-header">
                                    <div className="col-rank">#</div>
                                    <div className="col-name clickable" onClick={() => requestSort('name')}>
                                        PLAYER NAME <span className="sort-icon">{getSortIcon('name')}</span>
                                    </div>
                                    <div className="col-stat clickable" onClick={() => requestSort('total')}>
                                        TOTAL <span className="sort-icon">{getSortIcon('total')}</span>
                                    </div>
                                    <div className="col-stat clickable" onClick={() => requestSort('goals')}>
                                        GOALS <span className="sort-icon">{getSortIcon('goals')}</span>
                                    </div>
                                    <div className="col-stat clickable" onClick={() => requestSort('misses')}>
                                        MISSES <span className="sort-icon">{getSortIcon('misses')}</span>
                                    </div>
                                </div>

                                <div className="players-body">
                                    {paginatedStats.map((player, index) => (
                                        <div
                                            key={index}
                                            className="player-row-modern fade-in"
                                            onClick={() => {
                                                setSelectedPlayer(player.name);
                                                window.scrollTo(0, 0);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="col-rank">
                                                <span className="rank-badge">{(currentPage - 1) * pageSize + index + 1}</span>
                                            </div>
                                            <div className="col-name">
                                                <span className="player-name-txt">{player.name}</span>
                                            </div>
                                            <div className="col-stat">
                                                <span className="stat-val total">{player.total}</span>
                                            </div>
                                            <div className="col-stat goals">
                                                <span className="stat-val goal">{player.goals}</span>
                                            </div>
                                            <div className="col-stat misses">
                                                <span className="stat-val miss">{player.misses}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="players-pagination">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            >
                                PREV
                            </button>
                            <span className="page-info">PAGE {currentPage} OF {totalPages}</span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            >
                                NEXT
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
