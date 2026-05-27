import { useMemo, useState, useEffect } from "react";
import NoData_db from "../lib/NoData_db";
import "./alahly_pks_match_details.css";

export default function AlAhlyPKsMatchDetails({ matchPks, onBack }) {
    const [activeInternalTab, setActiveInternalTab] = useState("ahly_players");

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const matchInfo = matchPks[0] || {};

    const filteredKicks = useMemo(() => {
        return (matchPks || []).filter(kick => {
            switch (activeInternalTab) {
                case "ahly_players": return !!kick["AHLY PLAYER"];
                case "ahly_gks": return !!kick["AHLY GK"];
                case "opp_players": return !!kick["OPPONENT PLAYER"];
                case "opp_gks": return !!kick["OPPONENT GK"];
                default: return true;
            }
        });
    }, [matchPks, activeInternalTab]);

    const tabs = [
        { id: "ahly_players", label: "AL AHLY PLAYERS" },
        { id: "ahly_gks", label: "AL AHLY GKs" },
        { id: "opp_players", label: "OPPONENT PLAYERS" },
        { id: "opp_gks", label: "OPPONENT GKs" }
    ];

    const formatPenalties = (item) => {
        // Priority to new columns if they exist
        if (item["G-AHLY"] !== undefined && item["G-OPPONENT"] !== undefined) {
            return `${item["G-AHLY"]} - ${item["G-OPPONENT"]}`;
        }
        
        const penString = item["PKS RESULT"] || item.PKS_RESULT || item.RESULT;
        if (!penString) return "---";
        const ps = String(penString).toUpperCase();
        const numbers = ps.match(/\d+/g);
        if (!numbers || numbers.length < 2) return penString;
        let n1 = parseInt(numbers[0]);
        let n2 = parseInt(numbers[1]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);
        if (ps.includes('L')) return `${low} - ${high}`;
        return `${high} - ${low}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "---";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="pks-details-container fade-in">
            <div className="pks-details-header">
                <button className="back-btn-lux" onClick={onBack}>
                    <span className="back-icon">←</span> BACK TO LIST
                </button>
            </div>

            <div className="shootout-summary-card">
                <div className="summary-row-modern">
                    <div className="team-text-luxury">الأهلي</div>
                    <div className="result-pill-luxury">
                        {formatPenalties(matchInfo)}
                    </div>
                    <div className="team-text-luxury">{matchInfo["OPPONENT TEAM"] || matchInfo.OPPONENT}</div>
                </div>
                <div className="shootout-meta-info">
                    <div className="meta-badge starter-badge">
                        <span className="starter-val">{(matchInfo["WHO START?"] || matchInfo.WHO_START || matchInfo["بداية"] || "---").toUpperCase()}</span>
                    </div>
                    <div className="meta-badge">PKS ID: {matchInfo.PKS_ID}</div>
                    <div className="meta-badge">MATCH ID: {matchInfo.MATCH_ID}</div>
                    <div className="meta-badge">DATE: {formatDate(matchInfo.DATE)}</div>
                    <div className="meta-badge">{matchInfo.CHAMPION}</div>
                    <div className="meta-badge">{matchInfo.SEASON}</div>
                    <div className="meta-badge">{matchInfo.ROUND || matchInfo["الدور"] || ""}</div>
                    <div className={`meta-badge status-${(() => {
                        const scoreAhly = parseInt(matchInfo["G-AHLY"] || 0);
                        const scoreOpp = parseInt(matchInfo["G-OPPONENT"] || 0);
                        const resStr = String(matchInfo["PKS W-L"] || matchInfo["PKS RESULT"] || matchInfo.PKS_RESULT || matchInfo.RESULT || "").toUpperCase();
                        
                        if (resStr.includes('W')) return 'win';
                        if (resStr.includes('L')) return 'loss';
                        if (scoreAhly > scoreOpp) return 'win';
                        if (scoreOpp > scoreAhly) return 'loss';
                        return 'neutral';
                    })()}`}>
                        {(() => {
                            const scoreAhly = parseInt(matchInfo["G-AHLY"] || 0);
                            const scoreOpp = parseInt(matchInfo["G-OPPONENT"] || 0);
                            const resStr = String(matchInfo["PKS W-L"] || matchInfo["PKS RESULT"] || matchInfo.PKS_RESULT || matchInfo.RESULT || "").toUpperCase();
                            
                            if (resStr.includes('W')) return 'WIN';
                            if (resStr.includes('L')) return 'LOSS';
                            if (scoreAhly > scoreOpp) return 'WIN';
                            if (scoreOpp > scoreAhly) return 'LOSS';
                            return '---';
                        })()}
                    </div>
                </div>
            </div>

            <div className="internal-tabs-bar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`internal-tab-btn ${activeInternalTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveInternalTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="kicks-table-luxury">
                {activeInternalTab.includes('gks') ? (
                    (() => {
                        const gkData = filteredKicks[0] || {};
                        const isAhlyGk = activeInternalTab === "ahly_gks";
                        const gkName = isAhlyGk ? gkData["AHLY GK"] : gkData["OPPONENT GK"];

                        let total = filteredKicks.length;
                        let goals = 0;
                        let saves = 0;
                        let out = 0;

                        filteredKicks.forEach(k => {
                            const statusCol = isAhlyGk ? k["OPPONENT STATUS"] : k["AHLY STATUS"];
                            const howCol = isAhlyGk ? k["HOWMISS OPPONENT"] : k["HOWMISS AHLY"];

                            const statusStr = String(statusCol || "").toUpperCase();
                            const howStr = String(howCol || "").toLowerCase();

                            if (statusStr.includes('GOAL')) {
                                goals++;
                            } else if (statusStr.includes('MISS')) {
                                const saveKeys = ['حارس', 'الحارس', 'صد', 'تصدى', 'gk', 'save', 'keeper'];
                                const isSave = saveKeys.some(key => howStr.includes(key));
                                if (isSave) saves++;
                                else out++;
                            }
                        });

                        return (
                            <div className="gk-stats-wrapper fade-in">
                                <div className="gk-profile-header">
                                    <div className="gk-avatar">🧤</div>
                                    <div className="gk-name-box">
                                        <span className="gk-label">GOALKEEPER</span>
                                        <h2 className="gk-name-display">{gkName || "---"}</h2>
                                    </div>
                                </div>
                                <div className="gk-stats-grid">
                                    <div className="gk-stat-card total">
                                        <span className="s-val">{total}</span>
                                        <span className="s-lbl">TOTAL FACED</span>
                                    </div>
                                    <div className="gk-stat-card goals">
                                        <span className="s-val">{goals}</span>
                                        <span className="s-lbl">GOALS</span>
                                    </div>
                                    <div className="gk-stat-card saves">
                                        <span className="s-val">{saves}</span>
                                        <span className="s-lbl">SAVES</span>
                                    </div>
                                    <div className="gk-stat-card misses">
                                        <span className="s-val">{out}</span>
                                        <span className="s-lbl">NOT ON TARGET</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <>
                        <div className="kicks-header">
                            <div className="k-col-seq">#</div>
                            <div className="k-col-main">PLAYER</div>
                            <div className="k-col-result">RESULT</div>
                            <div className="k-col-note">HOW</div>
                        </div>
                        <div className="kicks-body">
                            {filteredKicks.length > 0 ? filteredKicks.map((kick, idx) => {
                                const isAhlyTab = activeInternalTab === "ahly_players";
                                const isOppTab = activeInternalTab === "opp_players";
                                
                                const name = isAhlyTab ? kick["AHLY PLAYER"] : (isOppTab ? kick["OPPONENT PLAYER"] : "---");
                                const status = isAhlyTab ? kick["AHLY STATUS"] : kick["OPPONENT STATUS"];
                                const how = isAhlyTab ? kick["HOWMISS AHLY"] : kick["HOWMISS OPPONENT"];

                                return (
                                    <div key={idx} className="kick-row-premium">
                                        <div className="k-col-seq">{idx + 1}</div>
                                        <div className="k-col-main">
                                            <span className="player-name-val">{name || "---"}</span>
                                        </div>
                                        <div className="k-col-result">
                                            <div className={`kick-indicator ${String(status || "").toUpperCase().includes('GOAL') ? 'goal' : 'miss'}`}>
                                                {String(status || "").toUpperCase().includes('GOAL') ? '⚽ GOAL' : '❌ MISS'}
                                            </div>
                                        </div>
                                        <div className="k-col-note">
                                            <span className="kick-note-txt">{how || ""}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <NoData_db message="NO RECORDED DATA FOR THIS CATEGORY" />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
