"use client";

import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import "./egypt_nt_h2h_details.css";
import EgyptNTH2HDashboard from "./egypt_nt_db_h2h_dashboard";
import EgyptNTH2HAges from "./egypt_nt_db_h2h_ages";
import { buildMatchContextMap } from "../ClubStats/egypt_nt_db_club_stats_utils";

export default function EgyptNTH2HDetails({ opponent, matches, playerDetails, onBack }) {
    const [activeTab, setActiveTab] = useState("dashboard");

    // Filter matches exactly for this opponent
    const opponentMatches = useMemo(() => {
        return matches.filter(m => {
            const oppName = String(m["OPPONENT TEAM"] || "").trim();
            return oppName === opponent;
        });
    }, [matches, opponent]);

    const matchContextMap = useMemo(() => buildMatchContextMap(opponentMatches), [opponentMatches]);

    return (
        <div className="h2h-details-wrap">
            <div className="h2h-details-header">
                <div className="h2h-details-title-area">
                    <span className="h2h-details-subtitle">HEAD TO HEAD DETAILS</span>
                    <h2 className="h2h-details-title">{opponent}</h2>
                </div>
                <button className="h2h-details-back-btn" onClick={onBack}>
                    <ArrowLeft size={16} /> BACK TO H2H LIST
                </button>
            </div>

            <div className="h2h-details-tabs">
                <button 
                    className={`h2h-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    DASHBOARD
                </button>
                <button 
                    className={`h2h-tab-btn ${activeTab === "ages" ? "active" : ""}`}
                    onClick={() => setActiveTab("ages")}
                >
                    AGES
                </button>
            </div>

            <div className="h2h-details-content">
                {activeTab === "dashboard" && (
                    <EgyptNTH2HDashboard 
                        opponent={opponent} 
                        matches={opponentMatches} 
                    />
                )}
                {activeTab === "ages" && (
                    <EgyptNTH2HAges 
                        matches={opponentMatches} 
                        playerDetails={playerDetails} 
                        matchContextMap={matchContextMap}
                    />
                )}
            </div>
        </div>
    );
}
