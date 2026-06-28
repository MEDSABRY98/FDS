"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import IntNtTeamDetailsMatches from "./int_nt_team_details_matches";
import IntNtTeamDetailsOpponents from "./int_nt_team_details_opponents";
import IntNtTeamDetailsHostCountries from "./int_nt_team_details_host_countries";
import IntNtTeamDetailsContinents from "./int_nt_team_details_continents";
import { buildTeamProfile } from "./int_nt_team_details_utils";
import {
    exportIntNtTeamDetailGroupedToExcel,
    exportIntNtTeamDetailMatchesToExcel,
    EXPORT_EVENT,
} from "../ExcelExport/int_nt_excel_export";
import "./int_nt_team_details.css";

const TABS = [
    { id: "matches", label: "MATCHES" },
    { id: "opponents", label: "OPPONENTS FACED" },
    { id: "host_countries", label: "HOST COUNTRIES" },
    { id: "continents", label: "CONTINENTS" },
];

export default function IntNtTeamDetails({ teamName, matches, onBack }) {
    const [activeTab, setActiveTab] = useState("matches");

    useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);

    useEffect(() => { setActiveTab("matches"); }, [teamName]);

    const profile = useMemo(() => buildTeamProfile(matches, teamName), [matches, teamName]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "teams" || !e.detail?.claim) return;
            e.detail.claim();
            let ok = false;
            const safeName = teamName.replace(/[^\w-]+/g, "_");
            if (activeTab === "matches") ok = await exportIntNtTeamDetailMatchesToExcel(teamName, profile.matches, `IntlNT_${safeName}_Matches`);
            else if (activeTab === "opponents") ok = await exportIntNtTeamDetailGroupedToExcel(teamName, profile.matches, "opponents", `IntlNT_${safeName}_Opponents`);
            else if (activeTab === "host_countries") ok = await exportIntNtTeamDetailGroupedToExcel(teamName, profile.matches, "host_countries", `IntlNT_${safeName}_HostCountries`);
            else if (activeTab === "continents") ok = await exportIntNtTeamDetailGroupedToExcel(teamName, profile.matches, "continents", `IntlNT_${safeName}_Continents`);
            e.detail.done({ ok });
        };
        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [teamName, activeTab, profile.matches]);

    if (!profile.matches.length) {
        return (
            <div className="int-nt-team-details">
                <button type="button" className="int-nt-team-details-back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
                <NoData_db message="NO MATCHES FOR THIS TEAM" />
            </div>
        );
    }

    return (
        <div className="int-nt-team-details fade-in">
            <div className="int-nt-team-details-back">
                <button type="button" className="int-nt-team-details-back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
                <h1 className="int-nt-team-details-title">{profile.name} <span className="gold">PROFILE</span></h1>
            </div>
            <div className="int-nt-team-details-summary">
                <div className="int-nt-team-details-stat"><span>P</span>{profile.played}</div>
                <div className="int-nt-team-details-stat"><span>W</span>{profile.wins}</div>
                <div className="int-nt-team-details-stat"><span>D</span>{profile.draws}</div>
                <div className="int-nt-team-details-stat"><span>L</span>{profile.losses}</div>
                <div className="int-nt-team-details-stat"><span>GF</span>{profile.gf}</div>
                <div className="int-nt-team-details-stat"><span>GA</span>{profile.ga}</div>
                <div className="int-nt-team-details-stat"><span>GD</span>{profile.gd > 0 ? `+${profile.gd}` : profile.gd}</div>
                <div className="int-nt-team-details-stat"><span>WIN%</span>{profile.winRate}%</div>
            </div>
            <div className="int-nt-team-details-tabs">
                {TABS.map((tab) => (
                    <button key={tab.id} type="button" className={`int-nt-team-details-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                ))}
            </div>
            {activeTab === "matches" && <IntNtTeamDetailsMatches teamName={teamName} matches={profile.matches} />}
            {activeTab === "opponents" && <IntNtTeamDetailsOpponents teamName={teamName} matches={profile.matches} />}
            {activeTab === "host_countries" && <IntNtTeamDetailsHostCountries teamName={teamName} matches={profile.matches} />}
            {activeTab === "continents" && <IntNtTeamDetailsContinents teamName={teamName} matches={profile.matches} />}
        </div>
    );
}
