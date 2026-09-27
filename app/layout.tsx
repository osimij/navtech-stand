import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"NavTech · HR Agent × Prism",description:"Восемь рабочих ситуаций, профессиональные роли и подход к задачам. Демонстрация HR Agent и аналитика Prism на Taj-Tech 2026.",icons:{icon:[{url:"/favicon.ico",sizes:"32x32"},{url:"/favicon.svg",type:"image/svg+xml"}],apple:"/apple-touch-icon.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
