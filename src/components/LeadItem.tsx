import { Badge } from "@/components/ui/badge";

interface LeadItemProps {
  name: string;
  email: string;
  company: string;
  status: string;
  value: number;
  source: string;
}

export const LeadItem = ({ name, email, company, status, value, source }: LeadItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium text-card-foreground">{name}</h3>
          <Badge className={getStatusColor(status)} variant="outline">
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
        <p className="text-sm text-muted-foreground">{company}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-card-foreground">${value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">from {source}</p>
      </div>
    </div>
  );
};