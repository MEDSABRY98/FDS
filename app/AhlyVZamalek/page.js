"use client";

import { useState, useEffect, useRef } from "react";
import {
    Download,
    SlidersHorizontal,
    LayoutDashboard,
    Trophy,
    Users,
    User,
    Award
} from "lucide-react";
import Link from "next/link";
import { AhlyVZamalekService } from "./Service/ahly_v_zamalek_service";
import AhlyVZamalekDashboard from "./Dashboard/ahly_v_zamalek_dashboard";
import AhlyVZamalekMatches from "./Matches/ahly_v_zamalek_matches";
import AhlyVZamalekChampions from "./Champions/ahly_v_zamalek_champions";
import AhlyVZamalekPlayers from "./Players/ahly_v_zamalek_players";
import AhlyVZamalekManagers from "./Managers/ahly_v_zamalek_managers";
import AhlyVZamalekFilters from "./Filters/ahly_v_zamalek_filters";
import AhlyVZamalekMatchDetails from "./MatchDetails/ahly_v_zamalek_match_details";
import AhlyVZamalekPlayerDetails from "./PlayerDetails/ahly_v_zamalek_player_details";
import AhlyVZamalekManagerDetails from "./ManagerDetails/ahly_v_zamalek_manager_details";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
import SideBar_db from "../lib/SideBar_db";

export default function AhlyVZamalekDatabase() {
    const [activeTab, setActiveTab] = useState("avz_dashboard");
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState(null);
    const [selectedManagerName, setSelectedManagerName] = useState(null);
    const [selectedManagerStatus, setSelectedManagerStatus] = useState("alahly");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const matchesListScrollY = useRef(0);

    const tabs = [
        { id: 'avz_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'avz_matches', label: 'Matches', icon: Trophy },
        { id: 'avz_champions', label: 'Champions', icon: Award },
        { id: 'avz_players', label: 'Players', icon: Users },
        { id: 'avz_managers', label: 'Managers', icon: User }
    ];

    useEffect(() => {
        fetchAvZData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    useEffect(() => {
        if (selectedMatchId || selectedPlayerName || selectedManagerName) {
            window.scrollTo(0, 0);
        }
    }, [selectedMatchId, selectedPlayerName, selectedManagerName]);

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
        if (selectedPlayerName) {
            return (
                <AhlyVZamalekPlayerDetails
                    playerName={selectedPlayerName}
                    playerDetails={playersData}
                    lineupDetails={lineupsData}
                    masterMatches={matchesData}
                    onBack={() => setSelectedPlayerName(null)}
                />
            );
        }

        if (selectedManagerName) {
            return (
                <AhlyVZamalekManagerDetails
                    managerName={selectedManagerName}
                    managerStatus={selectedManagerStatus}
                    masterMatches={matchesData}
                    onBack={() => setSelectedManagerName(null)}
                    playerDetails={playersData}
                    lineupDetails={lineupsData}
                />
            );
        }

        switch (activeTab) {
            case "avz_dashboard":
                return <AhlyVZamalekDashboard derbyData={filteredData} />;
            case "avz_matches":
                return (
                    <>
                        <div hidden={!!selectedMatchId}>
                            <AhlyVZamalekMatches
                                derbyData={filteredData}
                                onSelectMatch={(id) => {
                                    matchesListScrollY.current = window.scrollY;
                                    setSelectedMatchId(id);
                                }}
                            />
                        </div>
                        {selectedMatchId && (
                            <AhlyVZamalekMatchDetails
                                matchId={selectedMatchId}
                                matches={matchesData}
                                playerDetails={playersData}
                                lineupDetails={lineupsData}
                                onBack={() => {
                                    setSelectedMatchId(null);
                                    requestAnimationFrame(() => {
                                        requestAnimationFrame(() => {
                                            window.scrollTo({ top: matchesListScrollY.current, left: 0 });
                                        });
                                    });
                                }}
                            />
                        )}
                    </>
                );
            case "avz_champions":
                return <AhlyVZamalekChampions derbyData={filteredData} />;
            case "avz_players":
                return (
                    <AhlyVZamalekPlayers
                        playersData={playersData}
                        matchesData={matchesData}
                        lineupsData={lineupsData}
                        onSelectPlayer={(name) => setSelectedPlayerName(name)}
                    />
                );
            case "avz_managers":
                return (
                    <AhlyVZamalekManagers
                        derbyData={filteredData}
                        lineupDetails={lineupsData}
                        playerDetails={playersData}
                        onSelectManager={(name, team) => {
                            setSelectedManagerName(name);
                            setSelectedManagerStatus(team === "الأهلي" ? "alahly" : "opponent");
                        }}
                    />
                );
            default:
                return null;
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSelectedMatchId(null);
        setSelectedPlayerName(null);
        setSelectedManagerName(null);
    };

    return (
        <SideBar_db
            brandTitle="AHLY VS"
            brandSubtitle="ZAMALEK"
            logoText="V"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            actions={[
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('avz-export-excel')),
                    className: "export-btn",
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    label: "FILTERS",
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    className: "filter-btn",
                    title: "OPEN DATABASE FILTERS"
                }
            ]}
            mobileBrandName="AHLY VS ZAMALEK"
            mobileActions={[
                {
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('avz-export-excel')),
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    title: "OPEN DATABASE FILTERS"
                }
            ]}
        >
            <main className="alahly-content-viewport" style={{ padding: '40px 24px 24px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                {loading ? (
                    <Loading_db title="AHLY VS ZAMALEK" subtitle="DERBY DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderAppContent()
                )}
            </main>

            <AhlyVZamalekFilters
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
