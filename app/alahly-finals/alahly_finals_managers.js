"use client";

import { useMemo, useState } from "react";
import { User, Award, ArrowUpDown, Search } from "lucide-react";
import SearchBar_db from "../lib/SearchBar_db";
import DropDownList_db from "../lib/DropDownList_db";
import "./alahly_finals_managers.css";

export default function AlAhlyFinalsManagers({ finalsData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortConfig, setSortConfig] = useState({ key: 'totalFinals', direction: 'desc' });

    const managerStats = useMemo(() => {
        if (!finalsData || finalsData.length === 0) return [];

        const mgrMap = new Map();

        const finalOutcomes = {};
        finalsData.forEach(m => {
            const fId = m.FINAL_ID;
            if (!fId) return;
            const status = String(m["W-D-L FINAL"] || "").toUpperCase();
            if (status.includes("W") || status === "CHAMPION") {
                finalOutcomes[fId] = "W";
            } else if (status.includes("L") || status === "RUNNER-UP") {
                finalOutcomes[fId] = "L";
            }
        });

        const processManager = (match, isAhly) => {
            const name = isAhly ? (match["AHLY MANAGER"] || "؟") : (match["OPPONENT MANAGER"]);
            if (!name || name === "؟") return;

            if (!mgrMap.has(name)) {
                mgrMap.set(name, {
                    name,
                    finalIds: new Set(),
                    wins: 0,
                    losses: 0,
                    totalMatches: 0,
                    mw: 0,
                    md: 0,
                    ml: 0,
                    gf: 0,
                    ga: 0,
                    cs: 0,
                    isAhly: false,
                    isOpponent: false
                });
            }

            const s = mgrMap.get(name);
            if (isAhly) s.isAhly = true; else s.isOpponent = true;

            const fId = match.FINAL_ID;

            s.totalMatches++;
            const mWdl = String(match["W-D-L MATCH"] || "").toUpperCase();

            let result = mWdl;
            if (!isAhly) {
                if (mWdl.startsWith("W")) result = "L";
                else if (mWdl.startsWith("L")) result = "W";
                else result = "D";
            }

            if (result.startsWith("W")) s.mw++;
            else if (result.startsWith("L")) s.ml++;
            else if (result.startsWith("D")) s.md++;

            const matchGf = parseInt(isAhly ? (match.GF || 0) : (match.GA || 0));
            const matchGa = parseInt(isAhly ? (match.GA || 0) : (match.GF || 0));

            s.gf += matchGf;
            s.ga += matchGa;
            if (matchGa === 0) s.cs++;

            if (fId && !s.finalIds.has(fId)) {
                s.finalIds.add(fId);
                const outcome = finalOutcomes[fId];
                if (outcome === "W") {
                    if (isAhly) s.wins++; else s.losses++;
                } else if (outcome === "L") {
                    if (isAhly) s.losses++; else s.wins++;
                }
            }
        };

        finalsData.forEach(match => {
            processManager(match, true);
            processManager(match, false);
        });

        let results = Array.from(mgrMap.values())
            .map(s => {
                const totalFinals = s.finalIds.size;
                const winRate = totalFinals > 0 ? (s.wins / totalFinals) * 100 : 0;
                return {
                    ...s,
                    totalFinals,
                    winRate: parseFloat(winRate.toFixed(1))
                };
            });

        if (sortConfig.key) {
            results.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === bVal) return 0;
                if (sortConfig.direction === 'asc') return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
        }

        return results;
    }, [finalsData, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filteredManagers = useMemo(() => {
        let results = managerStats;

        if (filterType === "ahly") {
            results = results.filter(m => m.isAhly);
        } else if (filterType === "opponent") {
            results = results.filter(m => m.isOpponent);
        }

        if (searchTerm) {
            const low = searchTerm.toLowerCase().trim();
            results = results.filter(m => m.name.toLowerCase().includes(low));
        }

        return results;
    }, [managerStats, searchTerm, filterType]);

    const totals = useMemo(() => {
        const stats = filteredManagers.reduce((acc, mgr) => {
            acc.totalFinals += mgr.totalFinals || 0;
            acc.wins += mgr.wins || 0;
            acc.losses += mgr.losses || 0;
            acc.totalMatches += mgr.totalMatches || 0;
            acc.mw = (acc.mw || 0) + (mgr.mw || 0);
            acc.md = (acc.md || 0) + (mgr.md || 0);
            acc.ml = (acc.ml || 0) + (mgr.ml || 0);
            acc.gf = (acc.gf || 0) + (mgr.gf || 0);
            acc.ga = (acc.ga || 0) + (mgr.ga || 0);
            acc.cs = (acc.cs || 0) + (mgr.cs || 0);
            return acc;
        }, {
            totalFinals: 0, wins: 0, losses: 0, totalMatches: 0, mw: 0, md: 0, ml: 0, gf: 0, ga: 0, cs: 0
        });

        stats.winRate = stats.totalFinals > 0 ? parseFloat(((stats.wins / stats.totalFinals) * 100).toFixed(1)) : 0;
        return stats;
    }, [filteredManagers]);

    const SortIcon = ({ colKey }) => (
        <ArrowUpDown
            size={10}
            style={{
                marginLeft: '4px',
                opacity: sortConfig.key === colKey ? 1 : 0.3,
                color: sortConfig.key === colKey ? '#c9a84c' : 'inherit'
            }}
        />
    );

    return (
        <div className="finals-managers-container fade-in">
            <div className="managers-header">
                <h1 className="managers-title">AL AHLY FINALS <span className="gold-text">MANAGERS</span></h1>
                <div className="managers-filter-zone">
                    <div className="managers-search-wrapper">
                        <SearchBar_db
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search for a manager..."
                        />
                    </div>
                    <div className="dropdown-filter-wrapper">
                        <DropDownList_db
                            options={[
                                { value: 'all', label: 'ALL' },
                                { value: 'ahly', label: 'AHLY MANAGERS' },
                                { value: 'opponent', label: 'OPPONENT MANAGERS' }
                            ]}
                            value={filterType}
                            onChange={setFilterType}
                            placeholder="Filter..."
                        />
                    </div>
                </div>
            </div>

            <div className="managers-grid-stats">
                <div className="stats-table-wrapper shadow-premium">
                    <div className="stats-table-header">
                        <div className="col-rank">#</div>
                        <div className="col-name sortable" onClick={() => handleSort('name')}>MANAGER NAME <SortIcon colKey="name" /></div>
                        <div className="col-num sortable" onClick={() => handleSort('totalFinals')}>FINALS <SortIcon colKey="totalFinals" /></div>
                        <div className="col-num win-col sortable" onClick={() => handleSort('wins')}>WINS <SortIcon colKey="wins" /></div>
                        <div className="col-num loss-col sortable" onClick={() => handleSort('losses')}>LOSS <SortIcon colKey="losses" /></div>
                        <div className="col-num perc-col sortable" onClick={() => handleSort('winRate')}>% <SortIcon colKey="winRate" /></div>
                        <div className="col-num sortable" onClick={() => handleSort('totalMatches')}>MTCH <SortIcon colKey="totalMatches" /></div>
                        <div className="col-num mw-col sortable" onClick={() => handleSort('mw')}>MW <SortIcon colKey="mw" /></div>
                        <div className="col-num md-col sortable" onClick={() => handleSort('md')}>MD <SortIcon colKey="md" /></div>
                        <div className="col-num ml-col sortable" onClick={() => handleSort('ml')}>ML <SortIcon colKey="ml" /></div>
                        <div className="col-num gf-col sortable" onClick={() => handleSort('gf')}>GF <SortIcon colKey="gf" /></div>
                        <div className="col-num ga-col sortable" onClick={() => handleSort('ga')}>GA <SortIcon colKey="ga" /></div>
                        <div className="col-num cs-col sortable" onClick={() => handleSort('cs')}>CS <SortIcon colKey="cs" /></div>
                    </div>

                    <div className="stats-table-body">
                        {filteredManagers.length === 0 ? (
                            <div className="no-managers-msg">No manager found with this name.</div>
                        ) : (
                            <>
                                {filteredManagers.map((mgr, idx) => (
                                    <div key={mgr.name} className="manager-stats-row">
                                        <div className="col-rank">
                                            <span className="rank-badge">{idx + 1}</span>
                                        </div>
                                        <div className="col-name">{mgr.name}</div>
                                        <div className="col-num font-bold">{mgr.totalFinals}</div>
                                        <div className="col-num win-text">{mgr.wins}</div>
                                        <div className="col-num loss-text">{mgr.losses}</div>
                                        <div className="col-num perc-text">{mgr.winRate}%</div>
                                        <div className="col-num mtch-val">{mgr.totalMatches}</div>
                                        <div className="col-num mw-text">{mgr.mw}</div>
                                        <div className="col-num md-text">{mgr.md}</div>
                                        <div className="col-num ml-text">{mgr.ml}</div>
                                        <div className="col-num gf-text">{mgr.gf}</div>
                                        <div className="col-num ga-text">{mgr.ga}</div>
                                        <div className="col-num cs-text">{mgr.cs}</div>
                                    </div>
                                ))}

                                <div className="manager-stats-row total-row-premium">
                                    <div className="col-rank">∑</div>
                                    <div className="col-name">TOTALS</div>
                                    <div className="col-num">{totals.totalFinals}</div>
                                    <div className="col-num">{totals.wins}</div>
                                    <div className="col-num">{totals.losses}</div>
                                    <div className="col-num">{totals.winRate}%</div>
                                    <div className="col-num">{totals.totalMatches}</div>
                                    <div className="col-num">{totals.mw}</div>
                                    <div className="col-num">{totals.md}</div>
                                    <div className="col-num">{totals.ml}</div>
                                    <div className="col-num">{totals.gf}</div>
                                    <div className="col-num">{totals.ga}</div>
                                    <div className="col-num">{totals.cs}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
