import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"NavTech · HR Agent × Prism",description:"Восемь рабочих ситуаций, профессиональные роли и подход к задачам. Демонстрация HR Agent и аналитика Prism на Taj-Tech 2026.",icons:{icon:"/brand/navtech-logo.png",shortcut:"/brand/navtech-logo.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
