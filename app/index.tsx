import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  getTodayChallenge,
  challenges as importedChallenges,
} from '../src/data/challenges';
import {
  registerForPushNotificationsAsync,
  scheduleDailyNotification,
} from '../src/services/notifications';

// Local Animations Import
import happyAnim from '../assets/animations/happy.json';
import plantAnim from '../assets/animations/plant.json';
import sadAnim from '../assets/animations/sad.json';

// 🏅 Badges Data Definition
interface Badge {
  id: string;
  title: string;
  days: number;
  icon: string;
  desc: string;
}

const BADGES: Badge[] = [
  {
    id: '3_days',
    title: 'Sprout',
    days: 3,
    icon: '🌱',
    desc: '৩ দিন টানা চ্যালেঞ্জ সম্পন্ন',
  },
  {
    id: '7_days',
    title: 'Warrior',
    days: 7,
    icon: '🔥',
    desc: '৭ দিন টানা চ্যালেঞ্জ সম্পন্ন',
  },
  {
    id: '15_days',
    title: 'Guardian',
    days: 15,
    icon: '🌳',
    desc: '১৫ দিন টানা চ্যালেঞ্জ সম্পন্ন',
  },
  {
    id: '30_days',
    title: 'Champion',
    days: 30,
    icon: '🏆',
    desc: '৩০ দিন টানা চ্যালেঞ্জ সম্পন্ন',
  },
];

const challengesList = importedChallenges || [
  'Drink 2 liters of water today',
  'Walk 5,000 steps',
  'Read 10 pages of a book',
  'Do 15 minutes of stretching',
  'No sugar for the whole day',
];

export default function App() {
  const [todayChallenge, setTodayChallenge] = useState('');
  const [status, setStatus] = useState('pending');
  const [treeLevel, setTreeLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [shuffleLeft, setShuffleLeft] = useState(5);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [earnedBadgeModal, setEarnedBadgeModal] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  const confettiRef = useRef<any>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const getTodayKey = () => `status_${new Date().toISOString().split('T')[0]}`;
  const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `status_${yesterday.toISOString().split('T')[0]}`;
  };
  const getShuffleKey = () =>
    `shuffle_${new Date().toISOString().split('T')[0]}`;
  const getCustomChallengeKey = () =>
    `challenge_${new Date().toISOString().split('T')[0]}`;

  const handleReset = async () => {
    await AsyncStorage.clear();
    setStatus('pending');
    setTreeLevel(1);
    setStreak(0);
    setShuffleLeft(5);
    setUnlockedBadges([]);
    setTodayChallenge(getTodayChallenge());
  };

  useEffect(() => {
    loadData();
    initNotifications();
  }, []);

  const initNotifications = async () => {
    try {
      await registerForPushNotificationsAsync();
      await scheduleDailyNotification();
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  const loadData = async () => {
    try {
      const savedStatus = await AsyncStorage.getItem(getTodayKey());
      const savedLevel = await AsyncStorage.getItem('tree_level');
      const savedStreak = await AsyncStorage.getItem('streak_count');
      const savedShuffle = await AsyncStorage.getItem(getShuffleKey());
      const savedCustomChallenge = await AsyncStorage.getItem(
        getCustomChallengeKey(),
      );
      const savedBadges = await AsyncStorage.getItem('unlocked_badges');

      const yesterdayStatus = await AsyncStorage.getItem(getYesterdayKey());

      if (savedCustomChallenge) {
        setTodayChallenge(savedCustomChallenge);
      } else {
        setTodayChallenge(getTodayChallenge());
      }

      setShuffleLeft(savedShuffle !== null ? parseInt(savedShuffle, 10) : 5);

      let currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;
      if (yesterdayStatus !== 'completed' && savedStatus !== 'completed') {
        currentStreak = 0;
        await AsyncStorage.setItem('streak_count', '0');
      }

      setStreak(currentStreak);
      if (savedStatus) setStatus(savedStatus);
      if (savedLevel) setTreeLevel(parseInt(savedLevel, 10));
      if (savedBadges) setUnlockedBadges(JSON.parse(savedBadges));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = async () => {
    if (shuffleLeft <= 0 || status !== 'pending') return;

    const available = challengesList.filter((c) => c !== todayChallenge);
    if (available.length === 0) return;

    const newChallenge =
      available[Math.floor(Math.random() * available.length)];
    const updatedShuffle = shuffleLeft - 1;

    setTodayChallenge(newChallenge);
    setShuffleLeft(updatedShuffle);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await AsyncStorage.setItem(getCustomChallengeKey(), newChallenge);
    await AsyncStorage.setItem(getShuffleKey(), updatedShuffle.toString());
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 20,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -20,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 18,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -18,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 12,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -12,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 6,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -6,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 30,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleComplete = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Vibration.vibrate(300);

      if (confettiRef.current) {
        confettiRef.current.start();
      }

      setTimeout(() => triggerShake(), 500);

      const newLevel = treeLevel + 1;
      const newStreak = streak + 1;

      setStatus('completed');
      setTreeLevel(newLevel);
      setStreak(newStreak);

      await AsyncStorage.setItem(getTodayKey(), 'completed');
      await AsyncStorage.setItem('tree_level', newLevel.toString());
      await AsyncStorage.setItem('streak_count', newStreak.toString());

      // 🏅 ব্যাজ আনলক করার লজিক চেক
      const newlyEarnedBadge = BADGES.find((b) => b.days === newStreak);
      if (newlyEarnedBadge && !unlockedBadges.includes(newlyEarnedBadge.id)) {
        const updatedBadgesList = [...unlockedBadges, newlyEarnedBadge.id];
        setUnlockedBadges(updatedBadgesList);
        await AsyncStorage.setItem(
          'unlocked_badges',
          JSON.stringify(updatedBadgesList),
        );

        // পপআপ মোডাল দেখানো
        setTimeout(() => {
          setEarnedBadgeModal(newlyEarnedBadge);
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving complete status:', error);
    }
  };

  const handleFail = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate([0, 150, 100, 150]);

      setTimeout(() => triggerShake(), 500);

      setStreak(0);
      setStatus('failed');

      await AsyncStorage.setItem(getTodayKey(), 'failed');
      await AsyncStorage.setItem('streak_count', '0');
    } catch (error) {
      console.error('Error saving fail status:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between py-10 px-5">
      <StatusBar barStyle="dark-content" />

      <Animated.View
        style={{
          transform: [{ translateX: shakeAnimation }],
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Header Area */}
        <View className="items-center mt-2 w-full">
          <Text className="text-2xl font-bold color-slate-800">
            🌱 Daily Challenge
          </Text>
          <View className="flex-row items-center gap-3 mt-1">
            <Text className="text-xs font-semibold color-emerald-600">
              Tree Level: {treeLevel}
            </Text>
            <Text className="text-xs font-bold color-orange-500">
              🔥 Streak: {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* 🏅 Badges Gallery Bar */}
          <View className="flex-row justify-around w-full bg-white p-3 rounded-xl mt-3 shadow-sm">
            {BADGES.map((b) => {
              const isUnlocked = unlockedBadges.includes(b.id);
              return (
                <View key={b.id} className="items-center opacity-100">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isUnlocked ? 'bg-amber-100' : 'bg-slate-100'
                    }`}
                  >
                    <Text className="text-lg">
                      {isUnlocked ? b.icon : '🔒'}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold mt-1 color-slate-600">
                    {b.days}d
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Button onPress={handleReset} title="Reset Progress" />

        {/* Challenge Card */}
        <View className="bg-white w-full p-6 rounded-2xl items-center shadow-md shadow-slate-200 elevation-3">
          <View className="flex-row justify-between items-center w-full mb-3">
            <Text className="text-xs font-black color-slate-400 tracking-widest">
              TODAY'S TASK
            </Text>

            {status === 'pending' && (
              <TouchableOpacity
                onPress={handleShuffle}
                disabled={shuffleLeft === 0}
                className={`px-3 py-1 rounded-full flex-row items-center gap-1 ${
                  shuffleLeft > 0 ? 'bg-amber-100' : 'bg-slate-100'
                }`}
              >
                <Text className="text-xs font-bold color-amber-700">
                  🎲 Shuffle ({shuffleLeft})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-xl font-semibold color-slate-800 text-center my-2">
            {todayChallenge}
          </Text>
        </View>

        {/* Animation Area */}
        <View className="items-center justify-center my-2 h-56 w-56">
          {status === 'pending' && (
            <LottieView
              source={plantAnim}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {status === 'completed' && (
            <View className="items-center">
              <LottieView
                source={happyAnim}
                autoPlay
                loop={false}
                style={{ width: 180, height: 180 }}
              />
              <Text className="text-lg color-emerald-600 font-bold my-1 text-center">
                Great job! Tree Grew Up! 🌳
              </Text>
            </View>
          )}

          {status === 'failed' && (
            <View className="items-center">
              <LottieView
                source={sadAnim}
                autoPlay
                loop
                style={{ width: 160, height: 160 }}
              />
              <Text className="text-lg color-rose-500 font-bold mt-1">
                Challenge Failed! 😢
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {status === 'pending' ? (
          <View className="flex-row gap-4 w-full">
            <TouchableOpacity
              onPress={handleComplete}
              className="flex-1 bg-emerald-500 py-4 rounded-xl items-center active:opacity-80 shadow-sm"
            >
              <Text className="color-white font-bold text-base">Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFail}
              className="flex-1 bg-rose-500 py-4 rounded-xl items-center active:opacity-80 shadow-sm"
            >
              <Text className="color-white font-bold text-base">Failed</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full bg-slate-200 py-4 rounded-xl items-center">
            <Text className="color-slate-600 font-semibold text-base text-center">
              See you tomorrow for a new challenge! ✨
            </Text>
          </View>
        )}
      </Animated.View>

      {/* 🏅 Badge Unlock Celebration Modal */}
      <Modal
        visible={earnedBadgeModal !== null}
        transparent
        animationType="slide"
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-3xl p-6 items-center w-full max-w-sm">
            <Text className="text-6xl mb-2">{earnedBadgeModal?.icon}</Text>
            <Text className="text-2xl font-extrabold color-emerald-600 mb-1">
              Badge Unlocked!
            </Text>
            <Text className="text-lg font-bold color-slate-800 mb-2">
              {earnedBadgeModal?.title}
            </Text>
            <Text className="text-sm color-slate-500 text-center mb-6">
              {earnedBadgeModal?.desc}
            </Text>

            <TouchableOpacity
              onPress={() => setEarnedBadgeModal(null)}
              className="bg-emerald-500 py-3 px-8 rounded-full"
            >
              <Text className="color-white font-bold text-base">Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confetti Cannon */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
      />
    </SafeAreaView>
  );
}
