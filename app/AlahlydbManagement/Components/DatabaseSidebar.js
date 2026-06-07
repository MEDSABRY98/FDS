import { Database, Download } from "lucide-react";
import SideBar_db from "../../lib/SideBar_db";

export default function DatabaseSidebar({ 
    availableTables, 
    selectedTable, 
    setSelectedTable, 
    handleDownloadExcel,
    children
}) {
    return (
        <SideBar_db
            brandTitle="AHLY"
            brandSubtitle="DB MGMT"
            logoText="A"
            menuItems={availableTables.map(t => ({
                id: t.name,
                label: t.label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
                icon: Database
            }))}
            activeTab={selectedTable}
            setActiveTab={setSelectedTable}
            actions={[
                {
                    label: "EXPORT TO EXCEL",
                    icon: Download,
                    onClick: handleDownloadExcel,
                    className: "export-btn",
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                }
            ]}
            mobileBrandName="AHLY DB MGMT"
            mobileActions={[
                {
                    icon: Download,
                    onClick: handleDownloadExcel,
                    title: "DOWNLOAD CURRENT VIEW AS EXCEL"
                }
            ]}
        >
            {children}
        </SideBar_db>
    );
}
