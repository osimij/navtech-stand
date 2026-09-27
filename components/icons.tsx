import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from "@hugeicons/react";
import {
  AnalyticsUpIcon, ArrowDown01Icon, ArrowLeft02Icon, ArrowRight02Icon, ArrowUp01Icon, ArrowUpRight01Icon,
  Briefcase01Icon, Bug01Icon, Calendar03Icon, Cancel01Icon, ChartColumnIcon, CheckListIcon, CpuIcon,
  Cursor01Icon, DashboardSpeed01Icon, DashboardSquare01Icon, Download04Icon, GitBranchIcon, HierarchyIcon,
  InboxIcon, Logout03Icon, MaximizeScreenIcon, Mic01Icon, MicOff01Icon, MinimizeScreenIcon, PenTool03Icon,
  PlayIcon, Refresh01Icon, RepeatIcon, Search01Icon, SearchFocusIcon, SecurityCheckIcon, SentIcon,
  ShoppingCart01Icon, SlidersHorizontalIcon, SourceCodeIcon, SquareLock02Icon, StopIcon, Table01Icon,
  Tag01Icon, Target02Icon, TestTube01Icon, Tick02Icon, TickDouble01Icon, UserGroupIcon, VolumeHighIcon,
  VolumeOffIcon, WorkflowSquare10Icon,
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
export const ArrowUpRight = icon(ArrowUpRight01Icon);
export const ChevronDown = icon(ArrowDown01Icon);
export const ChevronUp = icon(ArrowUp01Icon);
export const Check = icon(Tick02Icon);
export const CheckCheck = icon(TickDouble01Icon);
export const X = icon(Cancel01Icon);
export const Maximize = icon(MaximizeScreenIcon);
export const Minimize = icon(MinimizeScreenIcon);
export const Settings = icon(SlidersHorizontalIcon);
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
export const BarChart = icon(ChartColumnIcon);
export const Flask = icon(TestTube01Icon);
export const Cpu = icon(CpuIcon);
export const Workflow = icon(WorkflowSquare10Icon);
export const Dashboard = icon(DashboardSquare01Icon);
export const GitBranch = icon(GitBranchIcon);
export const Code = icon(SourceCodeIcon);
export const PenTool = icon(PenTool03Icon);
export const Search = icon(Search01Icon);
export const ShoppingCart = icon(ShoppingCart01Icon);
export const Bug = icon(Bug01Icon);
export const Table = icon(Table01Icon);
export const Send = icon(SentIcon);
export const Calendar = icon(Calendar03Icon);
export const Tag = icon(Tag01Icon);
export const Gauge = icon(DashboardSpeed01Icon);
export const Inbox = icon(InboxIcon);
export const Users = icon(UserGroupIcon);
export const Target = icon(Target02Icon);
export const ShieldCheck = icon(SecurityCheckIcon);
export const Pointer = icon(Cursor01Icon);
export const Network = icon(HierarchyIcon);
export const Repeat = icon(RepeatIcon);
export const ListChecks = icon(CheckListIcon);
export const Briefcase = icon(Briefcase01Icon);
export const ScanSearch = icon(SearchFocusIcon);
