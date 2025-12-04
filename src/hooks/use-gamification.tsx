import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Badge {
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
  badge?: Badge;
}

interface UserStreak {
  id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

const getStreakLabel = (type: string) => {
  const labels: Record<string, string> = {
    login: 'Login',
    transaction: 'Transações',
    savings: 'Poupança'
  };
  return labels[type] || type;
};

export function useGamification(userId: string | null) {
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const initialLoadDone = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const previousStreaks = useRef<UserStreak[]>([]);
  const previousBadgeCount = useRef<number>(0);

  // Calculate total points using useMemo to avoid recalculations
  const totalPoints = useMemo(() => {
    const badgeIds = userBadges.map(ub => ub.badge_id);
    return badges
      .filter(b => badgeIds.includes(b.id))
      .reduce((sum, b) => sum + (b.points || 0), 0);
  }, [badges, userBadges]);

  // Check for milestone achievements
  const checkMilestoneAchievement = useCallback((newStreaks: UserStreak[]) => {
    if (previousStreaks.current.length === 0) {
      previousStreaks.current = newStreaks;
      return;
    }

    newStreaks.forEach(newStreak => {
      const oldStreak = previousStreaks.current.find(s => s.streak_type === newStreak.streak_type);
      const oldValue = oldStreak?.current_streak || 0;
      const newValue = newStreak.current_streak || 0;

      // Check if crossed a milestone
      STREAK_MILESTONES.forEach(milestone => {
        if (oldValue < milestone && newValue >= milestone) {
          toast({
            title: `🔥 Milestone alcançado!`,
            description: `${getStreakLabel(newStreak.streak_type)}: ${milestone} dias consecutivos!`,
          });
        }
      });
    });

    previousStreaks.current = newStreaks;
  }, []);

  // Check for new badge achievements
  const checkBadgeAchievement = useCallback((newBadges: UserBadge[], allBadges: Badge[]) => {
    if (previousBadgeCount.current === 0) {
      previousBadgeCount.current = newBadges.length;
      return;
    }

    if (newBadges.length > previousBadgeCount.current) {
      // Find the newest badge (most recent earned_at)
      const sortedBadges = [...newBadges].sort((a, b) => 
        new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
      );
      const newestUserBadge = sortedBadges[0];
      const badge = allBadges.find(b => b.id === newestUserBadge.badge_id);

      if (badge) {
        toast({
          title: `🏆 Nova conquista desbloqueada!`,
          description: `${badge.name}: ${badge.description}`,
        });
      }
    }

    previousBadgeCount.current = newBadges.length;
  }, []);

  // Single effect to load all data - only runs once per userId
  useEffect(() => {
    // Reset if userId changes
    if (currentUserId.current !== userId) {
      initialLoadDone.current = false;
      currentUserId.current = userId;
    }

    if (initialLoadDone.current) return;

    const loadData = async () => {
      setLoading(true);

      // Always fetch badges (public data)
      const { data: badgesData } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('requirement_value');

      if (badgesData) {
        setBadges(badgesData);
      }

      // Only fetch user data if we have a userId
      if (userId) {
        const [streaksRes, userBadgesRes] = await Promise.all([
          supabase.from('user_streaks').select('*').eq('profile_id', userId),
          supabase.from('user_badges').select('*').eq('profile_id', userId)
        ]);

        if (streaksRes.data) {
          setStreaks(streaksRes.data);
          previousStreaks.current = streaksRes.data;
        }
        if (userBadgesRes.data) {
          setUserBadges(userBadgesRes.data);
          previousBadgeCount.current = userBadgesRes.data.length;
        }
      }

      setLoading(false);
      initialLoadDone.current = true;
    };

    loadData();
  }, [userId]);

  const updateLoginStreak = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase.rpc('update_login_streak', { p_profile_id: userId });
      
      // Optimistic update - fetch only streaks without triggering full reload
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('profile_id', userId);
      
      if (data) {
        checkMilestoneAchievement(data);
        setStreaks(data);
      }
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  }, [userId]);

  const updateTransactionStreak = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('profile_id', userId)
      .eq('streak_type', 'transaction')
      .single();

    if (!existing) {
      await supabase.from('user_streaks').insert({
        profile_id: userId,
        streak_type: 'transaction',
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      });
    } else if (existing.last_activity_date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const isConsecutive = existing.last_activity_date === yesterdayStr;
      const newStreak = isConsecutive ? existing.current_streak + 1 : 1;

      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(existing.longest_streak, newStreak),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }

    // Fetch updated streaks
    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('profile_id', userId);
    
    if (data) {
      checkMilestoneAchievement(data);
      setStreaks(data);
    }
  }, [userId]);

  const checkAndAwardBadge = useCallback(async (badgeId: string) => {
    if (!userId) return false;

    const alreadyEarned = userBadges.some(ub => ub.badge_id === badgeId);
    if (alreadyEarned) return false;

    const { error } = await supabase.from('user_badges').insert({
      profile_id: userId,
      badge_id: badgeId,
    });

    if (!error) {
      // Show toast for the newly earned badge
      const badge = badges.find(b => b.id === badgeId);
      if (badge) {
        toast({
          title: `🏆 Nova conquista desbloqueada!`,
          description: `${badge.name}: ${badge.description}`,
        });
      }

      // Fetch updated user badges
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('profile_id', userId);
      
      if (data) {
        setUserBadges(data);
      }
      return true;
    }
    return false;
  }, [userId, userBadges]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    
    const [streaksRes, userBadgesRes] = await Promise.all([
      supabase.from('user_streaks').select('*').eq('profile_id', userId),
      supabase.from('user_badges').select('*').eq('profile_id', userId)
    ]);

    if (streaksRes.data) setStreaks(streaksRes.data);
    if (userBadgesRes.data) setUserBadges(userBadgesRes.data);
  }, [userId]);

  return {
    streaks,
    badges,
    userBadges,
    loading,
    totalPoints,
    updateLoginStreak,
    updateTransactionStreak,
    checkAndAwardBadge,
    refetch,
  };
}
