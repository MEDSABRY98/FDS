"use client";

import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { AhlyVZamalekService } from "./ahly_v_zamalek_service";
import AhlyVZamalekDashboard from "./ahly_v_zamalek_dashboard";
import AhlyVZamalekMatches from "./ahly_v_zamalek_matches";
import AhlyVZamalekPlayers from "./ahly_v_zamalek_players";
import AhlyVZamalekManagers from "./ahly_v_zamalek_managers";
import AhlyVZamalekFilters from "./ahly_v_zamalek_filters";

import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";

export default function AhlyVZamalekDatabase() {
    const [activeTab, setActiveTab] = useState("avz_dashboard");
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchAvZData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedMatchId, activeTab]);

    async function fetchAvZData() {
        setLoading(true);
        try {
            const [matches, lineups, players] = await Promise.all([
                AhlyVZamalekService.getAllMatches(),
                AhlyVZamalekService.getAllLineups(),
                AhlyVZamalekService.getAllPlayerDetails()
            ]);

            setMatchesData(matches);
            setLineupsData(lineups);
            setPlayersData(players);
            setFilteredData(matches);
        } catch (error) {
            console.error("Error fetching Ahly vs Zamalek data:", error);
        } finally {
            setLoading(false);
        }
    }

    const renderAppContent = () => {
        if (selectedMatchId) {
            return (
                <div style={{ padding: '40px', color: '#0a0a0a', textAlign: 'center' }}>
                    <h2 style={{ color: '#c9a84c' }}>MATCH DETAILS [ID: {selectedMatchId}]</h2>
                    <p style={{ opacity: 0.7 }}>Coming soon... Drilling down into specific derby details.</p>
                    <button
                        onClick={() => setSelectedMatchId(null)}
                        style={{ background: '#c9a84c', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '5px', marginTop: '20px', cursor: 'pointer' }}
                    >
                        BACK TO LIST
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case "avz_dashboard":
                return <AhlyVZamalekDashboard derbyData={filteredData} />;
            case "avz_matches":
                return <AhlyVZamalekMatches derbyData={filteredData} onSelectMatch={(id) => setSelectedMatchId(id)} />;
            case "avz_players":
                return <AhlyVZamalekPlayers playersData={playersData} matchesData={matchesData} lineupsData={lineupsData} />;
            case "avz_managers":
                return <AhlyVZamalekManagers derbyData={filteredData} />;

            default:
                return null;
        }
    };

    if (loading) {
        return <Loading_db title="AHLY VS ZAMALEK" subtitle="DERBY DATABASE" />;
    }

    return (
        <div className="avz-main-container" style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '100px', color: '#0a0a0a' }}>
            <nav className="avz-nav">
                <div className="avz-nav-actions">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('avz-export-excel'))}
                        title="DOWNLOAD AS EXCEL"
                        className="avz-icon-btn"
                    >
                        <Download size={16} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        title="OPEN FILTERS"
                        className="avz-icon-btn"
                    >
                        <Filter size={16} strokeWidth={3} />
                    </button>
                </div>

                <div className="avz-tabs-container">
                    {[
                        { id: 'avz_dashboard', label: 'DASHBOARD', icon: 'D' },
                        { id: 'avz_matches', label: 'MATCHES', icon: 'M' },
                        { id: 'avz_players', label: 'PLAYERS', icon: 'P' },
                        { id: 'avz_managers', label: 'MANAGERS', icon: 'M' },

                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedMatchId(null); }}
                            className={`avz-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <span className="avz-tab-icon">[{tab.icon}]</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="avz-content" style={{ padding: '30px 0', maxWidth: '1400px', margin: '0 auto' }}>

                {renderAppContent()}
            </main>

            <AhlyVZamalekFilters
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />

            <style jsx>{`
                .avz-nav {
                    position: sticky;
                    top: 0;
                    z-index: 9999;
                    background: #111;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    min-height: 74px;
                    padding: 10px 0;
                    border-bottom: 2px solid #da1b22; /* Ahly Red */
                }
                .avz-nav-actions {
                    position: absolute; left: 25px; display: flex; gap: 10px;
                }
                .avz-icon-btn {
                    background: rgba(218, 27, 34, 0.1);
                    color: #da1b22;
                    border: 1px solid rgba(218, 27, 34, 0.3);
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.4s ease;
                }
                .avz-icon-btn:hover {
                    background: rgba(218, 27, 34, 0.2);
                    color: #fff;
                }
                .avz-tabs-container {
                    display: flex; gap: 5px;
                }
                .avz-tab-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0 20px;
                    height: 54px;
                    color: rgba(255,255,255,0.45);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    transition: 0.3s;
                    border-bottom: 2px solid transparent;
                    font-family: 'Bebas Neue', sans-serif;
                    letter-spacing: 1px;
                }
                .avz-tab-btn.active {
                    color: #fff;
                    border-bottom: 2px solid #da1b22;
                }
                .avz-tab-icon {
                    font-size: 12px; opacity: 0.7;
                }
            `}</style>
        </div>
    );
}
