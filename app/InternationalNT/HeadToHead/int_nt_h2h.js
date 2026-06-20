"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { GitCompare } from "lucide-react";
import { AutocompleteInput } from "../../Database";
import NoData_db from "../../lib/NoData_db";
import { exportIntNtH2HToExcel, EXPORT_EVENT } from "../ExcelExport/int_nt_excel_export";
import "../Matches/int_nt_matches.css";
import "./int_nt_h2h.css";

function getOpponents(matches, team) {
    const set = new Set();
    (matches || []).forEach((m) => {
        if (m.TEAMA === team && m.TEAMB) set.add(m.TEAMB);
        if (m.TEAMB === team && m.TEAMA) set.add(m.TEAMA);
    });
    return [...set].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

function getAllTeams(matches) {
    const set = new Set();
    (matches || []).forEach((m) => {
        if (m.TEAMA) set.add(m.TEAMA);
        if (m.TEAMB) set.add(m.TEAMB);
    });
    return [...set].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

export default function IntNtH2H({ matches }) {
    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const allTeams = useMemo(() => getAllTeams(matches), [matches]);
    const teamAOptions = useMemo(() => (!teamB ? allTeams : getOpponents(matches, teamB)), [matches, allTeams, teamB]);
    const teamBOptions = useMemo(() => (!teamA ? allTeams : getOpponents(matches, teamA)), [matches, allTeams, teamA]);

    const handleTeamAChange = useCallback((value) => {
        setTeamA(value);
        if (!value) return;
        setTeamB((prev) => (prev && getOpponents(matches, value).includes(prev) ? prev : ""));
    }, [matches]);

    const handleTeamBChange = useCallback((value) => {
        setTeamB(value);
        if (!value) return;
        setTeamA((prev) => (prev && getOpponents(matches, value).includes(prev) ? prev : ""));
    }, [matches]);

    const h2h = useMemo(() => {
        if (!teamA || !teamB || teamA === teamB) return null;
        const rows = (matches || []).filter((m) =>
            (m.TEAMA === teamA && m.TEAMB === teamB) || (m.TEAMB === teamA && m.TEAMA === teamB)
        );
        let aWins = 0, bWins = 0, draws = 0, aGf = 0, aGa = 0;
        rows.forEach((m) => {
            const aIsFirst = m.TEAMA === teamA;
            const outcome = m.OUTCOME;
            const gf = Number(m.TEAMASCORE) || 0;
            const ga = Number(m.TEAMBSCORE) || 0;
            if (aIsFirst) { aGf += gf; aGa += ga; }
            else { aGf += ga; aGa += gf; }
            if (outcome && String(outcome).startsWith("D")) draws++;
            else if (aIsFirst && outcome === "W") aWins++;
            else if (aIsFirst && outcome === "L") bWins++;
            else if (!aIsFirst && outcome === "L") aWins++;
            else if (!aIsFirst && outcome === "W") bWins++;
        });
        return { rows, aWins, bWins, draws, aGf, aGa, bGf: aGa, bGa: aGf };
    }, [matches, teamA, teamB]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "h2h" || !e.detail?.claim) return;
            e.detail.claim();
            if (!teamA || !teamB || teamA === teamB) {
                e.detail.done({ ok: false, message: "Select two teams for H2H export." });
                return;
            }
            const ok = await exportIntNtH2HToExcel(teamA, teamB, e.detail.matches);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [teamA, teamB]);

    if (!allTeams.length) return <NoData_db message="NO TEAMS FOR H2H" />;

    return (
        <div className="int-nt-h2h-wrap">
            <div className="int-nt-h2h-header"><h1>HEAD TO <span className="gold">HEAD</span></h1></div>
            <div className="int-nt-h2h-selectors">
                <div className="int-nt-h2h-selector">
                    <label className="int-nt-h2h-selector-label">TEAM 1</label>
                    <AutocompleteInput value={teamA} options={teamAOptions} onChange={handleTeamAChange} className="int-nt-h2h-input field-input" accentColor="#c9a84c" placeholder="Select first team..." />
                </div>
                <div className="int-nt-h2h-vs"><GitCompare size={22} /><span>VS</span></div>
                <div className="int-nt-h2h-selector">
                    <label className="int-nt-h2h-selector-label">TEAM 2</label>
                    <AutocompleteInput value={teamB} options={teamBOptions} onChange={handleTeamBChange} className="int-nt-h2h-input field-input" accentColor="#c9a84c" placeholder={teamA ? "Select opponent..." : "Select second team..."} />
                </div>
            </div>
            {!teamA || !teamB ? (
                <div className="int-nt-h2h-empty">
                    <GitCompare size={40} strokeWidth={1.2} />
                    <h3>SELECT TWO TEAMS</h3>
                    <p>{teamA ? "Choose an opponent from teams that have faced Team 1." : "Pick Team 1 first — Team 2 will show only direct opponents."}</p>
                </div>
            ) : teamA === teamB ? (
                <div className="int-nt-h2h-empty"><h3>SAME TEAM SELECTED</h3><p>Please choose two different teams.</p></div>
            ) : h2h && (
                <>
                    <div className="int-nt-h2h-scoreboard">
                        <div className="int-nt-h2h-team-block">
                            <span className="int-nt-h2h-team-name">{teamA}</span>
                            <span className="int-nt-h2h-team-stat">{h2h.aWins} W</span>
                            <span className="int-nt-h2h-team-goals">{h2h.aGf} GF · {h2h.aGa} GA</span>
                        </div>
                        <div className="int-nt-h2h-center">
                            <div className="int-nt-h2h-result-pill">{h2h.aWins} — {h2h.draws} — {h2h.bWins}</div>
                            <span className="int-nt-h2h-result-label">W · D · L</span>
                            <span className="int-nt-h2h-match-count">{h2h.rows.length} matches</span>
                        </div>
                        <div className="int-nt-h2h-team-block int-nt-h2h-team-block--away">
                            <span className="int-nt-h2h-team-name">{teamB}</span>
                            <span className="int-nt-h2h-team-stat">{h2h.bWins} W</span>
                            <span className="int-nt-h2h-team-goals">{h2h.bGf} GF · {h2h.bGa} GA</span>
                        </div>
                    </div>
                    {h2h.rows.length === 0 ? (
                        <NoData_db message="NO DIRECT MATCHES BETWEEN THESE TEAMS" />
                    ) : (
                        <div className="int-nt-table-wrap">
                            <table className="int-nt-table">
                                <thead>
                                    <tr><th>DATE</th><th>SEASON</th><th>GAME</th><th>CATEGORY</th><th>ROUND</th><th>TEAMA</th><th>SCORE</th><th>TEAMB</th><th>HOST COUNTRY</th><th>W-D-L</th></tr>
                                </thead>
                                <tbody>
                                    {h2h.rows.map((m) => (
                                        <tr key={m.ROW_ID}>
                                            <td>{m.DATE || "—"}</td>
                                            <td>{m.SEASON || "—"}</td>
                                            <td>{m.GAME || "—"}</td>
                                            <td>{m.CATEGORY || "—"}</td>
                                            <td>{m.ROUND || "—"}</td>
                                            <td><strong>{m.TEAMA}</strong></td>
                                            <td className="score">{m.TEAMASCORE ?? "—"} - {m.TEAMBSCORE ?? "—"}{m["PEN DISPLAY"] ? ` (${m["PEN DISPLAY"]})` : ""}</td>
                                            <td><strong>{m.TEAMB}</strong></td>
                                            <td>{m["HOST COUNTRY"] || "—"}</td>
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
