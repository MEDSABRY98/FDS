"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import IntNtTeamDetails from "../TeamDetails/int_nt_team_details";
import { exportIntNtTeamsToExcel, EXPORT_EVENT } from "../ExcelExport/int_nt_excel_export";
import "./int_nt_teams.css";

export default function IntNtTeams({ matches }) {
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");

    const teams = useMemo(() => {
        const stats = {};
        (matches || []).forEach((m) => {
            const processTeam = (team, isA) => {
                if (!team) return;
                if (!stats[team]) stats[team] = { name: team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
                const s = stats[team];
                s.played++;
                const outcome = m.OUTCOME;
                if (isA) {
                    if (outcome === "W") s.wins++;
                    else if (outcome === "L") s.losses++;
                    else if (outcome && String(outcome).startsWith("D")) s.draws++;
                    s.gf += Number(m.TEAMASCORE) || 0;
                    s.ga += Number(m.TEAMBSCORE) || 0;
                } else {
                    if (outcome === "L") s.wins++;
                    else if (outcome === "W") s.losses++;
                    else if (outcome && String(outcome).startsWith("D")) s.draws++;
                    s.gf += Number(m.TEAMBSCORE) || 0;
                    s.ga += Number(m.TEAMASCORE) || 0;
                }
            };
            processTeam(m.TEAMA, true);
            processTeam(m.TEAMB, false);
        });
        return Object.values(stats).sort((a, b) => String(a.name).localeCompare(String(b.name), "ar"));
    }, [matches]);

    const filteredTeams = useMemo(() => {
        if (!search.trim()) return teams;
        const q = search.toLowerCase();
        return teams.filter((c) => String(c.name).toLowerCase().includes(q));
    }, [teams, search]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "teams" || selected || !e.detail?.claim) return;
            e.detail.claim();
            const ok = await exportIntNtTeamsToExcel(e.detail.matches);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [selected]);

    if (!teams.length) return <NoData_db message="NO TEAMS FOUND" />;

    if (selected) {
        return <IntNtTeamDetails teamName={selected} matches={matches} onBack={() => setSelected(null)} />;
    }

    return (
        <div className="int-nt-teams">
            <div className="int-nt-teams-header">
                <h1>TEAMS</h1>
                <SearchBar_db value={search} onChange={setSearch} placeholder="Search teams..." />
            </div>
            {filteredTeams.length === 0 ? (
                <NoData_db message="NO TEAMS MATCH YOUR SEARCH" />
            ) : (
                <div className="int-nt-team-grid">
                    {filteredTeams.map((c) => (
                        <button key={c.name} type="button" className="int-nt-team-card" onClick={() => setSelected(c.name)}>
                            <strong>{c.name}</strong>
                            <span>{c.played} matches · {c.wins}W {c.draws}D {c.losses}L</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
