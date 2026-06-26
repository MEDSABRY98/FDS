"use client";

import { useMemo, useState, useEffect } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import NoData_db from "../../lib/NoData_db";

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const getEgyptTeamName = (match) =>
    String(match["Egypt TEAM"] || match["EGYPT TEAM"] || "Egypt").trim() || "Egypt";

const getWinnerName = (match, opponent) => {
    const wdl = String(match["W-D-L"] || "").trim().toUpperCase();
    const egyptName = getEgyptTeamName(match);
    const oppName = String(match["OPPONENT TEAM"] || opponent || "").trim();

    if (wdl.startsWith("W")) return egyptName;
    if (wdl.startsWith("L")) return oppName || "—";
    if (wdl.startsWith("D")) return "Draw";
    return "—";
};

const getResultText = (match) => {
    const gf = match.GF ?? "—";
    const ga = match.GA ?? "—";
    let result = `${gf} - ${ga}`;
    if (match.ET) result += " (ET)";
    if (match.PEN) result += ` (${String(match.PEN).trim()})`;
    return result;
};

const parseMatchDate = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

export default function EgyptNTH2HMatches({ opponent, matches }) {
    const [searchTerm, setSearchTerm] = useState("");
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

    useEffect(() => {
        setAgeFilter("all");
        setChampionFilter("all");
        setSearchTerm("");
    }, [opponent]);

    const tableRows = useMemo(() => {
        return (matches || [])
            .map((m) => ({
                matchId: m.MATCH_ID ?? "—",
                date: formatDate(m.DATE),
                dateSort: parseMatchDate(m.DATE),
                season: m.SEASON || "—",
                round: m.ROUND || "—",
                age: String(m.AGE || "").trim() || "—",
                champion: String(m.CHAMPION || "").trim() || "—",
                result: getResultText(m),
                winner: getWinnerName(m, opponent),
                wdl: String(m["W-D-L"] || "").trim().toUpperCase()
            }))
            .sort((a, b) => b.dateSort - a.dateSort);
    }, [matches, opponent]);

    const filteredRows = useMemo(() => {
        let rows = tableRows;

        if (ageFilter !== "all") {
            rows = rows.filter((r) => r.age === ageFilter);
        }

        if (championFilter !== "all") {
            rows = rows.filter((r) => r.champion === championFilter);
        }

        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            rows = rows.filter((r) =>
                String(r.matchId).toLowerCase().includes(q) ||
                r.date.toLowerCase().includes(q) ||
                String(r.season).toLowerCase().includes(q) ||
                String(r.round).toLowerCase().includes(q) ||
                String(r.age).toLowerCase().includes(q) ||
                String(r.champion).toLowerCase().includes(q) ||
                String(r.result).toLowerCase().includes(q) ||
                String(r.winner).toLowerCase().includes(q)
            );
        }

        return rows;
    }, [tableRows, ageFilter, championFilter, searchTerm]);

    if (!matches || matches.length === 0) {
        return <NoData_db message="No matches available for this opponent." />;
    }

    return (
        <div className="h2h-matches-wrap fade-in">
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
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search matches..."
                    />
                </div>
                <span className="h2h-matches-count">{filteredRows.length} MATCHES</span>
            </div>

            {filteredRows.length === 0 ? (
                <NoData_db message="No matches found for your search or filters." height="200px" />
            ) : (
                <div className="h2h-matches-table-container">
                    <table className="h2h-matches-table">
                        <thead>
                            <tr>
                                <th>MATCH ID</th>
                                <th>DATE</th>
                                <th>SEASON</th>
                                <th>ROUND</th>
                                <th>AGE</th>
                                <th>RESULT</th>
                                <th>WINNER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => (
                                <tr key={String(row.matchId)}>
                                    <td className="h2h-matches-id">{row.matchId}</td>
                                    <td>{row.date}</td>
                                    <td>{row.season}</td>
                                    <td>{row.round}</td>
                                    <td>{row.age}</td>
                                    <td className="h2h-matches-result">{row.result}</td>
                                    <td>
                                        <span className={`h2h-matches-winner ${row.wdl.startsWith("W") ? "winner-egypt" : row.wdl.startsWith("L") ? "winner-opp" : "winner-draw"}`}>
                                            {row.winner}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
