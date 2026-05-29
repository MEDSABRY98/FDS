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
                <Link href="/AlahlydbManagement" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>DB</span>
                    </div>
                    <div className="card-name">AL AHLY DB MANAGEMENT</div>
                </Link>

                <Link href="/Alahly" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>A</span>
                    </div>
                    <div className="card-name">AL AHLY SC</div>
                </Link>

                <Link href="/AlahlyPKS" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>PK</span>
                    </div>
                    <div className="card-name">AL AHLY PKs</div>
                </Link>

                <Link href="/AlahlyFinals" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>F</span>
                    </div>
                    <div className="card-name">AL AHLY FINALS</div>
                </Link>

                <Link href="/AhlyVZamalek" className="section-card">
                    <div className="card-icon-wrap">
                        <span className="card-emoji" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px" }}>D</span>
                    </div>
                    <div className="card-name">CAIRO DERBY</div>
                </Link>
            </div>
        </div>
    );
}
