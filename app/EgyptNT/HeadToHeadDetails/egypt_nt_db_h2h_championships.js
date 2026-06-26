"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";

export default function EgyptNTH2HChampionships({ matches }) {
    const [sortConfig, setSortConfig] = useState({ key: "matchesPlayed", direction: "desc" });
    const [searchQuery, setSearchQuery] = useState("");
    const [ageFilter, setAgeFilter] = useState("all");

    const ageOptions = useMemo(() => {
        const ages = new Set();
        (matches || []).forEach((m) => {
            const age = String(m.AGE || "").trim();
            if (age) ages.add(age);
        });
        return [...ages].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    }, [matches]);

    const ageDropdownOptions = useMemo(() => [
        { value: "all", label: "All Ages" },
        ...ageOptions.map((age) => ({ value: age, label: age }))
    ], [ageOptions]);

    const ageFilteredMatches = useMemo(() => {
        if (ageFilter === "all") return matches || [];
        return (matches || []).filter((m) => String(m.AGE || "").trim() === ageFilter);
    }, [matches, ageFilter]);

    const statsByChampion = useMemo(() => {
        const championMap = {};

        ageFilteredMatches.forEach((m) => {
            const champion = String(m.CHAMPION || "Unknown").trim();

            if (!championMap[champion]) {
                championMap[champion] = {
                    champion,
                    matchesPlayed: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    gf: 0,
                    ga: 0,
                    csFor: 0,
                    csAgainst: 0
                };
            }

            const s = championMap[champion];
            s.matchesPlayed++;

            const gf = Number(m.GF) || 0;
            const ga = Number(m.GA) || 0;
            const wdl = String(m["W-D-L"] || "").toUpperCase();

            s.gf += gf;
            s.ga += ga;

            if (wdl.includes("W")) s.wins++;
            else if (wdl.includes("D")) s.draws++;
            else if (wdl.includes("L")) s.losses++;

            if (ga === 0) s.csFor++;
            if (gf === 0) s.csAgainst++;
        });

        return Object.values(championMap);
    }, [ageFilteredMatches]);

    const filteredStats = useMemo(() => {
        if (!searchQuery) return statsByChampion;
        const lowerQ = searchQuery.toLowerCase();
        return statsByChampion.filter((s) =>
            String(s.champion).toLowerCase().includes(lowerQ)
        );
    }, [statsByChampion, searchQuery]);

    const sortedStats = useMemo(() => {
        if (!sortConfig.key) return filteredStats;

        return [...filteredStats].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (typeof aVal === "number" && typeof bVal === "number") {
                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            }

            const strA = String(aVal);
            const strB = String(bVal);
            return sortConfig.direction === "asc"
                ? strA.localeCompare(strB, "en", { numeric: true })
                : strB.localeCompare(strA, "en", { numeric: true });
        });
    }, [filteredStats, sortConfig]);

    const totals = useMemo(() => {
        return filteredStats.reduce((acc, curr) => {
            acc.matchesPlayed += curr.matchesPlayed;
            acc.wins += curr.wins;
            acc.draws += curr.draws;
            acc.losses += curr.losses;
            acc.gf += curr.gf;
            acc.ga += curr.ga;
            acc.csFor += curr.csFor;
            acc.csAgainst += curr.csAgainst;
            return acc;
        }, { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, csFor: 0, csAgainst: 0 });
    }, [filteredStats]);

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "desc" ? "asc" : "desc"
        }));
    };

    if (!matches || matches.length === 0) {
        return <NoData_db message="No championship statistics available for this opponent." />;
    }

    return (
        <div className="h2h-ages-wrap fade-in">
            <div className="h2h-matches-controls">
                <div className="h2h-matches-age-filter">
                    <DropDownList_db
                        options={ageDropdownOptions}
                        value={ageFilter}
                        onChange={setAgeFilter}
                        placeholder="All Ages"
                        searchable={ageOptions.length > 8}
                    />
                </div>
                <div className="h2h-matches-search">
                    <SearchBar_db
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search championships..."
                    />
                </div>
                <span className="h2h-matches-count">{filteredStats.length} CHAMPIONSHIPS</span>
            </div>

            {filteredStats.length === 0 ? (
                <NoData_db message="No championships found for your search or age filter." height="200px" />
            ) : (
                <div className="h2h-ages-container">
                    <table className="h2h-ages-table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort("champion")}>
                                    CHAMPIONSHIP {sortConfig.key === "champion" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("matchesPlayed")}>
                                    P {sortConfig.key === "matchesPlayed" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("wins")}>
                                    W {sortConfig.key === "wins" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("draws")}>
                                    D {sortConfig.key === "draws" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("losses")}>
                                    L {sortConfig.key === "losses" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("gf")}>
                                    GF {sortConfig.key === "gf" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("ga")}>
                                    GA {sortConfig.key === "ga" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("csFor")}>
                                    CS FOR {sortConfig.key === "csFor" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="sortable" onClick={() => handleSort("csAgainst")}>
                                    CS AG {sortConfig.key === "csAgainst" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.map((s) => (
                                <tr key={s.champion}>
                                    <td className="age-cell">{s.champion}</td>
                                    <td>{s.matchesPlayed}</td>
                                    <td style={{ fontWeight: 600, color: s.wins > s.losses ? "#27ae60" : "inherit" }}>{s.wins}</td>
                                    <td>{s.draws}</td>
                                    <td style={{ fontWeight: 600, color: s.losses > s.wins ? "#b71c1c" : "inherit" }}>{s.losses}</td>
                                    <td>{s.gf}</td>
                                    <td>{s.ga}</td>
                                    <td style={{ fontWeight: 600 }}>{s.csFor}</td>
                                    <td style={{ fontWeight: 600 }}>{s.csAgainst}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="total-row">
                                <td className="age-cell" style={{ textAlign: "left", paddingLeft: "20px" }}></td>
                                <td>{totals.matchesPlayed}</td>
                                <td style={{ fontWeight: 600, color: totals.wins > totals.losses ? "#27ae60" : "inherit" }}>{totals.wins}</td>
                                <td>{totals.draws}</td>
                                <td style={{ fontWeight: 600, color: totals.losses > totals.wins ? "#b71c1c" : "inherit" }}>{totals.losses}</td>
                                <td>{totals.gf}</td>
                                <td>{totals.ga}</td>
                                <td style={{ fontWeight: 600 }}>{totals.csFor}</td>
                                <td style={{ fontWeight: 600 }}>{totals.csAgainst}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
