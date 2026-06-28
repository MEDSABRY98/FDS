"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard, Trophy, Users, Globe, GitCompare, Plus, Download, Filter, Award,
} from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import Loading_db from "../lib/Loading_db";
import { useNotification } from "../lib/Notification_db";
import { IntlClubService } from "./Service/intl_service";
import IntlClubDashboard from "./Dashboard/intl_dashboard";
import IntlClubMatches from "./Matches/intl_matches";
import IntlClubAddMatches from "./AddMatches/intl_add_matches";
import IntlClubClubs from "./Clubs/intl_clubs";
import IntlClubCompetitions from "./Competitions/intl_competitions";
import IntlClubContinents from "./Continents/intl_continents";
import IntlClubH2H from "./HeadToHead/intl_h2h";
import IntlClubFilters from "./Filters/intl_filters";
import { exportIntlByTab, EXPORT_EVENT } from "./ExcelExport/intl_excel_export";
import "./Dashboard/intl_dashboard.css";
import "./Clubs/intl_clubs.css";

export default function InternationalClubPage() {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState("dashboard");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData(silent = false) {
        if (!silent) setLoading(true);
        try {
            const data = await IntlClubService.getAllMatches();
            setMatches(data);
            setFilteredMatches(data);
        } catch (error) {
            console.error("Failed to load international club data:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "matches", label: "Matches", icon: Trophy },
        { id: "add_matches", label: "Add Matches", icon: Plus },
        { id: "clubs", label: "Clubs", icon: Users },
        { id: "competitions", label: "Competitions", icon: Award },
        { id: "continents", label: "Continents", icon: Globe },
        { id: "h2h", label: "H2H", icon: GitCompare },
    ];

    const handleExport = async () => {
        if (activeTab === "add_matches") {
            addNotification("Nothing to export on this tab.", "warn");
            return;
        }

        let claimed = false;

        const result = await new Promise((resolve) => {
            window.dispatchEvent(new CustomEvent(EXPORT_EVENT, {
                detail: {
                    activeTab,
                    matches: filteredMatches,
                    claim: () => { claimed = true; },
                    done: (payload) => resolve({ handled: true, ok: !!payload?.ok, message: payload?.message || "No data to export." }),
                },
            }));

            queueMicrotask(async () => {
                if (!claimed) {
                    const ok = await exportIntlByTab(activeTab, filteredMatches);
                    resolve({ handled: false, ok, message: "No data to export." });
                }
            });
        });

        if (result.ok) addNotification("Excel exported.", "success");
        else addNotification(result.message, "warn");
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <IntlClubDashboard matches={filteredMatches} />;
            case "matches":
                return <IntlClubMatches matches={filteredMatches} />;
            case "add_matches":
                return <IntlClubAddMatches matches={matches} onRefresh={() => fetchData(true)} />;
            case "clubs":
                return <IntlClubClubs matches={filteredMatches} />;
            case "competitions":
                return <IntlClubCompetitions matches={filteredMatches} />;
            case "continents":
                return <IntlClubContinents matches={filteredMatches} />;
            case "h2h":
                return <IntlClubH2H matches={filteredMatches} />;
            default:
                return null;
        }
    };

    return (
        <SideBar_db
            brandTitle="INTL"
            brandSubtitle="CLUBS"
            logoText="IC"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            actions={[
                { label: "EXPORT TO EXCEL", icon: Download, onClick: handleExport, className: "export-btn", title: "DOWNLOAD AS EXCEL" },
                { label: "FILTERS", icon: Filter, onClick: () => setIsFilterOpen(true), className: "filter-btn", title: "OPEN FILTERS" },
            ]}
            mobileBrandName="INTERNATIONAL CLUBS"
            mobileActions={[
                { icon: Download, onClick: handleExport, title: "EXPORT" },
                { icon: Filter, onClick: () => setIsFilterOpen(true), title: "FILTERS" },
            ]}
        >
            <main style={{ padding: "30px 24px", maxWidth: "1584px", margin: "0 auto", width: "100%" }}>
                {loading && activeTab !== "add_matches" ? (
                    <Loading_db title="INTERNATIONAL" subtitle="CLUBS DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderContent()
                )}
            </main>

            <IntlClubFilters
                data={matches}
                onFilter={setFilteredMatches}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
