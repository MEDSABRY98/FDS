"use client";
import React, { useState, useMemo } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function EgyptNTPKSGkDetailsMatches({ gkKicks }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredKicks = useMemo(() => {
        if (!searchTerm) return gkKicks;
        const lower = searchTerm.toLowerCase();
        return gkKicks.filter(k => 
            (k.taker || "").toLowerCase().includes(lower) ||
            (k.opponentTeam || "").toLowerCase().includes(lower) ||
            (k.SEASON || "").toLowerCase().includes(lower) ||
            (k.DISPLAY_ID || "").toLowerCase().includes(lower)
        );
    }, [gkKicks, searchTerm]);
    const formatDate = (dateStr) => {
        if (!dateStr) return "---";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) { return dateStr; }
    };

    return (
        <div>
            <div style={{ margin: '0 auto 20px auto', maxWidth: '450px' }}>
                <SearchBar_db 
                    value={searchTerm} 
                    onChange={setSearchTerm} 
                    placeholder="Search by Player, Team, Season..." 
                />
            </div>
            <div className="kicks-table-luxury">
            <div className="kicks-header" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="k-col-seq" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>#</div>
                <div style={{ width: 110, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>PKS ID</div>
                <div style={{ width: 110, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>DATE</div>
                <div style={{ width: 160, flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>SEASON</div>
                <div className="k-col-main" style={{ flex: 1.5, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>TAKER</div>
                <div className="k-col-main" style={{ flex: 1.2, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>OPPONENT TEAM</div>
                <div className="k-col-result" style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>RESULT</div>
                <div className="k-col-note" style={{ flex: 0.8, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>HOW</div>
            </div>
            <div className="kicks-body">
                {filteredKicks.length === 0 ? (
                    <NoData_db message="NO KICK DATA FOUND" />
                ) : (
                    filteredKicks.map((kick, idx) => {
                        const isGoal = String(kick.status || "").toUpperCase().includes('GOAL') || String(kick.status || "").toUpperCase() === 'G';
                        return (
                            <div key={idx} className="kick-row-premium" style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="k-col-seq" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{idx + 1}</div>
                                <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#999', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{kick.DISPLAY_ID}</div>
                                <div style={{ width: 110, flexShrink: 0, fontSize: 14, fontFamily: 'inherit', color: '#333', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{formatDate(kick.DATE)}</div>
                                <div style={{ width: 160, flexShrink: 0, fontSize: 14, fontFamily: 'inherit', color: '#333', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{kick.SEASON || "---"}</div>
                                <div className="k-col-main" style={{ flex: 1.5, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <span className="player-name-val">{kick.taker || "---"}</span>
                                </div>
                                <div className="k-col-main" style={{ flex: 1.2, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <span className="player-name-val" style={{ color: '#555', fontWeight: '500', fontSize: '15px' }}>{kick.opponentTeam || "---"}</span>
                                </div>
                                <div className="k-col-result" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div className={`kick-indicator ${isGoal ? 'goal' : 'miss'}`}>
                                        {isGoal ? '⚽ GOAL' : (kick.isSave ? '🧤 SAVED' : '❌ MISSED')}
                                    </div>
                                </div>
                                <div className="k-col-note" style={{ flex: 0.8, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <span className="kick-note-txt">{kick.howMiss || ""}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
        </div>
    );
}
