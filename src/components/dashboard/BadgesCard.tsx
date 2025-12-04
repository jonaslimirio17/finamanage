import { useState } from 'react';
import { 
  Award, Lock, Crown, Target, Trophy, Hash, Gem, TrendingUp, 
  Coins, Wallet, Banknote, LogIn, Calendar, CalendarCheck, 
  ClipboardCheck, BookOpen, GraduationCap, Brain, LucideIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePremium } from '@/hooks/use-premium';

const iconMap: Record<string, LucideIcon> = {
  Target, Trophy, Crown, Hash, Gem, TrendingUp, Coins, Wallet, Banknote,
  LogIn, Calendar, CalendarCheck, ClipboardCheck, Award, BookOpen, GraduationCap, Brain
};

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
}

interface BadgesCardProps {
  badges: BadgeData[];
  userBadges: UserBadge[];
  totalPoints: number;
  loading?: boolean;
}

const categoryColors: Record<string, string> = {
  financial: 'bg-green-500/10 text-green-500 border-green-500/20',
  consistency: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  education: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Award;
}

export function BadgesCard({ badges, userBadges, totalPoints, loading }: BadgesCardProps) {
  const { isPremium } = usePremium();
  const [dialogOpen, setDialogOpen] = useState(false);

  const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);
  const earnedBadges = badges.filter((b) => earnedBadgeIds.includes(b.id));
  const recentBadges = earnedBadges.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPremium) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
          <Lock className="h-8 w-8 text-primary mb-2" />
          <p className="text-center text-sm font-medium mb-2">
            Conquistas são exclusivas para assinantes Premium
          </p>
          <Button size="sm" variant="default" asChild>
            <a href="/planos">
              <Crown className="h-4 w-4 mr-2" />
              Ver planos
            </a>
          </Button>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="opacity-30">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-12 bg-muted rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
          <Badge variant="secondary" className="font-bold">
            {totalPoints} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          {recentBadges.length > 0 ? (
            recentBadges.map((badge) => {
              const IconComponent = getIconComponent(badge.icon);
              return (
                <div
                  key={badge.id}
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${categoryColors[badge.category]} border`}
                  title={badge.name}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma conquista ainda. Continue usando o app!
            </p>
          )}
          {earnedBadges.length > 3 && (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              +{earnedBadges.length - 3}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              Ver todas ({earnedBadges.length}/{badges.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Todas as Conquistas
                <Badge variant="secondary" className="ml-2">
                  {totalPoints} pontos
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="all" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="consistency">Consistência</TabsTrigger>
                <TabsTrigger value="education">Educação</TabsTrigger>
              </TabsList>

              {['all', 'financial', 'consistency', 'education'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {badges
                      .filter((b) => tab === 'all' || b.category === tab)
                      .map((badge) => {
                        const isEarned = earnedBadgeIds.includes(badge.id);
                        const IconComponent = getIconComponent(badge.icon);
                        const earnedData = userBadges.find((ub) => ub.badge_id === badge.id);

                        return (
                          <div
                            key={badge.id}
                            className={`p-3 rounded-lg border transition-all ${
                              isEarned
                                ? `${categoryColors[badge.category]} hover:scale-[1.02]`
                                : 'bg-muted/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isEarned ? categoryColors[badge.category] : 'bg-muted'
                                }`}
                              >
                                {isEarned ? (
                                  <IconComponent className="h-5 w-5" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{badge.name}</p>
                                <p className="text-xs text-muted-foreground">+{badge.points} pts</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {badge.description}
                            </p>
                            {isEarned && earnedData && (
                              <p className="text-xs text-primary mt-1">
                                Conquistado em{' '}
                                {new Date(earnedData.earned_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
