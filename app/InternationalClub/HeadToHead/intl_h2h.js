"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { GitCompare } from "lucide-react";
import { AutocompleteInput } from "../../Database";
import NoData_db from "../../lib/NoData_db";
import { exportIntlH2HToExcel, EXPORT_EVENT } from "../ExcelExport/intl_excel_export";
import "../Matches/intl_matches.css";
import "./intl_h2h.css";

function getOpponents(matches, team) {
    const set = new Set();
    (matches || []).forEach((m) => {
        if (m["TEAM A"] === team && m["TEAM B"]) set.add(m["TEAM B"]);
        if (m["TEAM B"] === team && m["TEAM A"]) set.add(m["TEAM A"]);
    });
    return [...set].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

function getAllTeams(matches) {
    const set = new Set();
    (matches || []).forEach((m) => {
        if (m["TEAM A"]) set.add(m["TEAM A"]);
        if (m["TEAM B"]) set.add(m["TEAM B"]);
    });
    return [...set].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

export default function IntlClubH2H({ matches }) {
    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");

    const allTeams = useMemo(() => getAllTeams(matches), [matches]);

    const teamAOptions = useMemo(() => {
        if (!teamB) return allTeams;
        return getOpponents(matches, teamB);
    }, [matches, allTeams, teamB]);

    const teamBOptions = useMemo(() => {
        if (!teamA) return allTeams;
        return getOpponents(matches, teamA);
    }, [matches, allTeams, teamA]);

    const handleTeamAChange = useCallback(
        (value) => {
            setTeamA(value);
            if (!value) return;
            const opponents = getOpponents(matches, value);
            setTeamB((prev) => (prev && opponents.includes(prev) ? prev : ""));
        },
        [matches]
    );

    const handleTeamBChange = useCallback(
        (value) => {
            setTeamB(value);
            if (!value) return;
            const opponents = getOpponents(matches, value);
            setTeamA((prev) => (prev && opponents.includes(prev) ? prev : ""));
        },
        [matches]
    );

    const h2h = useMemo(() => {
        if (!teamA || !teamB || teamA === teamB) return null;

        const rows = (matches || []).filter((m) => {
            const a = m["TEAM A"];
            const b = m["TEAM B"];
            return (a === teamA && b === teamB) || (a === teamB && b === teamA);
        });

        let aWins = 0;
        let bWins = 0;
        let draws = 0;
        let aGf = 0;
        let aGa = 0;

        rows.forEach((m) => {
            const aIsFirst = m["TEAM A"] === teamA;
            const wdl = m["W-D-L"];
            const gf = Number(m.GF) || 0;
            const ga = Number(m.GA) || 0;

            if (aIsFirst) {
                aGf += gf;
                aGa += ga;
            } else {
                aGf += ga;
                aGa += gf;
            }

            if (wdl && String(wdl).startsWith("D")) draws++;
            else if (aIsFirst && wdl === "W") aWins++;
            else if (aIsFirst && wdl === "L") bWins++;
            else if (!aIsFirst && wdl === "L") aWins++;
            else if (!aIsFirst && wdl === "W") bWins++;
        });

        return {
            rows,
            aWins,
            bWins,
            draws,
            aGf,
            aGa,
            bGf: aGa,
            bGa: aGf,
        };
    }, [matches, teamA, teamB]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "h2h" || !e.detail?.claim) return;
            e.detail.claim();
            if (!teamA || !teamB || teamA === teamB) {
                e.detail.done({ ok: false, message: "Select two teams for H2H export." });
                return;
            }
            const ok = await exportIntlH2HToExcel(teamA, teamB, e.detail.matches);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [teamA, teamB]);

    if (!allTeams.length) return <NoData_db message="NO TEAMS FOR H2H" />;

    return (
        <div className="intl-h2h-wrap">
            <div className="intl-h2h-header">
                <h1>
                    HEAD TO <span className="gold">HEAD</span>
                </h1>
            </div>

            <div className="intl-h2h-selectors">
                <div className="intl-h2h-selector">
                    <label className="intl-h2h-selector-label">TEAM 1</label>
                    <AutocompleteInput
                        value={teamA}
                        options={teamAOptions}
                        onChange={handleTeamAChange}
                        className="intl-h2h-input field-input"
                        accentColor="#c9a84c"
                        placeholder="Select first team..."
                    />
                </div>

                <div className="intl-h2h-vs">
                    <GitCompare size={22} />
                    <span>VS</span>
                </div>

                <div className="intl-h2h-selector">
                    <label className="intl-h2h-selector-label">TEAM 2</label>
                    <AutocompleteInput
                        value={teamB}
                        options={teamBOptions}
                        onChange={handleTeamBChange}
                        className="intl-h2h-input field-input"
                        accentColor="#c9a84c"
                        placeholder={teamA ? "Select opponent..." : "Select second team..."}
                    />
                </div>
            </div>

            {!teamA || !teamB ? (
                <div className="intl-h2h-empty">
                    <GitCompare size={40} strokeWidth={1.2} />
                    <h3>SELECT TWO TEAMS</h3>
                    <p>
                        {teamA
                            ? "Choose an opponent from teams that have faced Team 1."
                            : "Pick Team 1 first — Team 2 will show only direct opponents."}
                    </p>
                </div>
            ) : teamA === teamB ? (
                <div className="intl-h2h-empty">
                    <h3>SAME TEAM SELECTED</h3>
                    <p>Please choose two different clubs.</p>
                </div>
            ) : h2h && (
                <>
                    <div className="intl-h2h-scoreboard">
                        <div className="intl-h2h-team-block">
                            <span className="intl-h2h-team-name">{teamA}</span>
                            <span className="intl-h2h-team-stat">{h2h.aWins} W</span>
                            <span className="intl-h2h-team-goals">{h2h.aGf} GF · {h2h.aGa} GA</span>
                        </div>
                        <div className="intl-h2h-center">
                            <div className="intl-h2h-result-pill">
                                {h2h.aWins} — {h2h.draws} — {h2h.bWins}
                            </div>
                            <span className="intl-h2h-result-label">W · D · L</span>
                            <span className="intl-h2h-match-count">{h2h.rows.length} matches</span>
                        </div>
                        <div className="intl-h2h-team-block intl-h2h-team-block--away">
                            <span className="intl-h2h-team-name">{teamB}</span>
                            <span className="intl-h2h-team-stat">{h2h.bWins} W</span>
                            <span className="intl-h2h-team-goals">{h2h.bGf} GF · {h2h.bGa} GA</span>
                        </div>
                    </div>

                    {h2h.rows.length === 0 ? (
                        <NoData_db message="NO DIRECT MATCHES BETWEEN THESE TEAMS" />
                    ) : (
                        <div className="intl-table-wrap">
                            <table className="intl-table">
                                <thead>
                                    <tr>
                                        <th>Edition</th>
                                        <th>GAME</th>
                                        <th>KIND</th>
                                        <th>ROUND</th>
                                        <th>TEAM A</th>
                                        <th>SCORE</th>
                                        <th>TEAM B</th>
                                        <th>H-A-N</th>
                                        <th>W-D-L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {h2h.rows.map((m) => (
                                        <tr key={m.ROW_ID}>
                                            <td>{m.Edition || "—"}</td>
                                            <td>{m.GAME || "—"}</td>
                                            <td>{m.KIND || "—"}</td>
                                            <td>{m.ROUND || "—"}</td>
                                            <td><strong>{m["TEAM A"]}</strong></td>
                                            <td className="score">
                                                {m.GF ?? "—"} - {m.GA ?? "—"}
                                                {m.PEN ? ` (${m.PEN})` : ""}
                                            </td>
                                            <td><strong>{m["TEAM B"]}</strong></td>
                                            <td>{m["H-A-N"] || "—"}</td>
                                            <td>{m["W-D-L"] || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
