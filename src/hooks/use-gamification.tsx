import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useGamification(userId: string | null) {
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  const fetchStreaks = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('profile_id', userId);

    if (!error && data) {
      setStreaks(data);
    }
  }, [userId]);

  const fetchBadges = useCallback(async () => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('requirement_value');

    if (!error && data) {
      setBadges(data);
    }
  }, []);

  const fetchUserBadges = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('profile_id', userId);

    if (!error && data) {
      setUserBadges(data);
      
      // Calculate total points
      const badgeIds = data.map(ub => ub.badge_id);
      const earnedBadges = badges.filter(b => badgeIds.includes(b.id));
      const points = earnedBadges.reduce((sum, b) => sum + b.points, 0);
      setTotalPoints(points);
    }
  }, [userId, badges]);

  const updateLoginStreak = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase.rpc('update_login_streak', { p_profile_id: userId });
      await fetchStreaks();
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  }, [userId, fetchStreaks]);

  const updateTransactionStreak = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    // Check if streak exists
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

    await fetchStreaks();
  }, [userId, fetchStreaks]);

  const checkAndAwardBadge = useCallback(async (badgeId: string) => {
    if (!userId) return false;

    // Check if already earned
    const alreadyEarned = userBadges.some(ub => ub.badge_id === badgeId);
    if (alreadyEarned) return false;

    const { error } = await supabase.from('user_badges').insert({
      profile_id: userId,
      badge_id: badgeId,
    });

    if (!error) {
      await fetchUserBadges();
      return true;
    }
    return false;
  }, [userId, userBadges, fetchUserBadges]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBadges();
      if (userId) {
        await fetchStreaks();
        await fetchUserBadges();
      }
      setLoading(false);
    };

    loadData();
  }, [userId, fetchBadges, fetchStreaks, fetchUserBadges]);

  return {
    streaks,
    badges,
    userBadges,
    loading,
    totalPoints,
    updateLoginStreak,
    updateTransactionStreak,
    checkAndAwardBadge,
    refetch: async () => {
      await fetchStreaks();
      await fetchUserBadges();
    },
  };
}
