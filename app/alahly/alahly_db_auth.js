"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AlAhlyAuth({ children, title = "PRIVATE ACCESS", subtitle = "AL AHLY DATABASE MANAGEMENT" }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const auth = sessionStorage.getItem("alahly_db_auth_access");
        if (auth === "true") {
            setIsAuthenticated(true);
        }
        setChecking(false);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        // The common password requested
        if (passwordInput === "951753") {
            setIsAuthenticated(true);
            sessionStorage.setItem("alahly_db_auth_access", "true");
        } else {
            setPasswordError("INCORRECT ACCESS KEY");
            setPasswordInput("");
        }
    };

    if (checking) return null;

    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                color: '#000',
                fontFamily: 'Outfit, sans-serif'
            }}>
                <form onSubmit={handleLogin} style={{
                    background: '#fff',
                    padding: '50px 40px',
                    borderRadius: '32px',
                    border: '1px solid #f0f0f0',
                    width: '380px',
                    textAlign: 'center',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{ transform: 'scale(1.8)', marginBottom: '35px' }}>🔐</div>
                    <h2 style={{ fontFamily: 'Bebas Neue', letterSpacing: '3px', marginBottom: '8px', fontSize: '30px', color: '#000' }}>{title}</h2>
                    <p style={{ fontSize: '11px', color: '#999', letterSpacing: '2px', marginBottom: '35px', fontWeight: '800' }}>{subtitle}</p>

                    <input
                        type="password"
                        placeholder="••••••"
                        value={passwordInput}
                        onChange={(e) => {
                            setPasswordInput(e.target.value);
                            setPasswordError("");
                        }}
                        style={{
                            width: '100%',
                            padding: '20px',
                            background: '#f9f9f9',
                            border: '2px solid #eee',
                            borderRadius: '16px',
                            color: '#000',
                            marginBottom: '15px',
                            textAlign: 'center',
                            fontSize: '24px',
                            letterSpacing: '10px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: '0.3s',
                            borderColor: passwordError ? '#ff3b30' : '#eee'
                        }}
                        autoFocus
                    />

                    {passwordError && (
                        <div style={{
                            color: '#ff3b30',
                            fontSize: '11px',
                            marginBottom: '20px',
                            fontFamily: 'Space Mono',
                            fontWeight: '700'
                        }}>
                            {passwordError}
                        </div>
                    )}

                    <button type="submit" style={{
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        width: '100%',
                        padding: '18px',
                        borderRadius: '16px',
                        fontWeight: '900',
                        fontFamily: 'Space Mono',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: '0.3s',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }}>
                        AUTHORIZE ACCESS
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        style={{
                            background: 'transparent',
                            color: '#aaa',
                            border: 'none',
                            marginTop: '25px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            textDecoration: 'none'
                        }}
                    >
                        ← BACK TO HOME
                    </button>
                </form>
            </div>
        );
    }

    return children;
}
