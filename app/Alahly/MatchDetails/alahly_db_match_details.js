"use client";

import { useMemo, useState, useEffect } from "react";
import "./alahly_db_match_details.css";
import MatchInfoTab from "./alahly_db_match_details_info";
import LineupTab from "./alahly_db_match_details_lineup";
import EventsTab from "./alahly_db_match_details_events";
import SubsTab from "./alahly_db_match_details_subs";
import MotmTab from "./alahly_db_match_details_motm";
import PksTab from "./alahly_db_match_details_pks";
import { checkIfAhly } from "./alahly_db_match_details_utils";

export default function AlAhlyMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    gkDetails,
    howPenMissed,
    onBack
}) {
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);
    const opponentName = matchInfo?.["OPPONENT TEAM"] || "";
    const hasPenaltyShootout = Boolean(String(matchInfo?.PEN || "").trim());

    useEffect(() => {
        if (activeTab === "pks" && !hasPenaltyShootout) {
            setActiveTab("info");
        }
    }, [matchId, hasPenaltyShootout, activeTab]);

    const squads = useMemo(() => {
        const ahlyLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && checkIfAhly(l.TEAM, opponentName));
        const oppLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !checkIfAhly(l.TEAM, opponentName));

        return {
            ahly: {
                starters: ahlyLineup.filter(p => p.STATU === 'اساسي'),
                subs: ahlyLineup.filter(p => p.STATU !== 'اساسي')
            },
            opp: {
                starters: oppLineup.filter(p => p.STATU === 'اساسي'),
                subs: oppLineup.filter(p => p.STATU !== 'اساسي')
            }
        };
    }, [matchId, lineupDetails, opponentName]);

    const events = useMemo(() => {
        const allEvents = [
            ...(playerDetails || []).filter(p => String(p.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'player' })),
            ...(howPenMissed || []).filter(h => String(h.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'penMiss', TYPE: 'PEN MISS' }))
        ].sort((a, b) => parseInt(a.MINUTE || 0) - parseInt(b.MINUTE || 0));

        return {
            ahly: allEvents.filter(e => checkIfAhly(e.TEAM, opponentName)),
            opp: allEvents.filter(e => !checkIfAhly(e.TEAM, opponentName)),
            chronological: allEvents
        };
    }, [matchId, playerDetails, howPenMissed, opponentName]);

    const gks = useMemo(() => ({
        ahly: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && checkIfAhly(g.TEAM, opponentName)),
        opp: (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId) && !checkIfAhly(g.TEAM, opponentName))
    }), [matchId, gkDetails, opponentName]);

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    return (
        <div className="match-center-page fade-in">
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Matche's</span>
                </button>
                <div className="match-id-badge">{matchId}</div>
            </div>

            <section className="hero-scoreboard">
                <div className="hero-overlay"></div>
                <div className="scoreboard-content">
                    <div className="team-display ahly">
                        <div className="team-logo-container">
                            <div className="logo-placeholder ahly-logo">🦅</div>
                        </div>
                        <div className="team-meta">
                            <h1 className="team-name">الأهلي</h1>
                            <span className="manager-tag">COACH: {matchInfo["AHLY MANAGER"]}</span>
                        </div>
                    </div>

                    <div className="score-hub">
                        <div className="score-main">
                            <span className="score-digit">{matchInfo.GF}</span>
                            <span className="score-divider">-</span>
                            <span className="score-digit">{matchInfo.GA}</span>
                        </div>
                        {matchInfo.PEN && <div className="pen-result">{matchInfo.PEN}</div>}
                    </div>

                    <div className="team-display opponent">
                        <div className="team-meta tr">
                            <h1 className="team-name" dir="auto">{matchInfo["OPPONENT TEAM"]}</h1>
                            <span className="manager-tag">COACH: {matchInfo["OPPONENT MANAGER"]}</span>
                        </div>
                        <div className="team-logo-container">
                            <div className="logo-placeholder opp-logo">🛡️</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="match-details-container">
                <div className="tabs-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        MATCH INFO
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'lineup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lineup')}
                    >
                        SQUAD & LINEUP
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'subs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subs')}
                    >
                        SUBS TIMELINE
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        MATCH TIMELINE
                    </button>
                    {hasPenaltyShootout && (
                        <button
                            className={`tab-btn ${activeTab === 'pks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pks')}
                        >
                            PKS
                        </button>
                    )}
                    <button
                        className={`tab-btn ${activeTab === 'motm' ? 'active' : ''}`}
                        onClick={() => setActiveTab('motm')}
                    >
                        MAN OF THE MATCH
                    </button>
                </div>

                {activeTab === 'info' && <MatchInfoTab matchInfo={matchInfo} />}

                {activeTab === 'lineup' && (
                    <LineupTab
                        matchInfo={matchInfo}
                        squads={squads}
                        events={events}
                        gks={gks}
                        opponentName={opponentName}
                        matches={matches}
                        lineupDetails={lineupDetails}
                        playerDetails={playerDetails}
                        gkDetails={gkDetails}
                    />
                )}

                {activeTab === 'subs' && <SubsTab squads={squads} />}

                {activeTab === 'events' && (
                    <EventsTab events={events} opponentName={opponentName} />
                )}

                {activeTab === 'pks' && hasPenaltyShootout && (
                    <PksTab matchId={matchId} matchInfo={matchInfo} />
                )}

                {activeTab === 'motm' && <MotmTab matchInfo={matchInfo} events={events} />}
            </div>
        </div>
    );
}
