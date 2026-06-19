"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
    Download,
    SlidersHorizontal,
    LayoutDashboard,
    Trophy,
    FileText,
    Users,
    Shield,
    User,
    GitCompare
} from "lucide-react";
import { AlAhlyService } from "../Alahly/Service/alahly_db_service";
import AlAhlyPKsMatches from "./Matches/alahly_pks_matches";
import AlAhlyPKsMatchDetails from "./MatchDetails/alahly_pks_match_details";
import AlAhlyPKsPlayers from "./Players/alahly_pks_players";
import AlAhlyPKsGKs from "./Gks/alahly_pks_gks";
import AlAhlyPKsChampions from "./Champions/alahly_pks_champions";
import AlAhlyPKsFilter from "./Filters/alahly_pks_filters";
import AlAhlyPKsH2H from "./HeadToHead/alahly_pks_h2h";
import AlAhlyPKsManagers from "./Managers/alahly_pks_managers";
import AlAhlyPKsEditor from "./Editor/alahly_pks_editor";
import AlAhlyPKsDashboard from "./Dashboard/alahly_pks_dashboard";
import Login_db from "../lib/Login_db";
import Loading_db from "../lib/Loading_db";
import SideBar_db from "../lib/SideBar_db";


export default function AlAhlyPKsDatabase() {
    const [activeTab, setActiveTab] = useState("alahly_pks_dashboard");
    const [pksData, setPksData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPksId, setSelectedPksId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const matchesListScrollY = useRef(0);

    const tabs = [
        { id: 'alahly_pks_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'alahly_pks_matches', label: 'Matches', icon: Trophy },
        { id: 'alahly_pks_editor', label: 'Editor', icon: FileText },
        { id: 'alahly_pks_champions', label: 'Champions', icon: Trophy },
        { id: 'alahly_pks_players', label: 'Players', icon: Users },
        { id: 'alahly_pks_gks', label: 'Gks', icon: Shield },
        { id: 'alahly_pks_managers', label: 'Managers', icon: User },
        { id: 'alahly_pks_h2h', label: 'H2h', icon: GitCompare }
    ];

    useEffect(() => {
        fetchPKData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    useEffect(() => {
        if (selectedPksId) {
            window.scrollTo(0, 0);
        }
    }, [selectedPksId]);

    async function fetchPKData(options = {}) {
        const { silent = false } = options;
        if (!silent) setLoading(true);

        const pks = await AlAhlyService.getAllPKs();
        const linkedPks = await AlAhlyService.enrichPksFromMatchDetails(pks);
        const enrichedData = await AlAhlyService.enrichPksWithManagers(linkedPks);

        setPksData(enrichedData);
        setFilteredData(enrichedData);
        if (!silent) setLoading(false);
    }

    const handleEditorDataSaved = useCallback(async () => {
        const pks = await AlAhlyService.getAllPKs();
        const linkedPks = await AlAhlyService.enrichPksFromMatchDetails(pks);
        const enrichedData = await AlAhlyService.enrichPksWithManagers(linkedPks);
        setPksData(enrichedData);
        setFilteredData(enrichedData);
    }, []);

    const pksSuggestions = useMemo(() => {
        const getUnique = (key) => [...new Set((pksData || []).map((item) => item[key]).filter(Boolean))].sort();
        return {
            pksSystem: getUnique("PKS SYSTEM"),
            champSystem: getUnique("CHAMPION SYSTEM"),
            champion: getUnique("CHAMPION"),
            season: getUnique("SEASON"),
            round: getUnique("ROUND"),
            whoStart: getUnique("WHO START?"),
            oppStatus: getUnique("OPPONENT STATUS"),
            ahlyStatus: getUnique("AHLY STATUS"),
            pksWL: getUnique("PKS W-L"),
            howMiss: [...new Set([
                ...(pksData || []).map((item) => item["HOWMISS AHLY"]),
                ...(pksData || []).map((item) => item["HOWMISS OPPONENT"]),
            ].filter(Boolean))].sort(),
        };
    }, [pksData]);

    const renderAppContent = () => {
        switch (activeTab) {
            case "alahly_pks_dashboard":
                return <AlAhlyPKsDashboard pksData={filteredData} />;
            case "alahly_pks_matches":
                return (
                    <>
                        <div hidden={!!selectedPksId}>
                            <AlAhlyPKsMatches
                                pksData={filteredData}
                                onSelectMatch={(id) => {
                                    matchesListScrollY.current = window.scrollY;
                                    setSelectedPksId(id);
                                }}
                            />
                        </div>
                        {selectedPksId && (
                            <AlAhlyPKsMatchDetails
                                matchPks={filteredData.filter(k => k.PKS_ID === selectedPksId)}
                                onBack={() => {
                                    setSelectedPksId(null);
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
            case "alahly_pks_editor":
                return (
                    <Login_db title="EDITOR ACCESS" subtitle="AUTHORIZATION REQUIRED">
                        <AlAhlyPKsEditor
                            pksData={pksData}
                            pksSuggestions={pksSuggestions}
                            onDataSaved={handleEditorDataSaved}
                        />
                    </Login_db>
                );
            case "alahly_pks_champions":
                return <AlAhlyPKsChampions pksData={filteredData} />;
            case "alahly_pks_players":
                return <AlAhlyPKsPlayers pksData={filteredData} />;
            case "alahly_pks_gks":
                return <AlAhlyPKsGKs pksData={filteredData} />;
            case "alahly_pks_h2h":
                return <AlAhlyPKsH2H pksData={filteredData} />;
            case "alahly_pks_managers":
                return <AlAhlyPKsManagers pksData={filteredData} />;
            default:
                return (
                    <div style={{ padding: '100px', textAlign: 'center', color: '#888' }}>
                        <h1>COMING <span style={{ color: '#c9a84c' }}>SOON</span></h1>
                    </div>
                );
        }
    };

    return (
        <SideBar_db
            brandTitle="AL AHLY"
            brandSubtitle="PKS"
            logoText="A"
            menuItems={tabs}
            activeTab={activeTab}
            setActiveTab={(tabId) => {
                setActiveTab(tabId);
                setSelectedPksId(null);
            }}
            actions={[
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    className: "export-btn",
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    label: "FILTERS",
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    className: "filter-btn",
                    title: "OPEN ADVANCED FILTERS"
                }
            ]}
            mobileBrandName="AL AHLY PKS"
            mobileActions={[
                {
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('alahly-export-excel')),
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    title: "OPEN DATABASE FILTERS"
                }
            ]}
        >
            <main className="alahly-content-viewport" style={{ padding: '0', maxWidth: (activeTab === 'alahly_pks_h2h' || activeTab === 'alahly_pks_champions' || activeTab === 'alahly_pks_managers' || activeTab === 'alahly_pks_editor') ? '100%' : '1200px', margin: '0 auto', width: '100%' }}>
                {loading ? (
                    <Loading_db subtitle="PKs DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderAppContent()
                )}
            </main>

            <AlAhlyPKsFilter
                data={pksData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
