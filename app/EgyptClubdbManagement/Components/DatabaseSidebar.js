import Link from "next/link";
import { Database, ArrowLeft, X, Download } from "lucide-react";

export function DatabaseSidebar({ 
    isSidebarMobileOpen, 
    setIsSidebarMobileOpen, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    availableTables, 
    selectedTable, 
    setSelectedTable, 
    handleDownloadExcel 
}) {
    return (
        <aside className={`egypt-sidebar ${isSidebarMobileOpen ? 'mobile-open' : ''}`}>
            <div className="egypt-sidebar-header">
                <Link href="/" className="egypt-sidebar-brand">
                    <div className="egypt-sidebar-logo-hex">
                        <span className="egypt-sidebar-logo-text">C</span>
                    </div>
                    <div className="egypt-sidebar-brand-name">
                        CLUBS <span>DB MGMT</span>
                    </div>
                </Link>
                <button 
                    className="egypt-sidebar-close-btn" 
                    onClick={() => setIsSidebarMobileOpen(false)}
                    title="CLOSE MENU"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="egypt-sidebar-menu">
                {availableTables.map(t => (
                    <button
                        key={t.name}
                        className={`egypt-sidebar-item ${selectedTable === t.name ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedTable(t.name);
                            setIsSidebarMobileOpen(false);
                        }}
                    >
                        <Database size={16} className="egypt-sidebar-item-icon" />
                        <span>{t.label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                    </button>
                ))}
            </div>

            <div className="egypt-sidebar-actions">
                <button
                    className="egypt-sidebar-collapse-toggle-btn"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={isSidebarCollapsed ? "EXPAND MENU" : "COLLAPSE MENU"}
                >
                    <ArrowLeft size={14} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                    <span>COLLAPSE MENU</span>
                </button>
                <button 
                    className="egypt-sidebar-action-btn export-btn" 
                    onClick={handleDownloadExcel}
                    title="DOWNLOAD CURRENT VIEW AS EXCEL"
                >
                    <Download size={14} />
                    <span>EXPORT TO EXCEL</span>
                </button>
            </div>
        </aside>
    );
}
