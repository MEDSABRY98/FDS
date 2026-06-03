"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Trophy, Edit, Award, Users, UserCheck, Download, Filter } from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import { AlAhlyFinalsService } from "./alahly_finals_service";
import AlAhlyFinalsDashboard from "./alahly_finals_dashboard";
import AlAhlyFinalsMatches from "./alahly_finals_matches";
import AlAhlyFinalsPlayers from "./alahly_finals_players";
import AlAhlyFinalsChampions from "./alahly_finals_champions";
import AlAhlyFinalsManagers from "./alahly_finals_managers";
import AlAhlyFinalsEditor from "./alahly_finals_editor";
import AlAhlyFinalsFilter from "./alahly_finals_filters";
import Loading_db from "../lib/Loading_db";
import AlAhlyFinalsMatchDetails from "./alahly_finals_match_details";


export default function AlAhlyFinalsDatabase() {
    const [activeTab, setActiveTab] = useState("finals_dashboard");
    const [matchesData, setMatchesData] = useState([]);
    const [lineupsData, setLineupsData] = useState([]);
    const [playersData, setPlayersData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchFinalsData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedMatchId, activeTab]);

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
        // Handle Match Details drill-down if needed
        if (selectedMatchId) {
            return (
                <AlAhlyFinalsMatchDetails
                    matchId={selectedMatchId}
                    matches={matchesData}
                    playerDetails={playersData}
                    lineupDetails={lineupsData}
                    onBack={() => setSelectedMatchId(null)}
                />
            );
        }

        switch (activeTab) {
            case "finals_dashboard":
                return <AlAhlyFinalsDashboard finalsData={filteredData} />;
            case "finals_matches":
                return <AlAhlyFinalsMatches finalsData={filteredData} onSelectMatch={(id) => setSelectedMatchId(id)} />;
            case "finals_players":
                return <AlAhlyFinalsPlayers playersData={playersData} matchesData={matchesData} lineupsData={lineupsData} />;
            case "finals_champions":
                return <AlAhlyFinalsChampions finalsData={filteredData} />;
            case "finals_managers":
                return <AlAhlyFinalsManagers finalsData={filteredData} />;
            case "finals_editor":
                return (
                    <AlAhlyFinalsEditor
                        matchesData={matchesData}
                        lineupsData={lineupsData}
                        playersData={playersData}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <Loading_db subtitle="FINALS DATABASE" message="RETRIEVING CHAMPIONSHIPS" />;
    }


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
                { id: 'finals_editor', label: 'Editor', icon: Edit },
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
                {renderAppContent()}
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
