/* d:\FDS\Football Database\app\CheckData\page.js */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Sparkles, CheckSquare } from "lucide-react";
import EgyptNTCheckWorkspace from "./egy_NT_Check";
import "./check_data.css";

const CHECK_MODULES = [
    {
        id: "egy_nt",
        label: "EGYPT NT",
        tag: "Active",
        disabled: false,
    }
];

export default function CheckDataPage() {
    const [activeModuleId, setActiveModuleId] = useState("egy_nt");

    return (
        <div id="check-data-page">
            <div className="check-topbar" />
            <div className="check-bg-grid" />

            <div className="check-container">
                {/* Header Section */}
                <header className="check-header">
                    <div className="check-title-section">
                        <div className="check-icon-glow">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="check-title-text">
                            <h1>DATA INTEGRITY <span>CHECKER</span></h1>
                        </div>
                    </div>

                    <div>
                    </div>
                </header>

                {/* Main Dashboard Layout */}
                <div className="check-layout">
                    {/* Left Sidebar */}
                    <aside className="check-sidebar" aria-label="Select Category to Check">
                        <div className="check-sidebar-label">DATABASE MODULES</div>
                        <nav className="check-module-nav">
                            {CHECK_MODULES.map((mod) => {
                                const isActive = mod.id === activeModuleId;
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        className={`check-module-item ${isActive ? "active" : ""}`}
                                        onClick={() => !mod.disabled && setActiveModuleId(mod.id)}
                                        disabled={mod.disabled}
                                        title={mod.disabled ? "This module checker is coming soon" : undefined}
                                    >
                                        <span className="check-module-dot" />
                                        <span className="check-module-text">
                                            <span className="check-module-tag">{mod.tag}</span>
                                            <span className="check-module-name">{mod.label}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Right Workspace Content */}
                    <main className="check-workspace">
                        {activeModuleId === "egy_nt" ? (
                            <EgyptNTCheckWorkspace />
                        ) : (
                            <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
                                <CheckSquare size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
                                <h3 style={{ margin: 0, color: "#475569" }}>Coming Soon</h3>
                                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>This module checker is currently in development.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
