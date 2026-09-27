"use client";

import { Maximize, Minimize } from "@/components/icons";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { QuizLanguage } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { NavTechLogo } from "@/components/brand";

export function Header({ actions, center, language = "ru" }: { actions?: ReactNode; center?: ReactNode; language?: QuizLanguage }) {
  const en = language === "en";
  const [full, setFull] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const change = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setError(true);
    } catch { setError(true); }
  }

  return <header className="masthead">
    <Link href="/" className="brand-lockup" aria-label={en ? "NavTech — home" : "NavTech — на главный экран"}>
      <NavTechLogo />
    </Link>
    {center && <div className="masthead-center">{center}</div>}
    <div className="header-actions">
      <div className="event-tag">Taj-Tech 2026</div>
      {actions}
      <Button variant="ghost" className="icon-button" title={full ? (en ? "Exit full screen" : "Выйти из полного экрана") : (en ? "Full screen" : "Полный экран")} aria-label={full ? (en ? "Exit full screen" : "Выйти из полного экрана") : (en ? "Full screen" : "Полный экран")} onClick={fullscreen}>
        {full ? <Minimize /> : <Maximize />}
      </Button>
    </div>
    {error && <p className="fullscreen-error" role="status">{en ? "Full screen is available from your browser menu." : "Полный экран доступен в меню браузера."}</p>}
  </header>;
}
