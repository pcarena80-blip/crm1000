import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  const handleLogout = async () => {
    console.log('TopBar: Logout button clicked');
    console.log('TopBar: Current user before logout:', user);
    
    await logout();
    
    console.log('TopBar: Logout completed, navigating to login');
    console.log('TopBar: Current user after logout:', user);
    
    // Force navigation to login page and clear any cached routes
    navigate('/login', { replace: true });
    
    // Force a page refresh to ensure clean state
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-border bg-background">
      {/* Left Section - Logo & Search */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">*</span>
          </div>
          <h1 className="text-xl font-bold">CRM Dashboard</h1>
        </div>
        
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Start searching here..." 
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Section - Notifications, Date, Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
        
        {/* Current Date */}
        <div className="text-sm text-muted-foreground">
          {currentDate}
        </div>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {user ? user.name.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="text-sm font-medium">{user ? user.name : "Guest"}</p>
            <p className="text-xs text-muted-foreground">{user ? user.email : "Not logged in"}</p>
          </div>
          
          {/* Logout Button */}
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};