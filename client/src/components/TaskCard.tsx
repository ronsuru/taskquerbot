import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Campaign } from "@shared/schema";

interface TaskCardProps {
  campaign: Campaign;
  onStartTask: () => void;
}

export default function TaskCard({ campaign, onStartTask }: TaskCardProps) {
  const platformIcons = {
    twitter: "fab fa-twitter",
    tiktok: "fab fa-tiktok",
    facebook: "fab fa-facebook", 
    telegram: "fab fa-telegram"
  };

  const platformColors = {
    twitter: "bg-blue-500",
    tiktok: "bg-pink-500",
    facebook: "bg-blue-600",
    telegram: "bg-telegram-blue"
  };

  const progressPercentage = ((campaign.totalSlots - campaign.availableSlots) / campaign.totalSlots) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${platformColors[campaign.platform as keyof typeof platformColors]} rounded-lg flex items-center justify-center`}>
              <i className={`${platformIcons[campaign.platform as keyof typeof platformIcons]} text-white text-sm`} />
            </div>
            <span className="text-sm font-medium text-slate-900 capitalize">{campaign.platform}</span>
          </div>
          <Badge variant="secondary" className="bg-success-green bg-opacity-10 text-success-green">
            {campaign.status}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">{campaign.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-3">{campaign.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Reward:</span>
            <span className="font-semibold text-success-green">{campaign.rewardAmount} USDT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Available Slots:</span>
            <span className="font-medium text-slate-900">{campaign.availableSlots}/{campaign.totalSlots}</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
        
        <Button 
          className={`w-full ${platformColors[campaign.platform as keyof typeof platformColors]} hover:opacity-90`}
          onClick={onStartTask}
          disabled={campaign.availableSlots <= 0}
        >
          {campaign.availableSlots <= 0 ? "Fully Booked" : "Start Task"}
        </Button>
      </CardContent>
    </Card>
  );
}
