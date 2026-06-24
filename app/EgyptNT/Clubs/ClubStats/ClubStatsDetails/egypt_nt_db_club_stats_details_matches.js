"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import SearchBar_db from "../../../../lib/SearchBar_db";
import NoData_db from "../../../../lib/NoData_db";

export default function ClubStatsDetailsMatches({ clubStats }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const pageSize = 50;

    const filteredMatches = useMemo(() => {
        const list = clubStats?.matches || [];
        if (!searchTerm.trim()) return list;
        const query = searchTerm.toLowerCase().trim();
        return list.filter(m =>
            String(m.opponent || "").toLowerCase().includes(query) ||
            String(m.champion || "").toLowerCase().includes(query) ||
            String(m.date || "").toLowerCase().includes(query)
        );
    }, [clubStats, searchTerm]);

    const paginatedMatches = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMatches.slice(start, start + pageSize);
    }, [filteredMatches, currentPage]);

    const totalPages = Math.ceil(filteredMatches.length / pageSize);

    const totals = useMemo(() => {
        return filteredMatches.reduce(
            (acc, match) => {
                acc.ga += match.goals + match.assists;
                acc.goals += match.goals;
                acc.assists += match.assists;
                return acc;
            },
            { ga: 0, goals: 0, assists: 0 }
        );
    }, [filteredMatches]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    return (
        <div className="squad-subtab-container fade-in">
            <div className="squad-search-wrap">
                <SearchBar_db
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search opponent, tournament, date..."
                />
            </div>

            <div className="squad-table-container">
                <table className="luxury-squad-table">
                    <colgroup>
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "7%" }} />
                        <col style={{ width: "7%" }} />
                        <col style={{ width: "7%" }} />
                        <col style={{ width: "6%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>DATE</th>
                            <th>OPPONENT</th>
                            <th>TOURNAMENT</th>
                            <th>SEASON</th>
                            <th>G+A</th>
                            <th>G</th>
                            <th>A</th>
                            <th title="Details">
                                <Info size={16} style={{ display: "inline-block", verticalAlign: "middle" }} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMatches.length === 0 ? (
                            <NoData_db
                                isTable
                                colSpan={9}
                                message="No matches found matching your query."
                                height="200px"
                            />
                        ) : (
                            paginatedMatches.map((match, idx) => (
                                <tr key={match.matchId}>
                                    <td className="row-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                    <td className="date-cell">{match.date || "—"}</td>
                                    <td className="player-name-cell">{match.opponent || "—"}</td>
                                    <td>{match.champion || "—"}</td>
                                    <td>{match.season || "—"}</td>
                                    <td className="club-stat-cell highlight-gold">{match.goals + match.assists}</td>
                                    <td className="club-stat-cell g-val">{match.goals}</td>
                                    <td className="club-stat-cell a-val">{match.assists}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="club-stats-match-details-btn"
                                            onClick={() => setSelectedMatch(match)}
                                            title="View scoring events"
                                            disabled={!(match.events || []).length}
                                        >
                                            <Info size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {paginatedMatches.length > 0 && filteredMatches.length > 0 && (
                            <tr className="club-stats-total-row">
                                <td />
                                <td colSpan={4} className="player-name-cell">TOTAL</td>
                                <td className="club-stat-cell highlight-gold">{totals.ga}</td>
                                <td className="club-stat-cell g-val">{totals.goals}</td>
                                <td className="club-stat-cell a-val">{totals.assists}</td>
                                <td />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && filteredMatches.length > 0 && (
                <div className="squad-pagination">
                    <button
                        type="button"
                        className="pag-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ←
                    </button>
                    <span className="pag-info">
                        Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="pag-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        →
                    </button>
                </div>
            )}

            {selectedMatch && (
                <div className="squad-modal-overlay" onClick={() => setSelectedMatch(null)}>
                    <div className="squad-modal-card club-stats-events-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                Match Events
                                <br />
                                <span className="gold">
                                    {selectedMatch.opponent || "—"} — {selectedMatch.date || "—"}
                                </span>
                            </h3>
                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={() => setSelectedMatch(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="club-stats-events-meta">
                                <span>{selectedMatch.champion || "—"}</span>
                                <span>{selectedMatch.season || "—"}</span>
                                <span>G: {selectedMatch.goals}</span>
                                <span>A: {selectedMatch.assists}</span>
                            </div>

                            {(selectedMatch.events || []).length === 0 ? (
                                <NoData_db message="No events available for this match." height="160px" />
                            ) : (
                                <table className="modal-data-table">
                                    <colgroup>
                                        <col style={{ width: "40%" }} />
                                        <col style={{ width: "30%" }} />
                                        <col style={{ width: "30%" }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>PLAYER</th>
                                            <th>TYPE</th>
                                            <th>MINUTE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedMatch.events || []).map((event, eventIdx) => (
                                            <tr key={`${event.player}-${event.minute}-${eventIdx}`}>
                                                <td className="item-name">{event.player}</td>
                                                <td>
                                                    <span
                                                        className={`club-stats-event-type ${
                                                            event.kind === "goal" ? "is-goal" : "is-assist"
                                                        }`}
                                                    >
                                                        {event.typeLabel}
                                                    </span>
                                                </td>
                                                <td className="item-count">{event.minute}&apos;</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
