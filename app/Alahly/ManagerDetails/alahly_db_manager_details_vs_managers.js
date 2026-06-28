"use client";

import { useMemo, useState } from "react";
import NoData_db from "../../lib/NoData_db";
import SearchBar_db from "../../lib/SearchBar_db";

export default function Manager_VsManagers_Module({ stats, managerStatus }) {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState(managerStatus === "alahly" ? "AHLY" : "OPPONENT");

    const mgrStore = role === "AHLY"
        ? (stats.statsByOpponentManager || {})
        : (stats.statsAsFacingAhlyMgr || {});

    const mgrNames = useMemo(() => {
        return Object.keys(mgrStore)
            .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (mgrStore[b].matches - mgrStore[a].matches) || a.localeCompare(b));
    }, [mgrStore, search]);

    const totals = useMemo(() => (
        mgrNames.reduce((acc, name) => {
            const s = mgrStore[name];
            acc.matches += s.matches;
            acc.wins += s.wins;
            acc.draws += s.draws;
            acc.losses += s.losses;
            acc.gs += s.gs;
            acc.ga += s.ga;
            acc.csFor += s.csFor;
            acc.csAgainst += s.csAgainst;
            return acc;
        }, { matches: 0, wins: 0, draws: 0, losses: 0, gs: 0, ga: 0, csFor: 0, csAgainst: 0 })
    ), [mgrStore, mgrNames]);

    return (
        <div className="history-section fade-in">
            <div className="history-title" style={{ marginBottom: "15px" }}>MANAGER PERFORMANCE VS MANAGERS</div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px", gap: "20px" }}>
                <div className="role-switcher-modern" style={{ display: "flex", background: "#f5f5f5", padding: "5px", borderRadius: "15px", border: "1px solid #eee" }}>
                    <button
                        onClick={() => setRole("AHLY")}
                        className={`role-btn ${role === "AHLY" ? "active" : ""}`}
                        style={{ padding: "10px 25px", borderRadius: "12px", border: "none", background: role === "AHLY" ? "var(--player-gold)" : "transparent", color: role === "AHLY" ? "#000" : "#888", fontFamily: "Space Mono", fontSize: "11px", fontWeight: "800", cursor: "pointer", transition: "0.3s" }}
                    >
                        AS AHLY MANAGER
                    </button>
                    <button
                        onClick={() => setRole("OPPONENT")}
                        className={`role-btn ${role === "OPPONENT" ? "active" : ""}`}
                        style={{ padding: "10px 25px", borderRadius: "12px", border: "none", background: role === "OPPONENT" ? "var(--player-gold)" : "transparent", color: role === "OPPONENT" ? "#000" : "#888", fontFamily: "Space Mono", fontSize: "11px", fontWeight: "800", cursor: "pointer", transition: "0.3s" }}
                    >
                        AS OPPONENT MANAGER
                    </button>
                </div>

                <div style={{ width: "100%", maxWidth: "450px" }}>
                    <SearchBar_db
                        value={search}
                        onChange={setSearch}
                        placeholder={role === "AHLY" ? "SEARCH OPPONENT MANAGER..." : "SEARCH AHLY MANAGER..."}
                    />
                </div>
            </div>

            <div style={{ overflowX: "auto" }}>
                {mgrNames.length === 0 ? (
                    <NoData_db
                        message={role === "AHLY"
                            ? "No manager matches as Al Ahly manager found."
                            : "No matches as opponent manager (against Al Ahly) found."
                        }
                    />
                ) : (
                    <table className="player-match-table vs-teams-table" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "28%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "9%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>
                                    {role === "AHLY" ? "OPPONENT MANAGER" : "AHLY MANAGER"}
                                </th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>MATCHES</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>W</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>D</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>L</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>WIN %</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>GS-GA</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>CS FOR</th>
                                <th style={{ textAlign: "center", fontFamily: "Space Mono", fontSize: "13px", letterSpacing: "2px", color: "#999", padding: "15px 10px", textTransform: "uppercase", fontWeight: "700" }}>CS AGAINST</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mgrNames.map((name) => {
                                const s = mgrStore[name];
                                const wr = s.matches > 0 ? ((s.wins / s.matches) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={name}>
                                        <td style={{ fontWeight: "800", color: "var(--player-dark)", fontSize: "15px", fontFamily: "Outfit" }}>
                                            {name}
                                        </td>
                                        <td style={{ textAlign: "center", fontFamily: "Outfit", fontWeight: "900", fontSize: "18px", color: "var(--player-gold)" }}>{s.matches || "-"}</td>
                                        <td style={{ textAlign: "center", color: "#2ecc71", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{s.wins || "-"}</td>
                                        <td style={{ textAlign: "center", color: "#e67e22", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{s.draws || "-"}</td>
                                        <td style={{ textAlign: "center", color: "#e74c3c", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{s.losses || "-"}</td>
                                        <td style={{ textAlign: "center", color: "var(--player-dark)", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{wr}%</td>
                                        <td style={{ textAlign: "center", fontFamily: "Space Mono", fontWeight: "800", fontSize: "14px" }}>{s.gs} - {s.ga}</td>
                                        <td style={{ textAlign: "center", color: "#2ecc71", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{s.csFor || "-"}</td>
                                        <td style={{ textAlign: "center", color: "#e74c3c", fontWeight: "900", fontSize: "18px", fontFamily: "Outfit" }}>{s.csAgainst || "-"}</td>
                                    </tr>
                                );
                            })}
                            <tr style={{ background: "rgba(201, 168, 76, 0.05)", borderTop: "2px solid var(--player-gold)" }}>
                                <td style={{ fontWeight: "900", color: "var(--player-gold)", textTransform: "uppercase", letterSpacing: "2px", fontSize: "14px", fontFamily: "Outfit" }}>TOTAL</td>
                                <td style={{ textAlign: "center", fontFamily: "Outfit", fontWeight: "900", fontSize: "20px" }}>{totals.matches || "-"}</td>
                                <td style={{ textAlign: "center", color: "#2ecc71", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>{totals.wins || "-"}</td>
                                <td style={{ textAlign: "center", color: "#e67e22", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>{totals.draws || "-"}</td>
                                <td style={{ textAlign: "center", color: "#ff6b6b", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>{totals.losses || "-"}</td>
                                <td style={{ textAlign: "center", color: "var(--player-gold)", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>
                                    {totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ textAlign: "center", fontFamily: "Space Mono", fontWeight: "900", fontSize: "15px" }}>{totals.gs} - {totals.ga}</td>
                                <td style={{ textAlign: "center", color: "#2ecc71", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>{totals.csFor || "-"}</td>
                                <td style={{ textAlign: "center", color: "#ff6b6b", fontWeight: "900", fontSize: "20px", fontFamily: "Outfit" }}>{totals.csAgainst || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
            <style jsx>{`
                .role-btn:hover:not(.active) {
                    background: rgba(201, 168, 76, 0.1) !important;
                    color: #000 !important;
                }
            `}</style>
        </div>
    );
}
