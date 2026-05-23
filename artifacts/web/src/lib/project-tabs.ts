import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Calculator,
  GitBranch,
  TrendingUp,
  FileText,
  Camera,
  FolderOpen,
  AlertCircle,
  Banknote,
  ShoppingCart,
  HardHat,
  type LucideIcon,
} from "lucide-react";

export type ProjectTab = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const PROJECT_TABS: ProjectTab[] = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "wbs", label: "WBS", icon: ListTodo },
  { value: "milestones", label: "Milestones", icon: Calendar },
  { value: "estimation", label: "Estimation", icon: Calculator },
  { value: "variation-orders", label: "VOs", icon: GitBranch },
  { value: "boq-actual", label: "BOQ vs Actual", icon: TrendingUp },
  { value: "dprs", label: "DPRs", icon: FileText },
  { value: "photos", label: "Photos", icon: Camera },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "issues", label: "Issues", icon: AlertCircle },
  { value: "financial", label: "Financial", icon: Banknote },
  { value: "supply-chain", label: "Supply Chain", icon: ShoppingCart },
  { value: "workforce", label: "Workforce & EHS", icon: HardHat },
];

export const VALID_PROJECT_TABS = PROJECT_TABS.map((t) => t.value);
