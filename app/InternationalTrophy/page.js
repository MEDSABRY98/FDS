"use client";

import { useState, useEffect } from "react";
import { Trophy, List, Download, Plus, Filter, LayoutGrid } from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import Loading_db from "../lib/Loading_db";
import { useNotification } from "../lib/Notification_db";
import { IntTrophyService } from "./Service/int_trophy_service";
import IntTrophyLeaderboard from "./Leaderboard/int_trophy_leaderboard";
import IntTrophyRecords from "./Records/int_trophy_records";
import IntTrophyAddTrophies from "./AddTrophies/int_trophy_add_trophies";
import IntTrophyAggregateTables from "./Aggregates/int_trophy_aggregate_tables";
import IntTrophyFilters from "./Filters/int_trophy_filters";
import { exportIntTrophyByTab } from "./ExcelExport/int_trophy_excel_export";
import "./Leaderboard/int_trophy_leaderboard.css";

export default function InternationalTrophyPage() {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState("leaderboard");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const [trophies, setTrophies] = useState([]);
    const [filteredTrophies, setFilteredTrophies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [aggregateExportFilters, setAggregateExportFilters] = useState({
        typeFilter: "All",
        outcomeFilter: "all",
        viewMode: "by_game",
        selectedGame: "",
    });

    useEffect(() => { fetchData(); }, []);

    async function fetchData(silent = false) {
        if (!silent) setLoading(true);
        try {
            const data = await IntTrophyService.getAllTrophies();
            setTrophies(data);
            setFilteredTrophies(data);
        } catch (error) {
            console.error("Failed to load international trophy data:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    const tabs = [
        { id: "leaderboard", label: "Trophy Count", icon: Trophy },
        { id: "aggregates", label: "Aggregate Tables", icon: LayoutGrid },
        { id: "records", label: "All Records", icon: List },
        { id: "add_trophies", label: "Add Trophies", icon: Plus },
    ];

    const handleExport = () => {
        if (activeTab === "add_trophies") {
            addNotification("Nothing to export on this tab.", "warn");
            return;
        }
        const ok = exportIntTrophyByTab(activeTab, filteredTrophies, aggregateExportFilters);
        if (ok) addNotification("Excel exported.", "success");
        else addNotification("No data to export.", "warn");
    };

    const renderContent = () => {
        switch (activeTab) {
            case "leaderboard":
                return <IntTrophyLeaderboard trophies={filteredTrophies} />;
            case "records":
                return <IntTrophyRecords trophies={filteredTrophies} />;
            case "aggregates":
                return (
                    <IntTrophyAggregateTables
                        trophies={filteredTrophies}
                        onFiltersChange={setAggregateExportFilters}
                    />
                );
            case "add_trophies":
                return <IntTrophyAddTrophies trophies={trophies} onRefresh={() => fetchData(true)} />;
            default:
                return null;
        }
    };

    return (
        <SideBar_db
            brandTitle="INTL"
            brandSubtitle="TROPHIES"
            logoText="IT"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            actions={[
                { label: "EXPORT TO EXCEL", icon: Download, onClick: handleExport, className: "export-btn", title: "DOWNLOAD AS EXCEL" },
                { label: "FILTERS", icon: Filter, onClick: () => setIsFilterOpen(true), className: "filter-btn", title: "OPEN FILTERS" },
            ]}
            mobileBrandName="INTERNATIONAL TROPHIES"
            mobileActions={[
                { icon: Download, onClick: handleExport, title: "EXPORT" },
                { icon: Filter, onClick: () => setIsFilterOpen(true), title: "FILTERS" },
            ]}
        >
            <main style={{ padding: "30px 24px", maxWidth: "1584px", margin: "0 auto", width: "100%" }}>
                {loading && activeTab !== "add_trophies" ? (
                    <Loading_db title="INTERNATIONAL" subtitle="TROPHIES DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderContent()
                )}
            </main>
            <IntTrophyFilters
                data={trophies}
                onFilter={setFilteredTrophies}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
