import { Button } from "@/components/ui/button";

interface TaskItemProps {
  title: string;
  dueDate: string;
  onMarkDone: () => void;
}

export const TaskItem = ({ title, dueDate, onMarkDone }: TaskItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
      <div>
        <p className="text-sm font-medium text-card-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Due: {dueDate}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onMarkDone}
        className="text-primary hover:bg-primary hover:text-primary-foreground"
      >
        Mark done
      </Button>
    </div>
  );
};