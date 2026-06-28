"use client";

import { useMemo, useState, useEffect } from "react";
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

    const opponentLabel = match.role === "Opponent" ? match.managedTeam : match.opponent;
    const haystack = [
        match.idx,
        match.date,
        match.season,
        match.champion,
        match.sy,
        opponentLabel,
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
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const filteredMatches = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return (stats.matchHistory || []).filter(
            (match) =>
                matchesScoreStateFilter(match, scoreStateFilter) &&
                matchesSearchFilter(match, query)
        );
    }, [stats.matchHistory, searchTerm, scoreStateFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, scoreStateFilter]);

    const totalMatches = filteredMatches.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentMatches = filteredMatches.slice(startIdx, startIdx + pageSize);

    return (
        <div className="history-section fade-in">
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
                    {totalMatches} GAMES
                </span>
            </div>

            <div style={{ overflowX: "auto" }}>
                {totalMatches === 0 ? (
                    <NoData_db message="No matches found for your search or filter." height="200px" />
                ) : (
                    <table className="player-match-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>#</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>MATCH ID</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>DATE</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>SEASON</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>OPPONENT TEAM</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>OPPONENT MANAGER</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>SCORE</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px" }}>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMatches.map((m, idx) => (
                                <tr key={`${m.idx}-${startIdx + idx}`}>
                                    <td style={{ color: "#888", fontSize: "12px", textAlign: "center", fontFamily: "Space Mono" }}>{startIdx + idx + 1}</td>
                                    <td className="m-id-cell" style={{ textAlign: "center", fontFamily: "Space Mono", color: "var(--player-gold)", fontSize: "12px" }}>{m.idx}</td>
                                    <td style={{ fontSize: "15px", fontWeight: "700", textAlign: "center", fontFamily: "Outfit", color: "#000" }}>{m.date}</td>
                                    <td style={{ fontSize: "15px", fontWeight: "700", textAlign: "center", fontFamily: "Outfit", color: "#000" }}>{m.season}</td>
                                    <td style={{ color: "var(--player-gold)", fontWeight: "800", textAlign: "center", fontSize: "15px", fontFamily: "Outfit" }}>
                                        {m.role === "Opponent" ? m.managedTeam : m.opponent}
                                    </td>
                                    <td style={{ fontSize: "15px", fontWeight: "700", textAlign: "center", fontFamily: "Outfit", color: "#000" }}>
                                        {m.opponentManager || "—"}
                                    </td>
                                    <td style={{ fontWeight: 800, fontFamily: "Outfit", fontSize: "18px", textAlign: "center", letterSpacing: "0.5px", color: "#000" }}>
                                        {m.gf} - {m.ga}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <span
                                            className={`m-role-pill ${m.wdl === "W" ? "role-starter" : (m.wdl === "L" ? "role-sub" : "")}`}
                                            style={{
                                                background: m.wdl === "W" ? "rgba(46, 204, 113, 0.15)" : (m.wdl === "L" ? "rgba(231, 76, 60, 0.15)" : "rgba(230, 126, 34, 0.15)"),
                                                color: m.wdl === "W" ? "#2ecc71" : (m.wdl === "L" ? "#e74c3c" : "#e67e22"),
                                                fontFamily: "Space Mono",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                            }}
                                        >
                                            {m.wdl === "W" ? "WIN" : (m.wdl === "L" ? "LOSS" : "DRAW")}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="p-pagination" style={{ marginTop: "20px", justifyContent: "center", display: "flex", gap: "12px", alignItems: "center" }}>
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}>←</button>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}>→</button>
                </div>
            )}

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
                    color: var(--player-gold);
                    letter-spacing: 1px;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .p-pagination button {
                    background: rgba(201, 168, 76, 0.15);
                    border: 1px solid rgba(201, 168, 76, 0.3);
                    color: var(--player-gold);
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-family: 'Space Mono';
                    font-weight: 700;
                    font-size: 11px;
                    cursor: pointer;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .p-pagination button:hover:not(:disabled) {
                    background: var(--player-gold);
                    color: #000;
                    border-color: var(--player-gold);
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.2);
                }
                .p-pagination button:disabled { opacity: 0.2; cursor: not-allowed; }
                .p-pagination span { font-family: 'Space Mono'; font-size: 13px; color: var(--player-gold); letter-spacing: 2px; font-weight: 800; }
            `}</style>
        </div>
    );
}
