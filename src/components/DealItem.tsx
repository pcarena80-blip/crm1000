import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DealItemProps {
  title: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
}

export const DealItem = ({ title, company, value, stage, probability, closeDate, owner }: DealItemProps) => {
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'proposal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'negotiation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed won': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-card-foreground">{title}</h3>
        <Badge className={getStageColor(stage)} variant="outline">
          {stage}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{company}</p>
          <p className="font-semibold text-card-foreground">${value.toLocaleString()}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Probability</span>
            <span className="text-card-foreground">{probability}%</span>
          </div>
          <Progress value={probability} className="h-2" />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Close: {closeDate}</span>
          <span>Owner: {owner}</span>
        </div>
      </div>
    </div>
  );
};