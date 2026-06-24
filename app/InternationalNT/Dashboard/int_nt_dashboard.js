"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import "./int_nt_dashboard.css";

export default function IntNtDashboard({ matches, activeFilters, countries }) {
    const [search, setSearch] = useState("");
    const [limitType, setLimitType] = useState("last");
    const [limitCount, setLimitCount] = useState("");

    const statsArray = useMemo(() => {
        if (!matches?.length) return [];

        const teamMatchesMap = {};

        matches.forEach((m) => {
            const tA = String(m.TEAMA || "").trim();
            const tB = String(m.TEAMB || "").trim();
            if (!tA || !tB) return;

            if (!teamMatchesMap[tA]) teamMatchesMap[tA] = [];
            teamMatchesMap[tA].push({ team: tA, opponent: tB, match: m, isHome: true });

            if (!teamMatchesMap[tB]) teamMatchesMap[tB] = [];
            teamMatchesMap[tB].push({ team: tB, opponent: tA, match: m, isHome: false });
        });

        const statsMap = {};
        const limit = parseInt(limitCount, 10);
        const hasLimit = !isNaN(limit) && limit > 0;

        Object.keys(teamMatchesMap).forEach(team => {
            let tMatches = teamMatchesMap[team];
            if (hasLimit) {
                // Since 'matches' is sorted newest-first, the most recent matches ('last' matches chronologically) 
                // are at the beginning of the array. The oldest matches ('first' matches chronologically) are at the end.
                if (limitType === 'last') {
                    tMatches = tMatches.slice(0, limit);
                } else if (limitType === 'first') {
                    tMatches = tMatches.slice(-limit);
                }
            }

            statsMap[team] = { team: team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, csf: 0, csa: 0 };

            tMatches.forEach(tm => {
                const m = tm.match;
                const out = String(m.OUTCOME || "");
                const sA = parseInt(m.TEAMASCORE, 10);
                const sB = parseInt(m.TEAMBSCORE, 10);
                const validScores = !Number.isNaN(sA) && !Number.isNaN(sB);

                statsMap[team].p++;

                if (tm.isHome) {
                    if (out === "W") statsMap[team].w++;
                    else if (out === "L") statsMap[team].l++;
                    else if (out.startsWith("D")) statsMap[team].d++;

                    if (validScores) {
                        statsMap[team].gf += sA;
                        statsMap[team].ga += sB;
                        if (sB === 0) statsMap[team].csf++;
                        if (sA === 0) statsMap[team].csa++;
                    }
                } else {
                    if (out === "W") statsMap[team].l++;
                    else if (out === "L") statsMap[team].w++;
                    else if (out.startsWith("D")) statsMap[team].d++;

                    if (validScores) {
                        statsMap[team].gf += sB;
                        statsMap[team].ga += sA;
                        if (sA === 0) statsMap[team].csf++;
                        if (sB === 0) statsMap[team].csa++;
                    }
                }
            });
        });

        let results = Object.values(statsMap).filter(row => row.p > 0);

        if (activeFilters) {
            const getTeamRegions = (teamName) => {
                const lowerName = String(teamName).toLowerCase();
                const c = (countries || []).find(country => 
                    (country.COUNTRY_NAME && country.COUNTRY_NAME.toLowerCase() === lowerName) || 
                    (country.COUNTRY_NAME_EN && country.COUNTRY_NAME_EN.toLowerCase() === lowerName)
                );
                if (!c) return [];
                const regions = [];
                if (c.CONTINENT) regions.push(c.CONTINENT);
                if (c.IS_ARAB) regions.push("دول عربية");
                return regions;
            };

            if (activeFilters.continent && activeFilters.continent !== "All") {
                results = results.filter(row => {
                    const r = getTeamRegions(row.team);
                    return r.includes(activeFilters.continent);
                });
            }

            if (activeFilters.country && activeFilters.country !== "All") {
                const targetLower = activeFilters.country.toLowerCase();
                results = results.filter(row => {
                    const tLower = row.team.toLowerCase();
                    const c = (countries || []).find(country => country.COUNTRY_NAME === activeFilters.country);
                    if (!c) return tLower === targetLower;
                    return (c.COUNTRY_NAME && c.COUNTRY_NAME.toLowerCase() === tLower) || 
                           (c.COUNTRY_NAME_EN && c.COUNTRY_NAME_EN.toLowerCase() === tLower);
                });
            }

            if (activeFilters.team && activeFilters.team !== "All") {
                results = results.filter(row => String(row.team) === activeFilters.team);
            }
        }

        return results.sort((a, b) => {
            const ptsA = a.w * 3 + a.d;
            const ptsB = b.w * 3 + b.d;
            if (ptsA !== ptsB) return ptsB - ptsA;

            const gdA = a.gf - a.ga;
            const gdB = b.gf - b.ga;
            if (gdA !== gdB) return gdB - gdA;

            if (a.gf !== b.gf) return b.gf - a.gf;

            return a.team.localeCompare(b.team, 'ar');
        });
    }, [matches, activeFilters, countries, limitCount, limitType]);

    const filteredStats = useMemo(() => {
        if (!search.trim()) return statsArray;
        const q = search.toLowerCase();
        return statsArray.filter(row => row.team.toLowerCase().includes(q));
    }, [statsArray, search]);

    const totals = useMemo(() => {
        return filteredStats.reduce((acc, row) => {
            acc.p += row.p;
            acc.w += row.w;
            acc.d += row.d;
            acc.l += row.l;
            acc.gf += row.gf;
            acc.ga += row.ga;
            acc.csf += row.csf;
            acc.csa += row.csa;
            return acc;
        }, { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, csf: 0, csa: 0 });
    }, [filteredStats]);

    if (!statsArray.length) return <NoData_db message="NO INTERNATIONAL NT MATCHES FOUND" />;

    return (
        <div className="int-nt-dashboard fade-in">
            <div className="int-nt-page-header">
                <div>
                    <h1>DASHBOARD</h1>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "nowrap" }}>
                    <select 
                        value={limitType} 
                        onChange={(e) => setLimitType(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#f9f9f9", color: "#333", fontSize: "14px", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                        <option value="last">Last</option>
                        <option value="first">First</option>
                    </select>
                    <input 
                        type="number" 
                        value={limitCount} 
                        onChange={(e) => setLimitCount(e.target.value)} 
                        placeholder="Match count (e.g. 9)"
                        style={{ width: "160px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#f9f9f9", color: "#333", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                        min="1"
                    />
                    <SearchBar_db value={search} onChange={setSearch} placeholder="Search team..." />
                </div>
            </div>
            
            <div className="int-nt-dashboard-table-wrap">
                <table className="int-nt-dashboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th className="team-col">TEAM</th>
                            <th title="Played">P</th>
                            <th title="Won">W</th>
                            <th title="Drawn">D</th>
                            <th title="Lost">L</th>
                            <th title="Goals For">GF</th>
                            <th title="Goals Against">GA</th>
                            <th title="Goal Difference">GD</th>
                            <th title="Clean Sheets For">CSF</th>
                            <th title="Clean Sheets Against">CSA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStats.length === 0 ? (
                            <tr>
                                <td colSpan={11} style={{ padding: "30px", color: "#888" }}>
                                    No teams found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredStats.map((row, idx) => (
                                <tr key={row.team}>
                                    <td>{idx + 1}</td>
                                    <td className="team-col">{row.team}</td>
                                    <td>{row.p}</td>
                                    <td>{row.w}</td>
                                    <td>{row.d}</td>
                                    <td>{row.l}</td>
                                    <td>{row.gf}</td>
                                    <td>{row.ga}</td>
                                    <td dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</td>
                                    <td>{row.csf}</td>
                                    <td>{row.csa}</td>
                                </tr>
                            ))
                        )}
                        {filteredStats.length > 0 && (
                            <tr className="total-row">
                                <td colSpan={2}>TOTAL</td>
                                <td>{totals.p}</td>
                                <td>{totals.w}</td>
                                <td>{totals.d}</td>
                                <td>{totals.l}</td>
                                <td>{totals.gf}</td>
                                <td>{totals.ga}</td>
                                <td dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>{totals.gf - totals.ga > 0 ? `+${totals.gf - totals.ga}` : totals.gf - totals.ga}</td>
                                <td>{totals.csf}</td>
                                <td>{totals.csa}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
