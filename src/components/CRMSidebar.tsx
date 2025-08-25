import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  Target, 
  CheckSquare, 
  MessageSquare, 
  Settings,
  Activity,
  Home,
  Brain
} from "lucide-react";

interface CRMSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { name: "Overview", icon: Home, view: "overview" },
  { name: "Leads", icon: Users, view: "leads" },
  { name: "Deals", icon: Target, view: "deals" },
  { name: "Tasks", icon: CheckSquare, view: "tasks" },
  { name: "Team Chat", icon: MessageSquare, view: "chat" },
  { name: "AI Chat", icon: Brain, view: "ai-chat" },
  { name: "Activities", icon: Activity, view: "activities" },
  { name: "Settings", icon: Settings, view: "settings" },
];

export const CRMSidebar = ({ currentView, onViewChange }: CRMSidebarProps) => {
  return (
    <div className="w-64 bg-crm-sidebar border-r border-border h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-crm-sidebar-foreground">Sales CRM</span>
        </div>
      </div>

      <div className="px-3">
        <div className="mb-4">
          <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Dashboard
          </h3>
        </div>
        
        <nav className="space-y-1">
          {navigation.slice(0, 1).map((item) => (
            <button
              key={item.name}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                currentView === item.view
                  ? "bg-crm-sidebar-active text-crm-sidebar-active-foreground"
                  : "text-crm-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-6 mb-4">
          <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sales
          </h3>
        </div>
        
        <nav className="space-y-1">
          {navigation.slice(1, 4).map((item) => (
            <button
              key={item.name}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                currentView === item.view
                  ? "bg-crm-sidebar-active text-crm-sidebar-active-foreground"
                  : "text-crm-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-6 mb-4">
          <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Collaboration
          </h3>
        </div>
        
        <nav className="space-y-1">
          {navigation.slice(4, 8).map((item) => (
            <button
              key={item.name}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                currentView === item.view
                  ? "bg-crm-sidebar-active text-crm-sidebar-active-foreground"
                  : "text-crm-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-6 mb-4">
          <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System
          </h3>
        </div>
        
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange("settings")}
            className={cn(
              "group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
              currentView === "settings"
                ? "bg-crm-sidebar-active text-crm-sidebar-active-foreground"
                : "text-crm-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
            Settings
          </button>
        </nav>
      </div>
    </div>
  );
};