"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AlAhlyService } from "./alahly_db_service";
import "./alahly_db_managers.css";
import Manager_Details_Hub from "./alahly_db_manager_details.js";

export default function AlAhlyManagers({ matches, playerDetails, lineupDetails }) {
    const [managerStatus, setManagerStatus] = useState("alahly"); // "alahly" or "opponent"
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("All");
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [teamSearch, setTeamSearch] = useState("");

    // Selection state for sub-tabs
    const [selectedManager, setSelectedManager] = useState(null);

    const statusDropdownRef = useRef(null);
    const teamDropdownRef = useRef(null);

    const statusLabels = { alahly: "Al Ahly Managers", opponent: "Opponent Managers" };

    useEffect(() => {
        function handleClickOutside(event) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) setIsStatusOpen(false);
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) setIsTeamOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const managerColumn = managerStatus === "alahly" ? "AHLY MANAGER" : "OPPONENT MANAGER";
    const teamColumn = managerStatus === "alahly" ? "AHLY TEAM" : "OPPONENT TEAM";

    const teams = useMemo(() => {
        const set = new Set((matches || []).map(m => m[teamColumn]).filter(Boolean));
        return ["All", ...Array.from(set).sort()];
    }, [matches, teamColumn]);

    const filteredTeamsForSearch = useMemo(() => {
        if (!teamSearch) return teams;
        return teams.filter(t => t.toLowerCase().includes(teamSearch.toLowerCase()));
    }, [teams, teamSearch]);

    const managerStats = useMemo(() => {
        const stats = {};
        (matches || []).forEach(m => {
            const name = m[managerColumn];
            if (!name || name === "Unknown" || name === "-") return;
            if (teamFilter !== "All" && m[teamColumn] !== teamFilter) return;

            if (!stats[name]) {
                stats[name] = {
                    name,
                    matches: 0,
                    wins: 0,
                    pDraws: 0,
                    nDraws: 0,
                    losses: 0,
                    gs: 0,
                    ga: 0,
                    csFor: 0,
                    csAgainst: 0
                };
            }
            const s = stats[name];
            s.matches += 1;
            const gf = parseInt(m["GF"]) || 0;
            const ga = parseInt(m["GA"]) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();
            s.gs += gf;
            s.ga += ga;

            if (wdl.includes('W')) {
                s.wins += 1;
            } else if (wdl.includes('L')) {
                s.losses += 1;
            } else if (wdl.includes('D')) {
                if (gf > 0 || ga > 0) s.pDraws += 1; else s.nDraws += 1;
            }

            if (ga === 0) s.csFor += 1;
            if (gf === 0) s.csAgainst += 1;
        });
        return Object.values(stats)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name));
    }, [matches, managerColumn, teamColumn, teamFilter, searchTerm]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedManager) handleExport();
        };
        window.addEventListener('alahly-export-excel', handleGlobalExport);
        return () => window.removeEventListener('alahly-export-excel', handleGlobalExport);
    }, [managerStats, selectedManager]);

    const handleExport = () => {
        const exportData = managerStats.map((s, idx) => ({
            "#": idx + 1,
            "MANAGER NAME": s.name,
            "MP": s.matches,
            "W": s.wins,
            "D(+)": s.pDraws,
            "D(-)": s.nDraws,
            "L": s.losses,
            "GS": s.gs,
            "GA": s.ga,
            "CS(+)": s.csFor,
            "CS(-)": s.csAgainst
        }));
        AlAhlyService.exportToExcel(exportData, `AlAhly_Managers_${managerStatus}`);
    };

    const grandTotals = useMemo(() => {
        const t = { matches: 0, wins: 0, pDraws: 0, nDraws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
        managerStats.forEach(s => {
            t.matches += s.matches; t.wins += s.wins; t.pDraws += s.pDraws; t.nDraws += s.nDraws; t.losses += s.losses;
            t.gs += s.gs; t.ga += s.ga; t.csFor += s.csFor; t.csAgainst += s.csAgainst;
        });
        return t;
    }, [managerStats]);

    // If a manager is selected, show the Details Hub
    if (selectedManager) {
        return (
            <Manager_Details_Hub
                managerName={selectedManager}
                managerStatus={managerStatus}
                masterMatches={matches}
                onBack={() => setSelectedManager(null)}
                playerDetails={playerDetails}
                lineupDetails={lineupDetails}
            />
        );
    }

    return (
        <div className="tab-content" id="tab-managers">
            <div className="mgr-premium-wrap" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div className="mgr-header-tabs">
                    <div className="section-title">AL AHLY <span className="accent">MANAGERS</span></div>
                </div>
                <div className="gold-line"></div>

                <div className="mgr-controls">
                    <div className="mgr-search-wrap" style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search manager name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mgr-search-input"
                        />
                    </div>

                    <div className="mgr-dropdown-wrap" ref={statusDropdownRef}>
                        <div className={`mgr-dropdown-trigger ${isStatusOpen ? 'active' : ''}`} onClick={() => setIsStatusOpen(!isStatusOpen)}>
                            <span className="current-label">{statusLabels[managerStatus]}</span>
                            <span className="mgr-dropdown-arrow"></span>
                        </div>
                        {isStatusOpen && (
                            <div className="mgr-dropdown-options">
                                {Object.keys(statusLabels).map(key => (
                                    <div
                                        key={key}
                                        className={`mgr-dropdown-item ${managerStatus === key ? 'selected' : ''}`}
                                        onClick={() => { setManagerStatus(key); setTeamFilter("All"); setIsStatusOpen(false); }}
                                    >
                                        {statusLabels[key]}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mgr-dropdown-wrap" ref={teamDropdownRef}>
                        <div className={`mgr-dropdown-trigger ${isTeamOpen ? 'active' : ''}`} onClick={() => setIsTeamOpen(!isTeamOpen)}>
                            <span className="current-label">{teamFilter === 'All' ? "Select Team" : teamFilter}</span>
                            <span className="mgr-dropdown-arrow"></span>
                        </div>
                        {isTeamOpen && (
                            <div className="mgr-dropdown-options" style={{ width: '100%', padding: '0', boxSizing: 'border-box' }}>
                                <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                                    <input
                                        type="text"
                                        placeholder="Find team..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px', outline: 'none', background: '#fff' }}
                                    />
                                </div>
                                <div className="premium-scroll" style={{ maxHeight: '250px', overflowY: 'auto', padding: '5px' }}>
                                    {filteredTeamsForSearch.map(t => (
                                        <div
                                            key={t}
                                            className={`mgr-dropdown-item ${teamFilter === t ? 'selected' : ''}`}
                                            onClick={() => { setTeamFilter(t); setIsTeamOpen(false); }}
                                        >
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mgr-table-container">
                    <table className="mgr-table fade-in" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                            <col style={{ width: '7.7%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MANAGER NAME</th>
                                <th>MP</th>
                                <th>W</th>
                                <th>D(+)</th>
                                <th>D(-)</th>
                                <th>L</th>
                                <th>GS</th>
                                <th>GA</th>
                                <th>CS(+)</th>
                                <th>CS(-)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managerStats.length > 0 ? (
                                managerStats.map((s, idx) => (
                                    <tr key={s.name} onClick={() => setSelectedManager(s.name)} style={{ cursor: 'pointer' }}>
                                        <td><span className={`rank-badge-premium ${idx < 3 ? 'rank-gold' : ''}`}>{idx + 1}</span></td>
                                        <td className="p-name" style={{ textAlign: 'center' }}>{s.name}</td>
                                        <td>{s.matches}</td>
                                        <td className="w-cell">{s.wins}</td>
                                        <td>{s.pDraws}</td>
                                        <td>{s.nDraws}</td>
                                        <td className="l-cell">{s.losses}</td>
                                        <td>{s.gs}</td>
                                        <td>{s.ga}</td>
                                        <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{s.csFor}</td>
                                        <td>{s.csAgainst}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" style={{ padding: '100px', opacity: 0.4 }}>No managers found.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="total-row-premium">
                                <td colSpan="2" style={{ textAlign: 'center' }}>TOTAL</td>
                                <td>{grandTotals.matches}</td>
                                <td className="w-cell">{grandTotals.wins}</td>
                                <td>{grandTotals.pDraws}</td>
                                <td>{grandTotals.nDraws}</td>
                                <td className="l-cell">{grandTotals.losses}</td>
                                <td>{grandTotals.gs}</td>
                                <td>{grandTotals.ga}</td>
                                <td className="cs-cell" style={{ color: 'var(--gold)', fontWeight: 800 }}>{grandTotals.csFor}</td>
                                <td style={{ color: '#fff' }}>{grandTotals.csAgainst}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
