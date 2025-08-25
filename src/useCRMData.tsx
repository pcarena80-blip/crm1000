import { useQuery } from "@tanstack/react-query";

interface CRMData {
  metrics: {
    newLeadsThisWeek: number;
    conversionRate: number;
    dealsWonThisMonth: number;
    totalRevenue: number;
  };
  leads: Array<{
    id: number;
    name: string;
    email: string;
    company: string;
    status: string;
    value: number;
    source: string;
    createdAt: string;
  }>;
  deals: Array<{
    id: number;
    title: string;
    company: string;
    value: number;
    stage: string;
    probability: number;
    closeDate: string;
    owner: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
    assignee: string;
    leadId: number | null;
  }>;
  activities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export const useCRMData = () => {
  return useQuery<CRMData>({
    queryKey: ["crm-data"],
    queryFn: async () => {
      const response = await fetch("/api/crm-data.json"); 
      if (!response.ok) {
        throw new Error("Failed to fetch CRM data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
