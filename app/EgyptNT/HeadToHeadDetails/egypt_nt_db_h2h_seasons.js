"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";

const parseSeasonParts = (season) => {
    const raw = String(season || "").trim();
    if (!raw) return { text: "", number: 0, raw };

    const numberMatch = raw.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : 0;
    const text = raw
        .replace(/\d+/g, " ")
        .replace(/[/\-–—|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    return { text, number, raw };
};

const compareSeasonLabels = (a, b) => {
    const partA = parseSeasonParts(a);
    const partB = parseSeasonParts(b);

    const textCmp = partA.text.localeCompare(partB.text, "en", { sensitivity: "base" });
    if (textCmp !== 0) return textCmp;

    if (partA.number !== partB.number) return partB.number - partA.number;

    return partA.raw.localeCompare(partB.raw, "en", { numeric: true });
};

export default function EgyptNTH2HSeasons({ matches }) {
    const [sortConfig, setSortConfig] = useState({ key: "season", direction: "asc" });
    const [searchQuery, setSearchQuery] = useState("");
    const [ageFilter, setAgeFilter] = useState("all");
    const [championFilter, setChampionFilter] = useState("all");

    const ageOptions = useMemo(() => {
        const ages = new Set();
        (matches || []).forEach((m) => {
            const age = String(m.AGE || "").trim();
            if (age) ages.add(age);
        });
        return [...ages].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    }, [matches]);

    const championOptions = useMemo(() => {
        const champions = new Set();
        (matches || []).forEach((m) => {
            const champion = String(m.CHAMPION || "").trim();
            if (champion) champions.add(champion);
        });
        return [...champions].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    }, [matches]);

    const ageDropdownOptions = useMemo(() => [
        { value: "all", label: "All Ages" },
        ...ageOptions.map((age) => ({ value: age, label: age }))
    ], [ageOptions]);

    const championDropdownOptions = useMemo(() => [
        { value: "all", label: "All Championships" },
        ...championOptions.map((champion) => ({ value: champion, label: champion }))
    ], [championOptions]);

    const filteredMatches = useMemo(() => {
        return (matches || []).filter((m) => {
            if (ageFilter !== "all" && String(m.AGE || "").trim() !== ageFilter) return false;
            if (championFilter !== "all" && String(m.CHAMPION || "").trim() !== championFilter) return false;
            return true;
        });
    }, [matches, ageFilter, championFilter]);

    const statsBySeason = useMemo(() => {
        const seasonMap = {};

        filteredMatches.forEach((m) => {
            const season = String(m.SEASON || "Unknown").trim();

            if (!seasonMap[season]) {
                seasonMap[season] = {
                    season,
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

            const s = seasonMap[season];
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

        return Object.values(seasonMap);
    }, [filteredMatches]);

    const filteredStats = useMemo(() => {
        if (!searchQuery) return statsBySeason;
        const lowerQ = searchQuery.toLowerCase();
        return statsBySeason.filter((s) =>
            String(s.season).toLowerCase().includes(lowerQ)
        );
    }, [statsBySeason, searchQuery]);

    const sortedStats = useMemo(() => {
        if (!sortConfig.key) return filteredStats;

        return [...filteredStats].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (sortConfig.key === "season") {
                const cmp = compareSeasonLabels(aVal, bVal);
                return sortConfig.direction === "asc" ? cmp : -cmp;
            }

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
        return <NoData_db message="No season statistics available for this opponent." />;
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
                <div className="h2h-matches-age-filter">
                    <DropDownList_db
                        options={championDropdownOptions}
                        value={championFilter}
                        onChange={setChampionFilter}
                        placeholder="All Championships"
                        searchable={championOptions.length > 8}
                    />
                </div>
                <div className="h2h-matches-search">
                    <SearchBar_db
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search seasons..."
                    />
                </div>
                <span className="h2h-matches-count">{filteredStats.length} SEASONS</span>
            </div>

            {filteredStats.length === 0 ? (
                <NoData_db message="No seasons found for your search or filters." height="200px" />
            ) : (
                <div className="h2h-ages-container">
                    <table className="h2h-ages-table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort("season")}>
                                    SEASON {sortConfig.key === "season" && (sortConfig.direction === "asc" ? "↑" : "↓")}
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
                                <tr key={s.season}>
                                    <td className="age-cell">{s.season}</td>
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
