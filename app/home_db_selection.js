"use client";

import Link from "next/link";
import "./home_db_selection.css";

export default function HomeDbSelection() {
    return (
        <div id="home-screen">
            <div className="home-topbar"></div>

            <div className="home-sys-name">FOOTBALL <span>DATABASE</span></div>
            <div className="home-sys-sub">SELECT A SECTION TO CONTINUE</div>

            <div className="section-cards">
                <Link href="/alahlydbmanagement" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>DB</span>
                    </div>
                    <div className="card-name">AL AHLY DB MANAGEMENT</div>
                </Link>

                <Link href="/alahly" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>A</span>
                    </div>
                    <div className="card-name">AL AHLY SC</div>
                </Link>
            </div>
        </div>
    );
}
