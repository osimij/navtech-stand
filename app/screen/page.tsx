"use client";
import {useState} from "react";
import type {QuizLanguage} from "@/lib/quiz";
import Analytics from "../analytics";
import {Header} from "../shell";
export default function Screen(){
 const [language]=useState<QuizLanguage>('ru');
 return <div className="app-shell screen-shell"><Header language={language}/><main><Analytics expanded language={language} russianOnly/></main></div>;
}
