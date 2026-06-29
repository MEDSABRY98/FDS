"use client";

import { useMemo, useState, useCallback } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export function SortIndicator({ sortConfig, columnKey }) {
    if (sortConfig.key !== columnKey) {
        return <span className="mgr-sort-indicator idle">↕</span>;
    }
    return (
        <span className="mgr-sort-indicator active">
            {sortConfig.direction === "asc" ? "↑" : "↓"}
        </span>
    );
}

export function sumManagerStatRows(rows) {
    return rows.reduce((acc, row) => ({
        matches: acc.matches + (row.matches || 0),
        wins: acc.wins + (row.wins || 0),
        draws: acc.draws + (row.draws || 0),
        losses: acc.losses + (row.losses || 0),
        gs: acc.gs + (row.gs || 0),
        ga: acc.ga + (row.ga || 0),
        csFor: acc.csFor + (row.csFor || 0),
    }), { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0 });
}

export function Manager_StatsSummary_Table({
    rows,
    labelHeader,
    labelKey = "name",
    searchPlaceholder,
    compareLabels = null,
}) {
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "matches", direction: "desc" });

    const requestSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
        }));
    }, []);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        let items = [...rows];
        if (query) {
            items = items.filter((row) => String(row[labelKey] || "").toLowerCase().includes(query));
        }

        items.sort((a, b) => {
            const key = sortConfig.key;
            if (key === labelKey && compareLabels) {
                const cmp = compareLabels(String(a[labelKey] || ""), String(b[labelKey] || ""));
                return sortConfig.direction === "asc" ? cmp : -cmp;
            }

            const aVal = key === labelKey ? String(a[key] || "") : (a[key] || 0);
            const bVal = key === labelKey ? String(b[key] || "") : (b[key] || 0);

            if (typeof aVal === "string") {
                const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
                return sortConfig.direction === "asc" ? cmp : -cmp;
            }

            return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        });

        return items;
    }, [rows, search, sortConfig, labelKey, compareLabels]);

    const totals = useMemo(() => sumManagerStatRows(filteredRows), [filteredRows]);

    const renderSortTh = (key, label, extraClass = "") => (
        <th
            key={key}
            className={`mgr-sortable${extraClass ? ` ${extraClass}` : ""}`}
            onClick={() => requestSort(key)}
        >
            {label}
            <SortIndicator sortConfig={sortConfig} columnKey={key} />
        </th>
    );

    return (
        <div className="fade-in">
            <div className="mgr-stats-search-wrap">
                <SearchBar_db
                    value={search}
                    onChange={setSearch}
                    placeholder={searchPlaceholder}
                />
            </div>

            <div style={{ overflowX: "auto" }}>
                {filteredRows.length === 0 ? (
                    <NoData_db message="No data found for your search." />
                ) : (
                    <table className="player-match-table mgr-matches-table mgr-stats-table" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "28%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                {renderSortTh(labelKey, labelHeader, "mgr-season-col")}
                                {renderSortTh("matches", "MP")}
                                {renderSortTh("wins", "W")}
                                {renderSortTh("draws", "D")}
                                {renderSortTh("losses", "L")}
                                {renderSortTh("gs", "GF")}
                                {renderSortTh("ga", "GA")}
                                {renderSortTh("csFor", "CS (F)")}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => (
                                <tr key={String(row[labelKey])}>
                                    <td className="mgr-season-col">{row[labelKey]}</td>
                                    <td>{row.matches}</td>
                                    <td className="mgr-w-cell">{row.wins}</td>
                                    <td>{row.draws}</td>
                                    <td className="mgr-l-cell">{row.losses}</td>
                                    <td>{row.gs}</td>
                                    <td>{row.ga}</td>
                                    <td className="mgr-cs-cell">{row.csFor}</td>
                                </tr>
                            ))}
                            <tr className="mgr-stats-total-row">
                                <td className="mgr-season-col">TOTAL</td>
                                <td>{totals.matches}</td>
                                <td className="mgr-w-cell">{totals.wins}</td>
                                <td>{totals.draws}</td>
                                <td className="mgr-l-cell">{totals.losses}</td>
                                <td>{totals.gs}</td>
                                <td>{totals.ga}</td>
                                <td className="mgr-cs-cell">{totals.csFor}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function parseSeasonParts(season) {
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
}

export function compareSeasonLabels(a, b) {
    const partA = parseSeasonParts(a);
    const partB = parseSeasonParts(b);

    const textCmp = partA.text.localeCompare(partB.text, undefined, { sensitivity: "base" });
    if (textCmp !== 0) return textCmp;

    if (partB.number !== partA.number) return partB.number - partA.number;

    return partB.raw.localeCompare(partA.raw, undefined, { numeric: true });
}

export function buildMatchEgyptSideResolver(matchInfo, matchLineups = []) {
    const egyptTeamName = String(matchInfo?.["Egypt TEAM"] || matchInfo?.["EGYPT TEAM"] || "منتخب مصر").trim();
    const opponentTeamName = String(matchInfo?.["OPPONENT TEAM"] || "").trim();
    const norm = (value) => String(value || "").trim().toLowerCase();

    const egyptIdentifiers = new Set([
        "egypt",
        "مصر",
        "منتخب مصر",
        "المنتخب المصري",
        norm(egyptTeamName)
    ].filter(Boolean));

    const resolveTeamSide = (teamValue) => {
        const name = String(teamValue || "").trim();
        if (!name) return null;

        const normalizedName = norm(name);
        if (opponentTeamName && normalizedName === norm(opponentTeamName)) return false;
        if (normalizedName === "opponent" && opponentTeamName) return false;
        if (egyptIdentifiers.has(normalizedName)) return true;
        return null;
    };

    const playerSideByName = new Map();
    matchLineups.forEach((lineupRow) => {
        const playerName = String(lineupRow["PLAYER NAME"] || "").trim();
        if (!playerName) return;
        const side = resolveTeamSide(lineupRow.TEAM);
        if (side !== null) playerSideByName.set(playerName, side);
    });

    return (record) => {
        const byTeam = resolveTeamSide(record?.TEAM);
        if (byTeam !== null) return byTeam;

        const playerName = String(record?.["PLAYER NAME"] || "").trim();
        if (playerName && playerSideByName.has(playerName)) {
            return playerSideByName.get(playerName);
        }

        return false;
    };
}

export function isGoalEvent(type, sub) {
    const typeUp = String(type || "").trim().toUpperCase();
    const subUp = String(sub || "").trim().toUpperCase();
    const subRaw = String(sub || "").trim();
    return ["GOAL", "هدف"].includes(typeUp) || typeUp === "PENGOAL" || subUp === "PENGOAL" || subRaw === "هدف جزاء";
}

export function isAssistEvent(type) {
    const typeUp = String(type || "").trim().toUpperCase();
    const typeRaw = String(type || "").trim();
    return typeUp === "ASSIST" || typeRaw === "اسيست" || typeRaw === "صنع";
}

function parseGoalEventOrder(eventId) {
    const id = String(eventId || "").trim();
    const trailing = id.match(/(\d+)(?!.*\d)/);
    return trailing ? parseInt(trailing[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function getMatchGoalScoreStates(match, matchEvents, matchLineups, managerName, result) {
    const isAsEgypt = String(match["EGYPT MANAGER"] || "").trim() === managerName;
    const isEgyptSide = buildMatchEgyptSideResolver(match, matchLineups);

    const goals = (matchEvents || [])
        .filter((event) => isGoalEvent(event.TYPE, event.TYPE_SUB))
        .sort((a, b) => parseGoalEventOrder(a.EVENT_ID) - parseGoalEventOrder(b.EVENT_ID));

    let managedGoals = 0;
    let concededGoals = 0;
    let everAhead = false;
    let everBehind = false;

    goals.forEach((event) => {
        const scoredByEgypt = isEgyptSide(event);
        const scoredByManaged = isAsEgypt ? scoredByEgypt : !scoredByEgypt;

        if (scoredByManaged) managedGoals += 1;
        else concededGoals += 1;

        if (managedGoals > concededGoals) everAhead = true;
        if (managedGoals < concededGoals) everBehind = true;
    });

    return { everAhead, everBehind, result };
}

export function applyScoreStateStats(summary, scoreState) {
    if (scoreState.everAhead) {
        if (scoreState.result === "W") summary.aheadWin += 1;
        else if (scoreState.result === "D") summary.aheadDraw += 1;
        else summary.aheadLoss += 1;
    }

    if (scoreState.everBehind) {
        if (scoreState.result === "W") summary.behindWin += 1;
        else if (scoreState.result === "D") summary.behindDraw += 1;
        else summary.behindLoss += 1;
    }
}
