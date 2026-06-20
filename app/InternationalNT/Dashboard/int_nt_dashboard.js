"use client";

import { useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import "./int_nt_dashboard.css";

export default function IntNtDashboard({ matches }) {
    const stats = useMemo(() => {
        if (!matches?.length) return null;

        let wins = 0;
        let losses = 0;
        let draws = 0;
        let gfTotal = 0;
        let gaTotal = 0;

        matches.forEach((m) => {
            const outcome = m.OUTCOME;
            if (outcome === "W") wins++;
            else if (outcome === "L") losses++;
            else if (outcome && String(outcome).startsWith("D")) draws++;

            gfTotal += Number(m.TEAMASCORE) || 0;
            gaTotal += Number(m.TEAMBSCORE) || 0;
        });

        return { total: matches.length, wins, losses, draws, gfTotal, gaTotal };
    }, [matches]);

    if (!stats) return <NoData_db message="NO INTERNATIONAL NT MATCHES FOUND" />;

    return (
        <div className="int-nt-dashboard fade-in">
            <div className="int-nt-page-header">
                <h1>INTERNATIONAL <span className="gold">NATIONAL TEAMS</span></h1>
            </div>
            <div className="int-nt-kpi-grid">
                <div className="int-nt-kpi-card"><span className="label">MATCHES</span><span className="value">{stats.total}</span></div>
                <div className="int-nt-kpi-card"><span className="label">TEAM A WINS</span><span className="value">{stats.wins}</span></div>
                <div className="int-nt-kpi-card"><span className="label">DRAWS</span><span className="value">{stats.draws}</span></div>
                <div className="int-nt-kpi-card"><span className="label">TEAM A LOSSES</span><span className="value">{stats.losses}</span></div>
                <div className="int-nt-kpi-card"><span className="label">GOALS FOR</span><span className="value">{stats.gfTotal}</span></div>
                <div className="int-nt-kpi-card"><span className="label">GOALS AGST</span><span className="value">{stats.gaTotal}</span></div>
            </div>
        </div>
    );
}
