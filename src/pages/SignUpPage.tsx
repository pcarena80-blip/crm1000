import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, ArrowLeft, Shield, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { register as apiRegister } from "@/lib/api";

const roles = [
  {
    id: "admin",
    title: "Admin (Organization Owner)",
    description: "Full control over the system. Manage users, projects, and settings.",
    icon: Building,
    features: [
      "Create and manage organizations",
      "Add/remove team members",
      "Access to all features and reports",
      "Customize branding and settings",
      "Manage billing and subscriptions"
    ]
  },
  {
    id: "customer",
    title: "Customer (End Client)",
    description: "Access to your projects, support tickets, and communication.",
    icon: Users,
    features: [
      "View assigned projects",
      "Create support tickets",
      "Access to project chat",
      "View invoices and payments",
      "Update profile and preferences"
    ]
  }
];

export const SignUpPage = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    company: "",
    acceptTerms: false,
    acceptMarketing: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoleSelection = (roleId: string) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the API helper function
      const data = await apiRegister(
        formData.fullName,
        formData.email,
        formData.password
      );
      
      if (data.success) {
        toast({
          title: "Registration Successful!",
          description: data.message || "Account created successfully. Please login.",
        });
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to create account. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedRole("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">EnterpriseCRM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? "Choose Your Role" : "Create Your Account"}
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? "Select how you'll use EnterpriseCRM" 
              : "Join thousands of businesses already using our platform"
            }
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card 
                key={role.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                onClick={() => handleRoleSelection(role.id)}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <role.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <p className="text-gray-600">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Shield className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline">
                    Select {role.title.includes("Admin") ? "Admin" : "Customer"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Account Creation */}
        {step === 2 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-4">
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Badge variant="secondary">
                  {selectedRole === "admin" ? "Admin Setup" : "Customer Setup"}
                </Badge>
              </div>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <p className="text-gray-600">
                {selectedRole === "admin" 
                  ? "Set up your organization and start managing your team" 
                  : "Get access to your projects and support"
                }
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder=""
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder=""
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder=""
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                  {selectedRole === "admin" && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corporation"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                      required
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I agree to the{" "}
                      <a href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onCheckedChange={(checked) => handleInputChange("acceptMarketing", checked as boolean)}
                    />
                    <Label htmlFor="acceptMarketing" className="text-sm">
                      I want to receive product updates and marketing communications
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    `Create ${selectedRole === "admin" ? "Admin" : "Customer"} Account`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
