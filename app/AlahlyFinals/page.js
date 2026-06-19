"use client";

import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Trophy, Award, Users, UserCheck, Download, Filter } from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import { AlAhlyFinalsService } from "./Service/alahly_finals_service";
import AlAhlyFinalsDashboard from "./Dashboard/alahly_finals_dashboard";
import AlAhlyFinalsMatches from "./Matches/alahly_finals_matches";
import AlAhlyFinalsPlayers from "./Players/alahly_finals_players";
import AlAhlyFinalsChampions from "./Champions/alahly_finals_champions";
import AlAhlyFinalsManagers from "./Managers/alahly_finals_managers";
import AlAhlyFinalsFilter from "./Filters/alahly_finals_filters";
import Loading_db from "../lib/Loading_db";
import AlAhlyFinalsMatchDetails from "./MatchDetails/alahly_finals_match_details";


export default function AlAhlyFinalsDatabase() {
    const [activeTab, setActiveTab] = useState("finals_dashboard");
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const matchesListScrollY = useRef(0);

    useEffect(() => {
        fetchFinalsData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    useEffect(() => {
        if (selectedMatchId) {
            window.scrollTo(0, 0);
        }
    }, [selectedMatchId]);

    async function fetchFinalsData() {
        setLoading(true);
        try {
            const [matches, lineups, players] = await Promise.all([
                AlAhlyFinalsService.getAllFinalsMatches(),
                AlAhlyFinalsService.getAllFinalsLineups(),
                AlAhlyFinalsService.getAllFinalsPlayerDetails()
            ]);

            setMatchesData(matches);
            setLineupsData(lineups);
            setPlayersData(players);
            setFilteredData(matches);
        } catch (error) {
            console.error("Error fetching finals data:", error);
        } finally {
            setLoading(false);
        }
    }

    const renderAppContent = () => {
        switch (activeTab) {
            case "finals_dashboard":
                return <AlAhlyFinalsDashboard finalsData={filteredData} />;
            case "finals_matches":
                return (
                    <>
                        <div hidden={!!selectedMatchId}>
                            <AlAhlyFinalsMatches
                                finalsData={filteredData}
                                onSelectMatch={(id) => {
                                    matchesListScrollY.current = window.scrollY;
                                    setSelectedMatchId(id);
                                }}
                            />
                        </div>
                        {selectedMatchId && (
                            <AlAhlyFinalsMatchDetails
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
            case "finals_players":
                return <AlAhlyFinalsPlayers playersData={playersData} matchesData={matchesData} lineupsData={lineupsData} />;
            case "finals_champions":
                return <AlAhlyFinalsChampions finalsData={filteredData} />;
            case "finals_managers":
                return <AlAhlyFinalsManagers finalsData={filteredData} />;
            default:
                return null;
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSelectedMatchId(null);
    };

    return (
        <SideBar_db
            brandTitle="AHLY"
            brandSubtitle="FINALS"
            logoText="A"
            menuItems={[
                { id: 'finals_dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'finals_matches', label: 'Matches', icon: Trophy },
                { id: 'finals_champions', label: 'Champions', icon: Award },
                { id: 'finals_players', label: 'Players', icon: Users },
                { id: 'finals_managers', label: 'Managers', icon: UserCheck }
            ]}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            actions={[
                {
                    label: "FILTERS",
                    icon: Filter,
                    onClick: () => setIsFilterOpen(true),
                    className: "filter-btn",
                    title: "OPEN FILTERS"
                },
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    className: "export-btn",
                    title: "DOWNLOAD AS EXCEL"
                }
            ]}
            mobileBrandName="AHLY FINALS"
            mobileActions={[
                {
                    icon: Filter,
                    onClick: () => setIsFilterOpen(true),
                    title: "OPEN FILTERS"
                },
                {
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    title: "DOWNLOAD AS EXCEL"
                }
            ]}
        >
            <main style={{ padding: '30px 24px', maxWidth: '100%', margin: '0' }}>
                {loading ? (
                    <Loading_db subtitle="FINALS DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderAppContent()
                )}
            </main>

            <AlAhlyFinalsFilter
                data={matchesData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
