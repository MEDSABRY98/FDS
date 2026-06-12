"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Trophy, Calendar, Download } from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import Loading_db from "../lib/Loading_db";
import { EgyptClubTrophyService } from "./egy_c_trophy_service";
import EgyptClubTrophyDashboard from "./egy_c_trophy_dashboard";
import EgyptClubTrophySeasons from "./egy_c_trophy_seasons";

export default function EgyptClubTrophyPage() {
    const [activeTab, setActiveTab] = useState("leaderboard");
    const [trophies, setTrophies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrophyData();
    }, []);

    async function fetchTrophyData() {
        setLoading(true);
        try {
            const data = await EgyptClubTrophyService.getAllTrophies();
            setTrophies(data);
        } catch (error) {
            console.error("Failed to load trophy data:", error);
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        { id: "leaderboard", label: "Trophy Count", icon: Trophy },
        { id: "seasons", label: "Season View", icon: Calendar }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "leaderboard":
                return <EgyptClubTrophyDashboard trophies={trophies} activeTab={activeTab} />;
            case "seasons":
                return <EgyptClubTrophySeasons trophies={trophies} activeTab={activeTab} />;
            default:
                return null;
        }
    };

    const handleExportExcel = () => {
        // Dispatch global event that components listen to
        window.dispatchEvent(new CustomEvent("egypt-club-trophy-export-excel"));
    };

    return (
        <SideBar_db
            brandTitle="EGYPT"
            brandSubtitle="TROPHIES"
            logoText="ET"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={(tabId) => setActiveTab(tabId)}
            actions={[
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: handleExportExcel,
                    className: "export-btn",
                    title: "DOWNLOAD CURRENT TAB AS EXCEL"
                }
            ]}
            mobileBrandName="EGYPT CLUBS TROPHIES"
            mobileActions={[
                {
                    icon: Download,
                    onClick: handleExportExcel,
                    title: "DOWNLOAD CURRENT TAB AS EXCEL"
                }
            ]}
        >
            <main style={{ padding: "30px 24px", maxWidth: "1584px", margin: "0 auto", width: "100%" }}>
                {loading ? (
                    <Loading_db title="EGYPT CLUBS" subtitle="TROPHIES DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderTabContent()
                )}
            </main>
        </SideBar_db>
    );
}
