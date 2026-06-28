"use client";

import { useMemo, useState } from "react";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import NoData_db from "../../lib/NoData_db";

const SCORE_STATE_OPTIONS = [
    { value: "all", label: "All Matches" },
    { value: "ahead-won", label: "Ahead & Won" },
    { value: "ahead-draw", label: "Ahead & Drew" },
    { value: "ahead-loss", label: "Ahead & Lost" },
    { value: "behind-won", label: "Behind & Won" },
    { value: "behind-draw", label: "Behind & Drew" },
    { value: "behind-loss", label: "Behind & Lost" },
    { value: "ahead-any", label: "When Ahead (Any)" },
    { value: "behind-any", label: "When Behind (Any)" },
];

function matchesScoreStateFilter(match, filter) {
    if (filter === "all") return true;

    const { everAhead, everBehind, wdl } = match;
    switch (filter) {
        case "ahead-won":
            return everAhead && wdl === "W";
        case "ahead-draw":
            return everAhead && wdl === "D";
        case "ahead-loss":
            return everAhead && wdl === "L";
        case "behind-won":
            return everBehind && wdl === "W";
        case "behind-draw":
            return everBehind && wdl === "D";
        case "behind-loss":
            return everBehind && wdl === "L";
        case "ahead-any":
            return everAhead;
        case "behind-any":
            return everBehind;
        default:
            return true;
    }
}

function matchesSearchFilter(match, query) {
    if (!query) return true;

    const haystack = [
        match.idx,
        match.date,
        match.season,
        match.opponent,
        match.opponentManager,
        match.managedTeam,
        match.role,
        match.gf,
        match.ga,
        match.wdl,
    ]
        .map((part) => String(part ?? "").toLowerCase())
        .join(" ");

    return haystack.includes(query);
}

export default function Manager_Matches_Module({ stats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [scoreStateFilter, setScoreStateFilter] = useState("all");

    const filteredMatches = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return (stats.matchHistory || []).filter(
            (match) =>
                matchesScoreStateFilter(match, scoreStateFilter) &&
                matchesSearchFilter(match, query)
        );
    }, [stats.matchHistory, searchTerm, scoreStateFilter]);

    return (
        <div className="fade-in">
            <div className="mgr-matches-controls">
                <div className="mgr-matches-controls__dropdown">
                    <DropDownList_db
                        options={SCORE_STATE_OPTIONS}
                        value={scoreStateFilter}
                        onChange={setScoreStateFilter}
                        placeholder="All Matches"
                    />
                </div>
                <div className="mgr-matches-controls__search">
                    <SearchBar_db
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search match ID, opponent, season..."
                    />
                </div>
                <span className="mgr-matches-controls__count">
                    {filteredMatches.length} MATCHES
                </span>
            </div>

            <style jsx>{`
                .mgr-matches-controls {
                    display: flex;
                    flex-wrap: nowrap;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .mgr-matches-controls__dropdown {
                    width: 240px;
                    flex-shrink: 0;
                }
                .mgr-matches-controls__search {
                    width: 320px;
                    flex-shrink: 0;
                }
                .mgr-matches-controls__count {
                    font-family: 'Space Mono', monospace;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--gold);
                    letter-spacing: 1px;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
            `}</style>

            <div style={{ overflowX: "auto" }}>
                {filteredMatches.length === 0 ? (
                    <NoData_db message="No matches found for your search or filter." height="200px" />
                ) : (
                    <table className="player-match-table mgr-matches-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MATCH ID</th>
                                <th>DATE</th>
                                <th className="mgr-season-col">SEASON</th>
                                <th>OPPONENT TEAM</th>
                                <th>OPPONENT MANAGER</th>
                                <th>GF</th>
                                <th>GA</th>
                                <th>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatches.map((m, idx) => (
                                <tr key={`${m.idx}-${idx}`}>
                                    <td>{idx + 1}</td>
                                    <td>{m.idx}</td>
                                    <td>{m.date}</td>
                                    <td className="mgr-season-col">{m.season}</td>
                                    <td style={{ fontWeight: "800" }}>{m.opponent}</td>
                                    <td>{m.opponentManager}</td>
                                    <td>{m.gf}</td>
                                    <td>{m.ga}</td>
                                    <td>
                                        <span
                                            className={`m-role-pill ${m.wdl === "W" ? "role-starter" : m.wdl === "L" ? "role-sub" : ""}`}
                                            style={{ fontSize: "11px", fontWeight: "800" }}
                                        >
                                            {m.wdl}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
