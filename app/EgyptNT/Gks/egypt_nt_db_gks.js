"use client";

import { useMemo, useState, useEffect } from "react";
import "./egypt_nt_db_gks.css";
import EgyptNTGKDetails from "../GkDetails/egypt_nt_db_gk_details";
import { EgyptNTService } from "../Service/egypt_nt_db_service";
import { EgyptNTExcelExport } from "../ExportExcel/egypt_nt_export_excel";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { collectGkPenaltySaves, collectGkPenaltyMisses, getGkPenaltySavePct } from "../../Alahly/Penalties/alahly_db_penalties_utils";

export default function EgyptNTGKs({ gkDetails, howPenMissed, filteredMatches, playerDetails }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [opponentFilter, setOpponentFilter] = useState("all");

    const matchResultsMap = useMemo(() => {
        const map = {};
        (filteredMatches || []).forEach(m => {
            const mId = String(m.MATCH_ID || "").trim();
            map[mId] = {
                gf: parseInt(m.GF || 0) || 0,
                ga: parseInt(m.GA || 0) || 0,
                opp: String(m["OPPONENT TEAM"] || "").trim()
            };
        });
        return map;
    }, [filteredMatches]);

    const currentMatchIds = useMemo(() => new Set(Object.keys(matchResultsMap)), [matchResultsMap]);

    const isEgyptTeam = (t) => {
        if (!t) return false;
        const s = String(t).trim();
        return s === "مصر" || s === "Egypt" || s === "منتخب مصر" || s === "المنتخب المصري";
    };

    const uniqueOpponents = useMemo(() => {
        const opps = new Set();
        (gkDetails || []).forEach(g => {
            const mId = String(g.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;
            const teamVal = String(g.TEAM || "").trim();
            if (!isEgyptTeam(teamVal) && teamVal) opps.add(teamVal);
        });
        return Array.from(opps).sort((a, b) => a.localeCompare(b, 'ar'));
    }, [gkDetails, currentMatchIds]);

    const gkStats = useMemo(() => {
        const stats = {};

        // 1. Process Basic Stats & Clean Sheets
        (gkDetails || []).forEach(g => {
            const mId = String(g.MATCH_ID || "").trim();
            if (!currentMatchIds.has(mId)) return;

            const gkName = String(g["PLAYER NAME"] || "").trim();
            if (!gkName || gkName.toLowerCase() === "unknown") return;

            const teamVal = String(g.TEAM || "").trim();
            const isEgypt = isEgyptTeam(teamVal);

            if (teamFilter === "egypt" && !isEgypt) return;
            if (teamFilter === "opponents" && isEgypt) return;

            if (opponentFilter !== "all" && teamVal !== opponentFilter) return;

            if (!stats[gkName]) {
                stats[gkName] = { name: gkName, matches: 0, goalsConceded: 0, cleanSheets: 0, penaltiesSaved: 0, penaltiesMissed: 0, penaltiesReceived: 0 };
            }

            stats[gkName].matches += 1;
            stats[gkName].goalsConceded += parseInt(g["GOALS CONCEDED"] || 0) || 0;

            const isStarter = String(g.STATU || "").trim() === "اساسي";
            const stayedAllMatch = !g["OUT MINUTE"] || String(g["OUT MINUTE"]).trim() === "";

            if (isStarter && stayedAllMatch) {
                const matchResult = matchResultsMap[mId];
                if (isEgypt && matchResult.ga === 0) stats[gkName].cleanSheets += 1;
                else if (!isEgypt && matchResult.gf === 0) stats[gkName].cleanSheets += 1;
            }

            const penalties = (playerDetails || []).filter(p => {
                const pmId = String(p.MATCH_ID || "").trim();
                if (pmId !== mId) return false;

                const isPenGoal = String(p.TYPE_SUB || "").toUpperCase() === "PENGOAL";
                const isOpponentScoring = String(p.TEAM || "").trim() !== teamVal;

                if (!isPenGoal || !isOpponentScoring) return false;

                if (!stayedAllMatch) {
                    const penMin = parseInt(p.MINUTE) || 0;
                    const outMin = parseInt(g["OUT MINUTE"]) || 90;
                    return penMin <= outMin;
                }
                return true;
            });

            stats[gkName].penaltiesReceived += penalties.length;
        });

        const savesByGk = collectGkPenaltySaves({
            playerDetails,
            howPenMissed,
            gkDetails,
            matchIds: currentMatchIds,
        });

        Object.entries(savesByGk).forEach(([gkName, saves]) => {
            if (!stats[gkName]) return;
            stats[gkName].penaltiesSaved += saves.length;
        });

        const missesByGk = collectGkPenaltyMisses({
            playerDetails,
            howPenMissed,
            gkDetails,
            matchIds: currentMatchIds,
        });

        Object.entries(missesByGk).forEach(([gkName, misses]) => {
            if (!stats[gkName]) return;
            stats[gkName].penaltiesMissed += misses.length;
        });

        Object.values(stats).forEach((gk) => {
            gk.penaltiesFaced = gk.penaltiesReceived + gk.penaltiesSaved + gk.penaltiesMissed;
        });

        let list = Object.values(stats);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(g => g.name.toLowerCase().includes(lower));
        }

        return list.sort((a, b) => {
            if (a.name === "?") return 1;
            if (b.name === "?") return -1;
            return b.matches - a.matches;
        });
    }, [gkDetails, howPenMissed, matchResultsMap, currentMatchIds, teamFilter, opponentFilter, searchTerm, playerDetails]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, teamFilter, opponentFilter]);

    const paginatedStats = useMemo(() => {
        return gkStats.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [gkStats, currentPage]);

    const totalPages = Math.ceil(gkStats.length / pageSize);

    const totals = useMemo(() => {
        return gkStats.reduce((acc, curr) => ({
            matches: acc.matches + curr.matches,
            goalsConceded: acc.goalsConceded + curr.goalsConceded,
            cleanSheets: acc.cleanSheets + curr.cleanSheets,
            penaltiesReceived: acc.penaltiesReceived + curr.penaltiesReceived,
            penaltiesSaved: acc.penaltiesSaved + curr.penaltiesSaved,
            penaltiesMissed: acc.penaltiesMissed + curr.penaltiesMissed,
            penaltiesFaced: acc.penaltiesFaced + curr.penaltiesFaced,
        }), { matches: 0, goalsConceded: 0, cleanSheets: 0, penaltiesReceived: 0, penaltiesSaved: 0, penaltiesMissed: 0, penaltiesFaced: 0 });
    }, [gkStats]);

    const totalSavePct = getGkPenaltySavePct(totals.penaltiesSaved, totals.penaltiesReceived);

    const [selectedGK, setSelectedGK] = useState(null);

    useEffect(() => {
        const handleGlobalExport = () => {
            if (!selectedGK) handleExport();
        };
        window.addEventListener('egyptnt-export-excel', handleGlobalExport);
        return () => window.removeEventListener('egyptnt-export-excel', handleGlobalExport);
    }, [gkStats, selectedGK]);

    const handleExport = () => {
        const exportData = gkStats.map((g, i) => ({
            "#": i + 1,
            "GOALKEEPER NAME": g.name,
            "MATCHES": g.matches,
            "GOALS CONCEDED": g.goalsConceded,
            "CLEAN SHEETS": g.cleanSheets,
            "PEN(F)": g.penaltiesFaced,
            "PEN(G)": g.penaltiesReceived,
            "PEN(S)": g.penaltiesSaved,
            "SV%": `${getGkPenaltySavePct(g.penaltiesSaved, g.penaltiesReceived)}%`,
            "PEN(M)": g.penaltiesMissed,
        }));
        EgyptNTExcelExport.exportToExcel(exportData, "EgyptNT_Goalkeepers_Main");
    };

    return (
        <div className="tab-content" id="tab-gks">
            {selectedGK ? (
                <EgyptNTGKDetails
                    gkName={selectedGK}
                    gkDetails={gkDetails}
                    howPenMissed={howPenMissed}
                    masterMatches={filteredMatches}
                    playerDetails={playerDetails}
                    onBack={() => setSelectedGK(null)}
                />
            ) : (
                <div className="players-premium-wrap" style={{ maxWidth: '1400px' }}>
                    <div className="header-tabs-container">
                        <div className="section-title">EGYPT NT <span className="accent">GOALKEEPERS</span></div>
                    </div>
                    <div className="gold-line"></div>
                    <div className="player-controls">
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search keepers..."
                            className="search-wrap-premium"
                        />

                        <DropDownList_db
                            options={[
                                { value: 'all', label: 'All Keepers' },
                                { value: 'egypt', label: 'With Egypt NT' },
                                { value: 'opponents', label: 'Against Egypt NT' }
                            ]}
                            value={teamFilter}
                            onChange={setTeamFilter}
                            placeholder="Select Category"
                            className="custom-dropdown-wrap"
                        />

                        <DropDownList_db
                            options={[
                                { value: 'all', label: 'All Opponents' },
                                ...uniqueOpponents.map(opp => ({ value: opp, label: opp }))
                            ]}
                            value={opponentFilter}
                            onChange={setOpponentFilter}
                            placeholder="Select Opponent"
                            searchable={true}
                            className="custom-dropdown-wrap"
                        />
                    </div>
                    <div className="player-table-container">
                        {gkStats.length === 0 ? (
                            <NoData_db message="No keeper data recorded for these matches." />
                        ) : (
                            <table className="modern-player-table fade-in gks-main-table">
                                <colgroup>
                                    <col style={{ width: "60px" }} />
                                    <col style={{ width: "220px" }} />
                                    <col style={{ width: "70px" }} />
                                    <col style={{ width: "70px" }} />
                                    <col style={{ width: "70px" }} />
                                    <col style={{ width: "80px" }} />
                                    <col style={{ width: "80px" }} />
                                    <col style={{ width: "80px" }} />
                                    <col style={{ width: "75px" }} />
                                    <col style={{ width: "80px" }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th className="name-th">GK</th>
                                        <th>M</th>
                                        <th>GC</th>
                                        <th>CS</th>
                                        <th>PEN(F)</th>
                                        <th>PEN(G)</th>
                                        <th>PEN(S)</th>
                                        <th>SV%</th>
                                        <th>PEN(M)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedStats.map((g, i) => {
                                        const actualIndex = (currentPage - 1) * pageSize + i;
                                        return (
                                            <tr key={g.name} style={{ opacity: g.name === '?' ? 0.4 : 1 }}>
                                                <td><span className={`rank-badge-premium ${actualIndex < 3 && g.name !== '?' ? 'rank-gold' : ''}`}>{actualIndex + 1}</span></td>
                                                <td className="p-name" onClick={() => setSelectedGK(g.name)} style={{ cursor: 'pointer' }}>{g.name}</td>
                                                <td style={{ color: 'var(--gold)', fontWeight: 800 }}>{g.matches}</td>
                                                <td style={{ color: '#e74c3c' }}>{g.goalsConceded}</td>
                                                <td style={{ color: '#2ecc71', fontWeight: 800 }}>{g.cleanSheets}</td>
                                                <td style={{ fontWeight: 800 }}>{g.penaltiesFaced}</td>
                                                <td style={{ color: '#9b59b6', fontWeight: 800 }}>{g.penaltiesReceived}</td>
                                                <td style={{ color: '#3498db', fontWeight: 800 }}>{g.penaltiesSaved}</td>
                                                <td style={{ color: 'var(--gold)', fontWeight: 800 }}>
                                                    {getGkPenaltySavePct(g.penaltiesSaved, g.penaltiesReceived)}%
                                                </td>
                                                <td style={{ color: '#e74c3c', fontWeight: 800 }}>{g.penaltiesMissed}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="total-row-premium">
                                    <tr>
                                        <td colSpan="2" style={{ textAlign: 'center' }}>TOTAL</td>
                                        <td style={{ color: 'var(--gold)' }}>{totals.matches}</td>
                                        <td style={{ color: '#e74c3c' }}>{totals.goalsConceded}</td>
                                        <td style={{ color: '#2ecc71' }}>{totals.cleanSheets}</td>
                                        <td>{totals.penaltiesFaced}</td>
                                        <td style={{ color: '#9b59b6' }}>{totals.penaltiesReceived}</td>
                                        <td style={{ color: '#3498db' }}>{totals.penaltiesSaved}</td>
                                        <td style={{ color: 'var(--gold)' }}>{totalSavePct}%</td>
                                        <td style={{ color: '#e74c3c' }}>{totals.penaltiesMissed}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-gks">
                            <button 
                                className="page-btn prev-btn" 
                                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                disabled={currentPage === 1}
                            >
                                ←
                            </button>
                            <div className="page-info">
                                PAGE {currentPage} OF {totalPages}
                            </div>
                            <button 
                                className="page-btn next-btn" 
                                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                disabled={currentPage === totalPages}
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
