"use client";

import { formatMatchDate } from "./egypt_nt_db_match_details_utils";

export default function MatchInfoTab({ matchInfo }) {
    return (
        <div className="match-info-tab-content fade-in">
            <div className="info-grid">
                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-card-icon">🏆</span>
                        <h3>Competition Details</h3>
                    </div>
                    <div className="info-card-body">
                        <div className="info-row">
                            <span className="info-label">DATE</span>
                            <span className="info-value">{formatMatchDate(matchInfo.DATE)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">CHAMPION</span>
                            <span className="info-value">{matchInfo.CHAMPION || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">SEASON</span>
                            <span className="info-value">{matchInfo.SEASON || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ROUND</span>
                            <span className="info-value">{matchInfo.ROUND || "—"}</span>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-card-icon">📍</span>
                        <h3>Venue & Logistics</h3>
                    </div>
                    <div className="info-card-body">
                        <div className="info-row">
                            <span className="info-label">PLACE (STADIUM)</span>
                            <span className="info-value">{matchInfo.PLACE || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">H-A-N (VENUE STATUS)</span>
                            <span className="info-value">
                                {matchInfo["H-A-N"] === "H" ? "Home" :
                                 matchInfo["H-A-N"] === "A" ? "Away" :
                                 matchInfo["H-A-N"] === "N" ? "Neutral" : matchInfo["H-A-N"] || "—"}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">AGE GROUP</span>
                            <span className="info-value">{matchInfo.AGE || "—"}</span>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-card-icon">👔</span>
                        <h3>Officials & Staff</h3>
                    </div>
                    <div className="info-card-body">
                        <div className="info-row">
                            <span className="info-label">EGYPT MANAGER</span>
                            <span className="info-value">{matchInfo["EGYPT MANAGER"] || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">OPPONENT MANAGER</span>
                            <span className="info-value">{matchInfo["OPPONENT MANAGER"] || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">REFEREE</span>
                            <span className="info-value">{matchInfo.REFREE || "—"}</span>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-card-icon">⚙️</span>
                        <h3>System Details</h3>
                    </div>
                    <div className="info-card-body">
                        <div className="info-row">
                            <span className="info-label">CHAMPION SYSTEM</span>
                            <span className="info-value">{matchInfo.CHAMPION_SYSTEM || "—"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">EXTRA TIME (ET)</span>
                            <span className="info-value">{matchInfo.ET ? "Yes" : "No"}</span>
                        </div>
                        {matchInfo.PEN && (
                            <div className="info-row">
                                <span className="info-label">PENALTY SHOOTOUT</span>
                                <span className="info-value" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{matchInfo.PEN}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {matchInfo.NOTE && (
                <div className="info-note-section">
                    <h3>📝 Match Notes</h3>
                    <p>{matchInfo.NOTE}</p>
                </div>
            )}
        </div>
    );
}
