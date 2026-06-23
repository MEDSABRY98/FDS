/* d:\FDS\Football Database\app\CheckData\page.js */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Sparkles, CheckSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import EgyptNTCheckWorkspace from "./egy_NT_Check";
import "./check_data.css";

function CheckDataContent() {
    const searchParams = useSearchParams();
    const moduleQuery = searchParams.get("module") || "egy_nt";

    return (
        <div id="check-data-page">
            <div className="check-topbar" />
            <div className="check-bg-grid" />

            <div className="check-container">
                {/* Header Section */}
                <header className="check-header">
                    <div className="check-title-section">
                        <Link href="/" className="check-btn-back" style={{ marginRight: '16px', padding: '10px', borderRadius: '50%' }} title="Back Home">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="check-icon-glow">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="check-title-text">
                            <h1>DATA INTEGRITY <span>CHECKER</span></h1>
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Layout */}
                <main>
                    {moduleQuery === "egy_nt" ? (
                        <EgyptNTCheckWorkspace />
                    ) : (
                        <div style={{ padding: "80px", textAlign: "center", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
                            <CheckSquare size={48} color="#94a3b8" style={{ marginBottom: "16px", margin: "0 auto" }} />
                            <h3 style={{ margin: 0, color: "#475569", fontSize: "24px", marginTop: "16px" }}>Coming Soon</h3>
                            <p style={{ color: "#64748b", fontSize: "15px", marginTop: "8px" }}>This module checker is currently in development.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function CheckDataPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
            <CheckDataContent />
        </Suspense>
    );
}
