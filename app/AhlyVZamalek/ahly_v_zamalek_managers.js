"use client";

import { useMemo, useState, useEffect } from "react";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import "./ahly_v_zamalek_managers.css";
import NoData_db from "../lib/NoData_db";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";




export default function AhlyVZamalekManagers({ derbyData, lineupDetails, playerDetails, onSelectManager }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [teamFilter, setTeamFilter] = useState("All");
    const [sortConfig, setSortConfig] = useState({ key: "matches", direction: "desc" });
    



    const managerStats = useMemo(() => {
        if (!derbyData || derbyData.length === 0) return [];

        const statsMap = new Map();

        const processManager = (name, team, isWin, isDraw, isLoss, matchGF, matchGA, matchCS) => {

            if (!name) return;
            const mName = name.trim();
            if (!statsMap.has(mName)) {
                statsMap.set(mName, {
                    name: mName,
                    team: team,
                    matches: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csf: 0,
                    csa: 0


                });
            }

            const stat = statsMap.get(mName);
            stat.matches++;
            if (isWin) stat.wins++;
            if (isDraw) stat.draws++;
            if (isLoss) stat.losses++;

            // Goals and Clean Sheets
            stat.gf += parseInt(matchGF) || 0;
            stat.ga += parseInt(matchGA) || 0;

            const cleanSheet = String(matchCS || "").toUpperCase();
            if (team === 'الأهلي') {
                if (cleanSheet.includes('AHLY') || cleanSheet === 'F' || cleanSheet === 'BOTH') stat.csf++;
                if (cleanSheet.includes('ZAMALEK') || cleanSheet === 'A' || cleanSheet === 'BOTH') stat.csa++;
            } else {
                if (cleanSheet.includes('ZAMALEK') || cleanSheet === 'A' || cleanSheet === 'BOTH') stat.csf++;
                if (cleanSheet.includes('AHLY') || cleanSheet === 'F' || cleanSheet === 'BOTH') stat.csa++;
            }
        };



        derbyData.forEach(match => {
            const wdl = String(match["W-D-L"] || "").toUpperCase();
            const ahlyWin = wdl === "W";
            const draw = wdl === "D";
            const zamalekWin = wdl === "L";

            processManager(match["AHLY MANAGER"], "الأهلي", ahlyWin, draw, zamalekWin, match.GF, match.GA, match["CLEAN SHEET"]);
            processManager(match["ZAMALEK MANAGER"], "الزمالك", zamalekWin, draw, ahlyWin, match.GA, match.GF, match["CLEAN SHEET"]);
        });




        // Convert to array and calculate win rate
        let statsArray = Array.from(statsMap.values()).map(m => ({
            ...m,
            winRate: m.matches > 0 ? ((m.wins / m.matches) * 100).toFixed(1) : 0
        }));



        // Sort by matches and then wins, but keep "?" and "اعتباري" at the very end
        statsArray.sort((a, b) => {
            const endNames = ["?", "اعتباري"];
            const aIsEnd = endNames.includes(a.name);
            const bIsEnd = endNames.includes(b.name);

            if (aIsEnd && !bIsEnd) return 1;
            if (bIsEnd && !aIsEnd) return -1;
            return (b.matches - a.matches) || (b.wins - a.wins);
        });



        return statsArray;
    }, [derbyData]);

    const displayedManagers = useMemo(() => {
        let managers = managerStats.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTeam = teamFilter === "All" || m.team === teamFilter;
            return matchesSearch && matchesTeam;
        });

        if (sortConfig.key) {
            managers.sort((a, b) => {
                const endNames = ["?", "اعتباري"];
                const aIsEnd = endNames.includes(a.name);
                const bIsEnd = endNames.includes(b.name);

                if (aIsEnd && !bIsEnd) return 1;
                if (bIsEnd && !aIsEnd) return -1;

                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'winRate') {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return managers;
    }, [managerStats, searchQuery, teamFilter, sortConfig]);

    useEffect(() => {
        const handleExport = () => {
            if (displayedManagers.length > 0) {
                const exportData = displayedManagers.map((m, idx) => ({
                    "#": idx + 1,
                    "MANAGER NAME": m.name,
                    "TEAM": m.team,
                    "MATCHES": m.matches,
                    "WINS": m.wins,
                    "WIN %": `${m.winRate}%`,
                    "DRAWS": m.draws,
                    "LOSSES": m.losses,
                    "GF": m.gf,
                    "GA": m.ga,
                    "CSA": m.csa,
                    "CSF": m.csf
                }));
                AhlyVZamalekService.exportToExcel(exportData, `Ahly_vs_Zamalek_Managers_${teamFilter}`);
            }
        };

        window.addEventListener('avz-export-excel', handleExport);
        return () => window.removeEventListener('avz-export-excel', handleExport);
    }, [displayedManagers, teamFilter]);

    const handleSort = (key) => {
        let direction = "desc";
        if (sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    const teamOptions = [
        { value: "All", label: "ALL MANAGERS" },
        { value: "الأهلي", label: "AHLY MANAGERS" },
        { value: "الزمالك", label: "ZAMALEK MANAGERS" }
    ];


    return (
        <div className="avz-managers-container fade-in">
            <div className="avz-managers-header">
                <h1 className="avz-managers-title">DERBY <span className="avz-gold-text">MANAGERS</span></h1>

                <div className="avz-managers-controls">
                    <div className="avz-search-box">
                        <SearchBar_db
                            placeholder="Search manager name..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>

                    <div className="avz-team-filter-box">
                        <DropDownList_db
                            options={teamOptions}
                            value={teamFilter}
                            onChange={setTeamFilter}
                            placeholder="Select Team..."
                        />
                    </div>
                </div>


            </div>

            <div className="avz-table-wrapper">
                <table className="avz-data-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort(null)} style={{ cursor: 'default' }}>#</th>
                            <th onClick={() => handleSort('name')} className="sortable-header">MANAGER {getSortIcon('name')}</th>

                            <th onClick={() => handleSort('matches')} className="sortable-header">MATCHES {getSortIcon('matches')}</th>
                            <th onClick={() => handleSort('wins')} className="sortable-header">WINS {getSortIcon('wins')}</th>
                            <th onClick={() => handleSort('winRate')} className="sortable-header">WIN % {getSortIcon('winRate')}</th>
                            <th onClick={() => handleSort('draws')} className="sortable-header">DRAWS {getSortIcon('draws')}</th>
                            <th onClick={() => handleSort('losses')} className="sortable-header">LOSSES {getSortIcon('losses')}</th>
                            <th onClick={() => handleSort('gf')} className="sortable-header">GF {getSortIcon('gf')}</th>
                            <th onClick={() => handleSort('ga')} className="sortable-header">GA {getSortIcon('ga')}</th>
                            <th onClick={() => handleSort('csa')} className="sortable-header">CSA {getSortIcon('csa')}</th>
                            <th onClick={() => handleSort('csf')} className="sortable-header">CSF {getSortIcon('csf')}</th>
                        </tr>
                    </thead>


                    <tbody>
                        {displayedManagers.length > 0 ? (
                            displayedManagers.map((m, idx) => (
                                <tr key={idx} onClick={() => onSelectManager && onSelectManager(m.name, m.team)} style={{ cursor: 'pointer' }}>
                                    <td>{idx + 1}</td>
                                    <td className="avz-text-bold">{m.name}</td>

                                    <td className="avz-highlight-stat">{m.matches}</td>
                                    <td className="avz-success-text">{m.wins > 0 ? m.wins : "-"}</td>
                                    <td><span className="avz-rate-badge">{m.winRate}%</span></td>
                                    <td>{m.draws > 0 ? m.draws : "-"}</td>
                                    <td className="avz-danger-text">{m.losses > 0 ? m.losses : "-"}</td>
                                    <td>{m.gf > 0 ? m.gf : "-"}</td>
                                    <td>{m.ga > 0 ? m.ga : "-"}</td>
                                    <td>{m.csa > 0 ? m.csa : "-"}</td>
                                    <td>{m.csf > 0 ? m.csf : "-"}</td>
                                </tr>


                            ))
                        ) : (
                            <NoData_db message="NO MANAGERS FOUND" isTable={true} colSpan={11} />




                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}
