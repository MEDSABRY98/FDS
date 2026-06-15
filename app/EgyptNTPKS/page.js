"use client";

import { useState, useEffect } from "react";
import { 
    Download, 
    SlidersHorizontal, 
    LayoutDashboard, 
    Trophy, 
    Users, 
    Shield, 
    User, 
    GitCompare 
} from "lucide-react";
import { EgyptNTPKSService } from "./Service/egypt_nt_pks_service";
import EgyptNTPKSMatches from "./Matches/egypt_nt_pks_matches";
import EgyptNTPKSMatchDetails from "./MatchDetails/egypt_nt_pks_match_details";
import EgyptNTPKSPlayers from "./Players/egypt_nt_pks_players";
import EgyptNTPKSGKs from "./Gks/egypt_nt_pks_gks";
import EgyptNTPKSChampions from "./Champions/egypt_nt_pks_champions";
import EgyptNTPKSFilters from "./Filters/egypt_nt_pks_filters";
import EgyptNTPKSH2H from "./HeadToHead/egypt_nt_pks_h2h";
import EgyptNTPKSManagers from "./Managers/egypt_nt_pks_managers";
import EgyptNTPKSDashboard from "./Dashboard/egypt_nt_pks_dashboard";
import Loading_db from "../lib/Loading_db";
import SideBar_db from "../lib/SideBar_db";


export default function EgyptNTPKSDatabase() {
    const [activeTab, setActiveTab] = useState("egy_pks_dashboard");
    const [pksData, setPksData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPksId, setSelectedPksId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const tabs = [
        { id: 'egy_pks_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'egy_pks_matches', label: 'Matches', icon: Trophy },
        { id: 'egy_pks_champions', label: 'Champions', icon: Trophy },
        { id: 'egy_pks_players', label: 'Players', icon: Users },
        { id: 'egy_pks_gks', label: 'Gks', icon: Shield },
        { id: 'egy_pks_managers', label: 'Managers', icon: User },
        { id: 'egy_pks_h2h', label: 'H2h', icon: GitCompare }
    ];

    useEffect(() => {
        fetchPKData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedPksId, activeTab]);

    async function fetchPKData() {
        setLoading(true);
        const data = await EgyptNTPKSService.getAllPKs();
        setPksData(data);
        setFilteredData(data);
        setLoading(false);
    }

    const renderAppContent = () => {
        if (selectedPksId) {
            const matchKicks = filteredData.filter(k => k.PKS_ID === selectedPksId);
            return <EgyptNTPKSMatchDetails matchPks={matchKicks} onBack={() => setSelectedPksId(null)} />;
        }

        switch (activeTab) {
            case "egy_pks_dashboard":
                return <EgyptNTPKSDashboard pksData={filteredData} />;
            case "egy_pks_matches":
                return <EgyptNTPKSMatches pksData={filteredData} onSelectMatch={(id) => setSelectedPksId(id)} />;
            case "egy_pks_champions":
                return <EgyptNTPKSChampions pksData={filteredData} />;
            case "egy_pks_players":
                return <EgyptNTPKSPlayers pksData={filteredData} />;
            case "egy_pks_gks":
                return <EgyptNTPKSGKs pksData={filteredData} />;
            case "egy_pks_h2h":
                return <EgyptNTPKSH2H pksData={filteredData} />;
            case "egy_pks_managers":
                return <EgyptNTPKSManagers pksData={filteredData} />;
            default:
                return (
                    <div style={{ padding: '100px', textAlign: 'center', color: '#888' }}>
                        <h1>COMING <span style={{ color: '#C8102E' }}>SOON</span></h1>
                    </div>
                );
        }
    };

    return (
        <SideBar_db
            brandTitle="EGYPT NT"
            brandSubtitle="PKS"
            logoText="EG"
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
                    onClick: () => window.dispatchEvent(new CustomEvent('egyntpks-export-excel')),
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
            mobileBrandName="EGYPT NT PKS"
            mobileActions={[
                {
                    icon: Download,
                    onClick: () => window.dispatchEvent(new CustomEvent('egyntpks-export-excel')),
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                },
                {
                    icon: SlidersHorizontal,
                    onClick: () => setIsFilterOpen(true),
                    title: "OPEN DATABASE FILTERS"
                }
            ]}
        >
            <main className="egy-pks-content-viewport" style={{ padding: '0', maxWidth: (activeTab === 'egy_pks_h2h' || activeTab === 'egy_pks_champions' || activeTab === 'egy_pks_managers') ? '100%' : '1380px', margin: '0 auto', width: '100%' }}>
                {loading ? (
                    <Loading_db title="EGYPT NT" subtitle="PKs DATABASE" message="SYNCING DATA" inline={true} />
                ) : (
                    renderAppContent()
                )}
            </main>

            <EgyptNTPKSFilters
                data={pksData}
                onFilter={(filtered) => setFilteredData(filtered)}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </SideBar_db>
    );
}
