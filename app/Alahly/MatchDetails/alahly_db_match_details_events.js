"use client";

import NoData_db from "../../lib/NoData_db";
import { formatHowPenMissedForDisplay } from "../Penalties/alahly_db_penalties_utils";
import { checkIfAhly, getEventIcon } from "./alahly_db_match_details_utils";

export default function EventsTab({ events, opponentName }) {
    return (
        <div className="timeline-view">
            <div className="timeline-container">
                {events.chronological.length === 0 ? (
                    <NoData_db message="No specific match events recorded for this game." />
                ) : (
                    <div className="timeline-track">
                        {events.chronological.map((e, i) => {
                            const isAhly = checkIfAhly(e.TEAM, opponentName);
                            const typeUpper = String(e.TYPE || "").trim().toUpperCase();
                            const isSpecialPen = ['PENASSISTGOAL', 'PENASSISTMISSED', 'PENMAKEGOAL', 'PENMAKEMISSED'].includes(typeUpper);
                            return (
                                <div key={i} className={`timeline-entry ${isAhly ? 'left' : 'right'}`}>
                                    <div className={`entry-content ${isSpecialPen ? 'special-pen-card' : ''}`}>
                                        <div className="entry-time">{e.MINUTE}'</div>
                                        <div className="entry-details">
                                            {!isSpecialPen && <span className="entry-icon">{getEventIcon(e.TYPE)}</span>}
                                            <div className="entry-text">
                                                <span className="entry-player">{e["PLAYER NAME"]}</span>
                                                {isSpecialPen ? (
                                                    <span className={`pen-type-badge ${
                                                        typeUpper === 'PENASSISTGOAL' ? 'pen-assist-goal' :
                                                        typeUpper === 'PENASSISTMISSED' ? 'pen-assist-missed' :
                                                        typeUpper === 'PENMAKEGOAL' ? 'pen-make-goal' :
                                                        'pen-make-missed'
                                                    }`}>
                                                        {typeUpper}
                                                    </span>
                                                ) : !e["HOW MISSED?"] ? (
                                                    <span className="entry-type">
                                                        {e.TYPE}
                                                        {e.TYPE_SUB && <span style={{ color: '#ff5252', fontStyle: 'normal' }}> / {e.TYPE_SUB}</span>}
                                                    </span>
                                                ) : (
                                                    <span className="entry-note">HOW MISSED: {formatHowPenMissedForDisplay(e["HOW MISSED?"])}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="timeline-dot"></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
