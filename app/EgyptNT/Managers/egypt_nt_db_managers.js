"use client";

import { useState, useMemo, useEffect } from "react";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import "./egypt_nt_db_managers.css";
import EgyptNTManagerDetails from "../ManagerDetails/egypt_nt_db_manager_details.js";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";

export default function EgyptNTManagers({ matches, playerDetails, lineupDetails }) {
    const [managerStatus, setManagerStatus] = useState("egypt"); // "egypt" or "opponent"
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("All");

    // Selection state for manager details
    const [selectedManager, setSelectedManager] = useState(null);

    const statusLabels = { egypt: "Egypt NT Managers", opponent: "Opponent Managers" };

    const managerColumn = managerStatus === "egypt" ? "AHLY MANAGER" : "OPPONENT MANAGER";
    const teamColumn = managerStatus === "egypt" ? "AHLY TEAM" : "OPPONENT TEAM";

    const teams = useMemo(() => {
        const set = new Set((matches || []).map(m => m[teamColumn]).filter(Boolean));
        return ["All", ...Array.from(set).sort()];
    }, [matches, teamColumn]);

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

            const isAsEgypt = managerStatus === "egypt";
            s.gs += isAsEgypt ? gf : ga;
            s.ga += isAsEgypt ? ga : gf;

            if (isAsEgypt) {
                if (wdl.includes('W')) {
                    s.wins += 1;
                } else if (wdl.includes('L')) {
                    s.losses += 1;
                } else if (wdl.includes('D')) {
                    if (gf > 0 || ga > 0) s.pDraws += 1; else s.nDraws += 1;
                }
                if (ga === 0) s.csFor += 1;
                if (gf === 0) s.csAgainst += 1;
            } else {
                if (wdl.includes('L')) {
                    s.wins += 1;
                } else if (wdl.includes('W')) {
                    s.losses += 1;
                } else if (wdl.includes('D')) {
                    if (gf > 0 || ga > 0) s.pDraws += 1; else s.nDraws += 1;
                }
                if (gf === 0) s.csFor += 1;
                if (ga === 0) s.csAgainst += 1;
            }
        });
        return Object.values(stats)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name));
    }, [matches, managerColumn, teamColumn, teamFilter, searchTerm, managerStatus]);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedManager) handleExport();
        };
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
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
        EgyptNTExcelExport.exportToExcel(exportData, `EgyptNT_Managers_${managerStatus}`);
    };

    const grandTotals = useMemo(() => {
        const t = { matches: 0, wins: 0, pDraws: 0, nDraws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 };
        managerStats.forEach(s => {
            t.matches += s.matches; t.wins += s.wins; t.pDraws += s.pDraws; t.nDraws += s.nDraws; t.losses += s.losses;
            t.gs += s.gs; t.ga += s.ga; t.csFor += s.csFor; t.csAgainst += s.csAgainst;
        });
        return t;
    }, [managerStats]);

    if (selectedManager) {
        return (
            <EgyptNTManagerDetails
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
                    <div className="section-title">EGYPT NT <span className="accent">MANAGERS</span></div>
                </div>
                <div className="gold-line"></div>

                <div className="mgr-controls">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search manager name..."
                        className="search-wrap-premium"
                    />

                    <DropDownList_db
                        options={Object.keys(statusLabels).map(key => ({ value: key, label: statusLabels[key] }))}
                        value={managerStatus}
                        onChange={(val) => { setManagerStatus(val); setTeamFilter("All"); }}
                        placeholder="Select Role"
                        className="custom-dropdown-wrap"
                    />

                    <DropDownList_db
                        options={teams.map(t => ({ value: t, label: t }))}
                        value={teamFilter}
                        onChange={setTeamFilter}
                        placeholder="Select Team"
                        searchable={true}
                        className="custom-dropdown-wrap"
                    />
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
                                <NoData_db 
                                    isTable={true} 
                                    colSpan={11} 
                                    message="No managers found matching your criteria." 
                                />
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
