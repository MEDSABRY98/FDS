/* d:\FDS\Football Database\app\CheckData\egy_NT_Check.js */
"use client";

import { useState } from "react";
import { Sparkles, BarChart2, ShieldAlert } from "lucide-react";
import EgyptScoreCheck from "./egy_NT_ScoreCheck";

export default function EgyptNTCheckWorkspace() {
    const [activeReportId, setActiveReportId] = useState(null);

    const reportsList = [
        {
            id: "score_check",
            title: "Score vs. Scorers Mismatch",
            description: "Compares goals recorded in match details (GF/GA) with actual scorer details in player events, including own goals (OG). Flags mismatched matches.",
            badge: "Active",
            status: "active"
        }
    ];

    if (activeReportId === "score_check") {
        return <EgyptScoreCheck onBack={() => setActiveReportId(null)} />;
    }

    return (
        <div style={{ animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ marginBottom: "32px" }}>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                    EGYPT NT DATA INTEGRITY WORKSPACE
                </h2>
            </div>

            <div className="check-reports-grid">
                {reportsList.map((rep) => {
                    const isSoon = rep.status === "soon";
                    return (
                        <div 
                            key={rep.id} 
                            className={`check-report-card ${isSoon ? "disabled" : ""}`}
                            onClick={() => !isSoon && setActiveReportId(rep.id)}
                        >
                            <div>
                                <div className="check-report-header">
                                    <span className={`check-report-badge ${isSoon ? "soon" : "active"}`}>
                                        {rep.badge}
                                    </span>
                                    {!isSoon ? <ShieldAlert size={18} color="#C8102E" /> : <BarChart2 size={18} color="#94a3b8" />}
                                </div>
                                <h3 className="check-report-title" style={{ marginBottom: 0 }}>{rep.title}</h3>
                            </div>
                            
                            {!isSoon && (
                                <div className="check-report-footer">
                                    <span>Run Validation →</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
