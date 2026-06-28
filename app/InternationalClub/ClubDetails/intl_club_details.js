"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import NoData_db from "../../lib/NoData_db";
import IntlClubDetailsMatches from "./intl_club_details_matches";
import IntlClubDetailsOpponents from "./intl_club_details_opponents";
import IntlClubDetailsCountries from "./intl_club_details_countries";
import IntlClubDetailsContinents from "./intl_club_details_continents";
import { buildClubProfile } from "./intl_club_details_utils";
import {
    exportIntlClubDetailGroupedToExcel,
    exportIntlClubDetailMatchesToExcel,
    EXPORT_EVENT,
} from "../ExcelExport/intl_excel_export";
import "./intl_club_details.css";

const TABS = [
    { id: "matches", label: "MATCHES" },
    { id: "opponents", label: "OPPONENTS FACED" },
    { id: "countries", label: "COUNTRIES" },
    { id: "continents", label: "CONTINENTS" },
];

export default function IntlClubDetails({ clubName, matches, onBack }) {
    const [activeTab, setActiveTab] = useState("matches");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    useEffect(() => {
        setActiveTab("matches");
    }, [clubName]);

    const profile = useMemo(() => buildClubProfile(matches, clubName), [matches, clubName]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.detail?.activeTab !== "clubs" || !e.detail?.claim) return;
            e.detail.claim();

            let ok = false;
            const safeName = clubName.replace(/[^\w-]+/g, "_");

            if (activeTab === "matches") {
                ok = await exportIntlClubDetailMatchesToExcel(clubName, profile.matches, `IntlClubs_${safeName}_Matches`);
            } else if (activeTab === "opponents") {
                ok = await exportIntlClubDetailGroupedToExcel(clubName, profile.matches, "opponents", `IntlClubs_${safeName}_Opponents`);
            } else if (activeTab === "countries") {
                ok = await exportIntlClubDetailGroupedToExcel(clubName, profile.matches, "countries", `IntlClubs_${safeName}_Countries`);
            } else if (activeTab === "continents") {
                ok = await exportIntlClubDetailGroupedToExcel(clubName, profile.matches, "continents", `IntlClubs_${safeName}_Continents`);
            }

            e.detail.done({ ok });
        };

        window.addEventListener(EXPORT_EVENT, handler);
        return () => window.removeEventListener(EXPORT_EVENT, handler);
    }, [clubName, activeTab, profile.matches]);

    if (!profile.matches.length) {
        return (
            <div className="intl-club-details">
                <button type="button" className="intl-club-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <NoData_db message="NO MATCHES FOR THIS CLUB" />
            </div>
        );
    }

    return (
        <div className="intl-club-details fade-in">
            <div className="intl-club-details-back">
                <button type="button" className="intl-club-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <h1 className="intl-club-details-title">
                    {profile.name} <span className="gold">PROFILE</span>
                </h1>
            </div>

            <div className="intl-club-details-summary">
                <div className="intl-club-details-stat"><span>P</span>{profile.played}</div>
                <div className="intl-club-details-stat"><span>W</span>{profile.wins}</div>
                <div className="intl-club-details-stat"><span>D</span>{profile.draws}</div>
                <div className="intl-club-details-stat"><span>L</span>{profile.losses}</div>
                <div className="intl-club-details-stat"><span>GF</span>{profile.gf}</div>
                <div className="intl-club-details-stat"><span>GA</span>{profile.ga}</div>
                <div className="intl-club-details-stat"><span>GD</span>{profile.gd > 0 ? `+${profile.gd}` : profile.gd}</div>
                <div className="intl-club-details-stat"><span>WIN%</span>{profile.winRate}%</div>
            </div>

            <div className="intl-club-details-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`intl-club-details-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "matches" && (
                <IntlClubDetailsMatches clubName={clubName} matches={profile.matches} />
            )}
            {activeTab === "opponents" && (
                <IntlClubDetailsOpponents clubName={clubName} matches={profile.matches} />
            )}
            {activeTab === "countries" && (
                <IntlClubDetailsCountries clubName={clubName} matches={profile.matches} />
            )}
            {activeTab === "continents" && (
                <IntlClubDetailsContinents clubName={clubName} matches={profile.matches} />
            )}
        </div>
    );
}
