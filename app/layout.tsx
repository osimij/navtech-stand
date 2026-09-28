import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"NavTech · HR Agent × Prism",description:"Восемь рабочих ситуаций, профессиональные роли и подход к задачам. Демонстрация HR Agent и аналитика Prism на Taj-Tech 2026.",icons:{icon:[{url:"/favicon.ico",sizes:"32x32"},{url:"/favicon.svg",type:"image/svg+xml"}],apple:"/apple-touch-icon.png"}};
// Rendering tier before the first paint, so a low-power panel never starts the costly effects (lib/navi-quality.ts has
// the same rule and refines it with the GPU name once Navi's WebGL is up). ?navi=lite|full|auto is an operator override.
const perfTier=`try{var d=document.documentElement,n=navigator,s=localStorage,q=new URLSearchParams(location.search).get('navi');if(q!==null){if(q==='lite'||q==='full')s.setItem('navi-quality',q);else s.removeItem('navi-quality')}var o=s.getItem('navi-quality');d.dataset.perf=o||(/android/i.test(n.userAgent)||(n.hardwareConcurrency||8)<=4||(n.deviceMemory||8)<=4?'lite':'full')}catch(e){}`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:perfTier}}/></head><body>{children}</body></html>}
