import { Flame, Calendar, ClipboardCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Streak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface StreakCardProps {
  streaks: Streak[];
  loading?: boolean;
}

const streakConfig = {
  login: {
    label: 'Login Diário',
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    milestones: [7, 30, 90],
  },
  transaction: {
    label: 'Transações',
    icon: ClipboardCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    milestones: [7, 30, 60],
  },
  savings: {
    label: 'Economia',
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    milestones: [7, 14, 30],
  },
};

export function StreakCard({ streaks, loading }: StreakCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Suas Sequências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNextMilestone = (current: number, milestones: number[]) => {
    return milestones.find((m) => m > current) || milestones[milestones.length - 1];
  };

  const getProgress = (current: number, milestones: number[]) => {
    const nextMilestone = getNextMilestone(current, milestones);
    const prevMilestone = milestones.filter((m) => m < nextMilestone).pop() || 0;
    return ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  };

  // Create default streaks if none exist
  const defaultStreakTypes = ['login', 'transaction', 'savings'] as const;
  const displayStreaks = defaultStreakTypes.map((type) => {
    const existing = streaks.find((s) => s.streak_type === type);
    return existing || {
      streak_type: type,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Suas Sequências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayStreaks.map((streak) => {
          const config = streakConfig[streak.streak_type as keyof typeof streakConfig];
          if (!config) return null;

          const Icon = config.icon;
          const nextMilestone = getNextMilestone(streak.current_streak, config.milestones);
          const progress = getProgress(streak.current_streak, config.milestones);

          return (
            <div
              key={streak.streak_type}
              className={`p-3 rounded-lg ${config.bgColor} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className={`h-4 w-4 ${streak.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className={`font-bold ${streak.current_streak > 0 ? config.color : 'text-muted-foreground'}`}>
                    {streak.current_streak} dias
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2 mb-1" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Próxima conquista: {nextMilestone} dias</span>
                <span>Recorde: {streak.longest_streak} dias</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
