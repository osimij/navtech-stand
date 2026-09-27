import { createElement, type CSSProperties } from "react";
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon, AlertCircleIcon, AnalyticsUpIcon, AppWindowIcon, ArrowDown01Icon, ArrowLeft02Icon,
  ArrowRight02Icon, ArrowUp01Icon, BalanceScaleIcon, Book02Icon, Briefcase01Icon, Cancel01Icon,
  ChartColumnIcon, ChartIncreaseIcon, ChartLineData01Icon, ChartScatterIcon, CheckListIcon,
  CheckmarkBadge01Icon, CpuIcon, CreditCardIcon, DashboardSpeed01Icon, DashboardSquare01Icon,
  DatabaseSync01Icon, Download04Icon, FlashIcon, GearsIcon, MicroscopeIcon, PieChart02Icon, CodeSquareIcon, FunnelIcon, GitBranchIcon, Globe02Icon, Idea01Icon,
  Logout03Icon, MaximizeScreenIcon, Mic01Icon, MicOff01Icon, MinimizeScreenIcon, PenTool03Icon, PlayIcon,
  Plug01Icon, PresentationBarChart01Icon, Refresh01Icon, RepeatIcon, Route01Icon, Search01Icon,
  SearchFocusIcon, Sent02Icon, ServerStack01Icon, Shield01Icon, SlidersHorizontalIcon, SmileIcon,
  SourceCodeIcon, SquareLock02Icon, StopIcon, TagsIcon, Target02Icon, TestTube01Icon, Tick02Icon,
  TouchInteraction01Icon, UserGroupIcon, UserSearch01Icon, ViewIcon, VolumeHighIcon, VolumeOffIcon,
  WorkflowSquare10Icon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<HugeiconsProps, "icon" | "altIcon" | "ref">;
export type Icon = (props: IconProps) => React.JSX.Element;

// Hugeicons behind the names the app already uses; decorative by default.
function icon(svg: IconSvgElement): Icon {
  return function HugeIcon(props: IconProps) {
    return <HugeiconsIcon icon={svg} aria-hidden="true" {...props} />;
  };
}

export const ArrowRight = icon(ArrowRight02Icon);
export const ArrowLeft = icon(ArrowLeft02Icon);
export const ChevronDown = icon(ArrowDown01Icon);
export const ChevronUp = icon(ArrowUp01Icon);
export const Check = icon(Tick02Icon);
export const X = icon(Cancel01Icon);
export const Maximize = icon(MaximizeScreenIcon);
export const Minimize = icon(MinimizeScreenIcon);
export const Settings = icon(SlidersHorizontalIcon);
export const Globe = icon(Globe02Icon);
export const Play = icon(PlayIcon);
export const Stop = icon(StopIcon);
export const Mic = icon(Mic01Icon);
export const MicOff = icon(MicOff01Icon);
export const Volume = icon(VolumeHighIcon);
export const VolumeOff = icon(VolumeOffIcon);
export const Refresh = icon(Refresh01Icon);
export const Download = icon(Download04Icon);
export const Lock = icon(SquareLock02Icon);
export const LogOut = icon(Logout03Icon);
export const AnalyticsChart = icon(AnalyticsUpIcon);
export const ListChecks = icon(CheckListIcon);
export const Briefcase = icon(Briefcase01Icon);
export const ScanSearch = icon(SearchFocusIcon);
export const Search = icon(Search01Icon);

export const Flask = icon(TestTube01Icon);
export const Workflow = icon(WorkflowSquare10Icon);
export const Dashboard = icon(DashboardSquare01Icon);
export const GitBranch = icon(GitBranchIcon);
export const Code = icon(SourceCodeIcon);
export const Users = icon(UserGroupIcon);

// Career roles, as raw glyphs so the result can draw them stroke by stroke. None of them is an answer icon.
export type Glyph = IconSvgElement;
export const roleGlyphs = {
  chartColumn: ChartColumnIcon, microscope: MicroscopeIcon, cpu: CpuIcon, gears: GearsIcon,
  pieChart: PieChart02Icon, gitBranch: GitBranchIcon, codeSquare: CodeSquareIcon, penTool: PenTool03Icon,
} satisfies Record<string, Glyph>;
export function GlyphIcon({ glyph, ...props }: IconProps & { glyph: Glyph }) {
  return <HugeiconsIcon icon={glyph} aria-hidden="true" {...props} />;
}

// One entry per stroke of the glyph: when it starts, how long it draws, and whether it draws from its far end.
export type Stroke = { at: number; for: number; reverse?: boolean; className?: string };
export function DrawnIcon({ glyph, strokes, className }: { glyph: Glyph; strokes: Stroke[]; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    {glyph.map(([tag, { key: _, ...attrs }], index) => {
      const stroke = strokes[index] ?? { at: 0, for: 600 };
      return createElement(tag, {
        ...attrs, key: index, pathLength: 1,
        className: ["drawn-stroke", stroke.reverse && "is-reverse", stroke.className].filter(Boolean).join(" "),
        style: { "--at": `${stroke.at}ms`, "--for": `${stroke.for}ms` } as CSSProperties,
      });
    })}
  </svg>;
}

// Answer options: one concrete picture per answer, never a role signal.
export const Funnel = icon(FunnelIcon);
export const ChartLine = icon(ChartLineData01Icon);
export const Eye = icon(ViewIcon);
export const CreditCard = icon(CreditCardIcon);
export const Send = icon(Sent02Icon);
export const Idea = icon(Idea01Icon);
export const ChartIncrease = icon(ChartIncreaseIcon);
export const Tags = icon(TagsIcon);
export const Flash = icon(FlashIcon);
export const AppWindow = icon(AppWindowIcon);
export const Plug = icon(Plug01Icon);
export const UserSearch = icon(UserSearch01Icon);
export const Book = icon(Book02Icon);
export const ChartScatter = icon(ChartScatterIcon);
export const BalanceScale = icon(BalanceScaleIcon);
export const Gauge = icon(DashboardSpeed01Icon);
export const Alert = icon(AlertCircleIcon);
export const Smile = icon(SmileIcon);
export const DatabaseSync = icon(DatabaseSync01Icon);
export const Target = icon(Target02Icon);
export const Route = icon(Route01Icon);
export const Touch = icon(TouchInteraction01Icon);
export const Presentation = icon(PresentationBarChart01Icon);
export const Server = icon(ServerStack01Icon);
export const BadgeCheck = icon(CheckmarkBadge01Icon);
export const Repeat = icon(RepeatIcon);
export const Shield = icon(Shield01Icon);
export const Activity = icon(Activity01Icon);
