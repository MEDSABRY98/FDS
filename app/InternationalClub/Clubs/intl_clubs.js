"use client";

import { useMemo, useState, useEffect } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";
import IntlClubDetails from "../ClubDetails/intl_club_details";
import { exportIntlClubsToExcel, EXPORT_EVENT } from "../ExcelExport/intl_excel_export";
import "./intl_clubs.css";

export default function IntlClubClubs({ matches }) {
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");

    const clubs = useMemo(() => {
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
                    s.gf += Number(m.GF) || 0;
                    s.ga += Number(m.GA) || 0;
                } else {
                    if (outcome === "L") s.wins++;
                    else if (outcome === "W") s.losses++;
                    else if (outcome && String(outcome).startsWith("D")) s.draws++;
                    s.gf += Number(m.GA) || 0;
                    s.ga += Number(m.GF) || 0;
                }
            };
            processTeam(m["TEAM A"], true);
            processTeam(m["TEAM B"], false);
        });
        return Object.values(stats).sort((a, b) => String(a.name).localeCompare(String(b.name), "ar"));
    }, [matches]);

    const filteredClubs = useMemo(() => {
        if (!search.trim()) return clubs;
        const q = search.toLowerCase();
        return clubs.filter((c) => String(c.name).toLowerCase().includes(q));
    }, [clubs, search]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "clubs" || selected || !e.detail?.claim) return;
            e.detail.claim();
            const ok = await exportIntlClubsToExcel(e.detail.matches);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [selected]);

    if (!clubs.length) return <NoData_db message="NO CLUBS FOUND" />;

    if (selected) {
        return (
            <IntlClubDetails
                clubName={selected}
                matches={matches}
                onBack={() => setSelected(null)}
            />
        );
    }

    return (
        <div className="intl-clubs">
            <div className="intl-clubs-header">
                <h1>CLUBS</h1>
                <SearchBar_db
                    value={search}
                    onChange={setSearch}
                    placeholder="Search clubs..."
                />
            </div>
            {filteredClubs.length === 0 ? (
                <NoData_db message="NO CLUBS MATCH YOUR SEARCH" />
            ) : (
                <div className="intl-club-grid">
                    {filteredClubs.map((c) => (
                        <button key={c.name} type="button" className="intl-club-card" onClick={() => setSelected(c.name)}>
                            <strong>{c.name}</strong>
                            <span>{c.played} matches · {c.wins}W {c.draws}D {c.losses}L</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
