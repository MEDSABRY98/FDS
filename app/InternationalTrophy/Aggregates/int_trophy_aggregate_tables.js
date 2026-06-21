"use client";

import { useEffect, useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import DropDownList_db from "../../lib/DropDownList_db";
import { FINAL_OUTCOME_OPTIONS } from "../TeamDetails/int_trophy_team_details_utils";
import {
    buildTeamCompetitionMatrix,
    buildTeamGameMatrix,
    getAvailableGames,
} from "./int_trophy_aggregate_utils";
import IntTrophyAggregateMatrixTable from "./int_trophy_aggregate_matrix_table";
import "../Leaderboard/int_trophy_leaderboard.css";
import "./int_trophy_aggregate_tables.css";

const PER_PAGE = 50;
const TYPE_OPTIONS = ["All", "Club", "NT"];
const VIEW_OPTIONS = [
    { id: "by_game", label: "BY GAME" },
    { id: "by_competition", label: "BY COMPETITION" },
];

export default function IntTrophyAggregateTables({ trophies, onFiltersChange }) {
    const [viewMode, setViewMode] = useState("by_game");
    const [typeFilter, setTypeFilter] = useState("All");
    const [outcomeFilter, setOutcomeFilter] = useState("all");
    const [selectedGame, setSelectedGame] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const availableGames = useMemo(
        () => getAvailableGames(trophies, typeFilter),
        [trophies, typeFilter]
    );

    useEffect(() => {
        if (!availableGames.length) {
            setSelectedGame("");
            return;
        }
        if (!selectedGame || !availableGames.includes(selectedGame)) {
            setSelectedGame(availableGames[0]);
        }
    }, [availableGames, selectedGame]);

    useEffect(() => {
        onFiltersChange?.({ typeFilter, outcomeFilter, viewMode, selectedGame });
    }, [typeFilter, outcomeFilter, viewMode, selectedGame, onFiltersChange]);

    const gameMatrix = useMemo(
        () => buildTeamGameMatrix(trophies, typeFilter, outcomeFilter),
        [trophies, typeFilter, outcomeFilter]
    );

    const competitionMatrix = useMemo(
        () => buildTeamCompetitionMatrix(trophies, selectedGame, typeFilter, outcomeFilter),
        [trophies, selectedGame, typeFilter, outcomeFilter]
    );

    const activeMatrix = viewMode === "by_game" ? gameMatrix : competitionMatrix;
    const activeColumns = viewMode === "by_game" ? gameMatrix.games : competitionMatrix.competitions;
    const activeTotals = viewMode === "by_game" ? gameMatrix.totalsByGame : competitionMatrix.totalsByCompetition;

    const filteredRows = useMemo(() => {
        if (!search.trim()) return activeMatrix.rows;
        const q = search.toLowerCase();
        return activeMatrix.rows.filter((row) => row.team.toLowerCase().includes(q));
    }, [activeMatrix.rows, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
    const paginated = filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => {
        setPage(1);
    }, [typeFilter, outcomeFilter, viewMode, selectedGame, search, trophies]);

    if (!trophies?.length) return <NoData_db message="NO TROPHY RECORDS FOUND" />;

    const outcomeLabel = FINAL_OUTCOME_OPTIONS.find((o) => o.id === outcomeFilter)?.label || "ALL";
    const columnCountLabel = viewMode === "by_game" ? "GAMES" : "COMPETITIONS";

    return (
        <div className="int-trophy-agg">
            <div className="int-trophy-agg-header">
                <div className="int-trophy-agg-title-row">
                    <h1>AGGREGATE <span className="gold">TABLES</span></h1>
                    <div className="int-trophy-agg-meta">
                        <span className="int-trophy-agg-meta-badge"><span>TEAMS</span>{filteredRows.length}</span>
                        <span className="int-trophy-agg-meta-badge"><span>{columnCountLabel}</span>{activeColumns.length}</span>
                        <span className="int-trophy-agg-meta-badge"><span>MODE</span>{outcomeLabel}</span>
                        <span className="int-trophy-agg-meta-badge"><span>TOTAL</span>{activeMatrix.grandTotal}</span>
                    </div>
                </div>
                <div className="int-trophy-agg-controls">
                    <div className="int-trophy-agg-toggle">
                        {VIEW_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className={viewMode === opt.id ? "active" : ""}
                                onClick={() => setViewMode(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {viewMode === "by_competition" && (
                        <div className="int-trophy-agg-game-select">
                            <DropDownList_db
                                value={selectedGame}
                                options={availableGames.map((game) => ({ value: game, label: game }))}
                                onChange={setSelectedGame}
                                placeholder="Select game..."
                                searchable
                            />
                        </div>
                    )}
                    <div className="int-trophy-agg-toggle int-trophy-type-toggle">
                        {TYPE_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                className={typeFilter === opt ? "active" : ""}
                                onClick={() => setTypeFilter(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    <div className="int-trophy-agg-toggle">
                        {FINAL_OUTCOME_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className={outcomeFilter === opt.id ? "active" : ""}
                                onClick={() => setOutcomeFilter(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <SearchBar_db
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search team..."
            />

            {!activeColumns.length || !filteredRows.length ? (
                <NoData_db message="NO AGGREGATE DATA FOR THIS SELECTION" />
            ) : (
                <>
                    <IntTrophyAggregateMatrixTable
                        columns={activeColumns}
                        rows={paginated}
                        totalsByColumn={activeTotals}
                        grandTotal={activeMatrix.grandTotal}
                        columnHeaderClass={
                            viewMode === "by_competition"
                                ? "int-trophy-agg-competition-header"
                                : "int-trophy-agg-game-header"
                        }
                    />
                    {totalPages > 1 && (
                        <div className="int-trophy-pagination">
                            <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← PREV</button>
                            <span className="page-info">PAGE {page} OF {totalPages}</span>
                            <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>NEXT →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
