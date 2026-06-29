"use client";

import { useMemo, useState, useEffect } from "react";
import "./egypt_nt_db_match_details.css";
import MatchInfoTab from "./egypt_nt_db_match_details_info";
import LineupTab from "./egypt_nt_db_match_details_lineup";
import EventsTab from "./egypt_nt_db_match_details_events";
import SubsTab from "./egypt_nt_db_match_details_subs";
import MotmTab from "./egypt_nt_db_match_details_motm";
import PksTab from "./egypt_nt_db_match_details_pks";
import { compareTimelineEvents } from "./egypt_nt_db_match_details_utils";

export default function EgyptNTMatchDetails({
    matchId,
    matches,
    playerDetails,
    lineupDetails,
    gkDetails,
    onBack,
    onRefresh
}) {
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const matchInfo = useMemo(() => (matches || []).find(m => String(m.MATCH_ID) === String(matchId)), [matchId, matches]);
    const hasPenaltyShootout = Boolean(String(matchInfo?.PEN || "").trim());

    useEffect(() => {
        if (activeTab === "pks" && !hasPenaltyShootout) {
            setActiveTab("info");
        }
    }, [matchId, hasPenaltyShootout, activeTab]);

    const { egyptTeamName, opponentTeamName, isEgyptSide } = useMemo(() => {
        const egyptTeamName = String(matchInfo?.["Egypt TEAM"] || matchInfo?.["EGYPT TEAM"] || "منتخب مصر").trim();
        const opponentTeamName = String(matchInfo?.["OPPONENT TEAM"] || "").trim();
        const norm = (value) => String(value || "").trim().toLowerCase();

        const egyptIdentifiers = new Set([
            "egypt",
            "مصر",
            "منتخب مصر",
            "المنتخب المصري",
            norm(egyptTeamName)
        ].filter(Boolean));

        const resolveTeamSide = (teamValue) => {
            const name = String(teamValue || "").trim();
            if (!name) return null;

            const normalizedName = norm(name);
            if (opponentTeamName && normalizedName === norm(opponentTeamName)) return false;
            if (normalizedName === "opponent" && opponentTeamName) return false;
            if (egyptIdentifiers.has(normalizedName)) return true;
            return null;
        };

        const playerSideByName = new Map();
        (lineupDetails || []).forEach((lineupRow) => {
            if (String(lineupRow.MATCH_ID) !== String(matchId)) return;

            const playerName = String(lineupRow["PLAYER NAME"] || "").trim();
            if (!playerName) return;

            const side = resolveTeamSide(lineupRow.TEAM);
            if (side !== null) playerSideByName.set(playerName, side);
        });

        const isEgyptSide = (record) => {
            const byTeam = resolveTeamSide(record?.TEAM);
            if (byTeam !== null) return byTeam;

            const playerName = String(record?.["PLAYER NAME"] || "").trim();
            if (playerName && playerSideByName.has(playerName)) {
                return playerSideByName.get(playerName);
            }

            return false;
        };

        return { egyptTeamName, opponentTeamName, isEgyptSide };
    }, [matchInfo, lineupDetails, matchId]);

    const squads = useMemo(() => {
        const egyptLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && isEgyptSide(l));
        const oppLineup = (lineupDetails || []).filter(l => String(l.MATCH_ID) === String(matchId) && !isEgyptSide(l));

        return {
            egypt: {
                starters: egyptLineup.filter(p => p.STATU === 'اساسي'),
                subs: egyptLineup.filter(p => p.STATU !== 'اساسي')
            },
            opp: {
                starters: oppLineup.filter(p => p.STATU === 'اساسي'),
                subs: oppLineup.filter(p => p.STATU !== 'اساسي')
            }
        };
    }, [matchId, lineupDetails, isEgyptSide]);

    const events = useMemo(() => {
        const allEvents = [
            ...(playerDetails || []).filter(p => String(p.MATCH_ID) === String(matchId)).map(e => ({ ...e, eventType: 'player' })),
        ].sort(compareTimelineEvents);

        return {
            egypt: allEvents.filter(e => isEgyptSide(e)),
            opp: allEvents.filter(e => !isEgyptSide(e)),
            chronological: allEvents
        };
    }, [matchId, playerDetails, isEgyptSide]);

    const gks = useMemo(() => {
        const matchGks = (gkDetails || []).filter(g => String(g.MATCH_ID) === String(matchId));
        const sortGks = (list) => [...list].sort((a, b) => {
            const aStarter = String(a.STATU || "").trim() === "اساسي" ? 0 : 1;
            const bStarter = String(b.STATU || "").trim() === "اساسي" ? 0 : 1;
            return aStarter - bStarter;
        });

        return {
            egypt: sortGks(matchGks.filter(g => isEgyptSide(g))),
            opp: sortGks(matchGks.filter(g => !isEgyptSide(g)))
        };
    }, [matchId, gkDetails, isEgyptSide]);

    if (!matchInfo) return <div className="error-state">Match record not located.</div>;

    return (
        <div className="match-center-page fade-in">
            <div className="match-nav">
                <button className="btn-back" onClick={onBack}>
                    <span className="icon">←</span>
                    <span className="text">All Matches</span>
                </button>
                <div className="match-id-badge">{matchId}</div>
            </div>

            <section className="hero-scoreboard">
                <div className="hero-overlay"></div>
                <div className="scoreboard-content">
                    <div className="team-display egypt">
                        <div className="team-logo-container">
                            <div className="logo-placeholder egypt-logo">🇪🇬</div>
                        </div>
                        <div className="team-meta">
                            <h1 className="team-name">{egyptTeamName}</h1>
                            <span className="manager-tag">COACH: {matchInfo["EGYPT MANAGER"]}</span>
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
                            <h1 className="team-name" dir="auto">{opponentTeamName}</h1>
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
                        egyptTeamName={egyptTeamName}
                        opponentTeamName={opponentTeamName}
                        squads={squads}
                        events={events}
                        gks={gks}
                    />
                )}

                {activeTab === 'subs' && <SubsTab squads={squads} />}

                {activeTab === 'events' && (
                    <EventsTab
                        matchId={matchId}
                        playerDetails={playerDetails}
                        events={events}
                        isEgyptSide={isEgyptSide}
                        onRefresh={onRefresh}
                    />
                )}

                {activeTab === 'pks' && hasPenaltyShootout && (
                    <PksTab matchId={matchId} matchInfo={matchInfo} />
                )}

                {activeTab === 'motm' && <MotmTab matchInfo={matchInfo} events={events} />}
            </div>
        </div>
    );
}
