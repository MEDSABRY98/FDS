"use client";

import { useState, useEffect } from "react";
import { supabase } from "../Database";
import {
    LayoutDashboard, Trophy, Users, Globe, GitCompare, Plus, Download, Filter, Award,
} from "lucide-react";
import SideBar_db from "../lib/SideBar_db";
import Loading_db from "../lib/Loading_db";
import { useNotification } from "../lib/Notification_db";
import { IntNtService } from "./Service/int_nt_service";
import IntNtDashboard from "./Dashboard/int_nt_dashboard";
import IntNtMatches from "./Matches/int_nt_matches";
import IntNtAddMatches from "./AddMatches/int_nt_add_matches";
import IntNtTeams from "./Teams/int_nt_teams";
import IntNtCompetitions from "./Competitions/int_nt_competitions";
import IntNtContinents from "./Continents/int_nt_continents";
import IntNtH2H from "./HeadToHead/int_nt_h2h";
import IntNtFilters from "./Filters/int_nt_filters";
import { exportIntNtByTab, EXPORT_EVENT } from "./ExcelExport/int_nt_excel_export";
import "./Dashboard/int_nt_dashboard.css";
import "./Teams/int_nt_teams.css";

export default function InternationalNTPage() {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState("dashboard");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [activeFilters, setActiveFilters] = useState({});
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => { fetchData(); }, []);

    async function fetchData(silent = false) {
        if (!silent) setLoading(true);
        try {
            const [data, countriesRes] = await Promise.all([
                IntNtService.getAllMatches(),
                supabase.from("db_COUNTRIES").select("*")
            ]);
            setMatches(data);
            setFilteredMatches(data);
            if (!countriesRes.error) {
                setCountries(countriesRes.data || []);
            }
        } catch (error) {
            console.error("Failed to load international NT data:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "matches", label: "Matches", icon: Trophy },
        { id: "add_matches", label: "Add Matches", icon: Plus },
        { id: "teams", label: "Teams", icon: Users },
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
                    const ok = await exportIntNtByTab(activeTab, filteredMatches);
                    resolve({ handled: false, ok, message: "No data to export." });
                }
            });
        });
        if (result.ok) addNotification("Excel exported.", "success");
        else addNotification(result.message, "warn");
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard": return <IntNtDashboard matches={filteredMatches} activeFilters={activeFilters} countries={countries} />;
            case "matches": return <IntNtMatches matches={filteredMatches} />;
            case "add_matches": return <IntNtAddMatches matches={matches} onRefresh={() => fetchData(true)} />;
            case "teams": return <IntNtTeams matches={filteredMatches} />;
            case "competitions": return <IntNtCompetitions matches={filteredMatches} />;
            case "continents": return <IntNtContinents matches={filteredMatches} countries={countries} />;
            case "h2h": return <IntNtH2H matches={filteredMatches} />;
            default: return null;
        }
    };

    return (
        <SideBar_db
            brandTitle="INTL"
            brandSubtitle="NATIONAL TEAMS"
            logoText="IN"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            actions={[
                { label: "EXPORT TO EXCEL", icon: Download, onClick: handleExport, className: "export-btn", title: "DOWNLOAD AS EXCEL" },
                { label: "FILTERS", icon: Filter, onClick: () => setIsFilterOpen(true), className: "filter-btn", title: "OPEN FILTERS" },
            ]}
            mobileBrandName="INTERNATIONAL NT"
            mobileActions={[
                { icon: Download, onClick: handleExport, title: "EXPORT" },
                { icon: Filter, onClick: () => setIsFilterOpen(true), title: "FILTERS" },
            ]}
        >
            <main style={{ padding: "30px 24px", maxWidth: "1584px", margin: "0 auto", width: "100%" }}>
                {loading && activeTab !== "add_matches" ? (
                    <Loading_db title="INTERNATIONAL" subtitle="NATIONAL TEAMS DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderContent()
                )}
            </main>
            <IntNtFilters 
                data={matches} 
                countries={countries} 
                onFilter={(filtered, appliedFilters) => {
                    setFilteredMatches(filtered);
                    if (appliedFilters) setActiveFilters(appliedFilters);
                }} 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)} 
            />
        </SideBar_db>
    );
}
