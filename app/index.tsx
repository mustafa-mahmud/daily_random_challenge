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
import { Calendar } from 'react-native-calendars';
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

  // 📅 Calendar & History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  const confettiRef = useRef<any>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // 📅 Local Timezone অনুযায়ী আজকের তারিখ পাওয়ার হেলপার ফাংশন
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🗓️ বাটনে সুন্দর করে আজকের তারিখ দেখানোর ফাংশন (যেমন: Jul 26)
  const getHeaderDateString = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTodayKey = () => `status_${getFormattedDate(new Date())}`;
  const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `status_${getFormattedDate(yesterday)}`;
  };
  const getShuffleKey = () => `shuffle_${getFormattedDate(new Date())}`;
  const getCustomChallengeKey = () =>
    `challenge_${getFormattedDate(new Date())}`;

  const handleReset = async () => {
    await AsyncStorage.clear();
    setStatus('pending');
    setTreeLevel(1);
    setStreak(0);
    setShuffleLeft(5);
    setUnlockedBadges([]);
    setMarkedDates({});
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

      // 📅 ক্যালেন্ডার হিস্ট্রি লোড
      await fetchHistoryData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📅 AsyncStorage থেকে আগের স্ট্যাটাস নিয়ে ক্যালেন্ডারে ফরম্যাট করা
  const fetchHistoryData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const statusKeys = keys.filter((key) => key.startsWith('status_'));
      const keyValues = await AsyncStorage.multiGet(statusKeys);

      const newMarkedDates: any = {};

      keyValues.forEach(([key, val]) => {
        const dateStr = key.replace('status_', '');
        if (val === 'completed') {
          newMarkedDates[dateStr] = {
            selected: true,
            selectedColor: '#10B981', // 🟢 Completed Green
            textColor: '#FFFFFF',
          };
        } else if (val === 'failed') {
          newMarkedDates[dateStr] = {
            selected: true,
            selectedColor: '#EF4444', // 🔴 Failed Red
            textColor: '#FFFFFF',
          };
        }
      });

      setMarkedDates(newMarkedDates);
    } catch (error) {
      console.error('Error fetching history:', error);
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

      if (confettiRef.current) confettiRef.current.start();
      setTimeout(() => triggerShake(), 500);

      const newLevel = treeLevel + 1;
      const newStreak = streak + 1;

      setStatus('completed');
      setTreeLevel(newLevel);
      setStreak(newStreak);

      await AsyncStorage.setItem(getTodayKey(), 'completed');
      await AsyncStorage.setItem('tree_level', newLevel.toString());
      await AsyncStorage.setItem('streak_count', newStreak.toString());

      // 📅 ক্যালেন্ডার হিস্ট্রি আপডেট
      await fetchHistoryData();

      // 🏅 ব্যাজ আনলক লজিক
      const newlyEarnedBadge = BADGES.find((b) => b.days === newStreak);
      if (newlyEarnedBadge && !unlockedBadges.includes(newlyEarnedBadge.id)) {
        const updatedBadgesList = [...unlockedBadges, newlyEarnedBadge.id];
        setUnlockedBadges(updatedBadgesList);
        await AsyncStorage.setItem(
          'unlocked_badges',
          JSON.stringify(updatedBadgesList),
        );

        setTimeout(() => setEarnedBadgeModal(newlyEarnedBadge), 1000);
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

      // 📅 ক্যালেন্ডার হিস্ট্রি আপডেট
      await fetchHistoryData();
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

  const todayStr = getFormattedDate(new Date());

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
          <View className="flex-row justify-between items-center w-full px-2">
            <Text className="text-xl font-bold color-slate-800">
              🌱 Daily Challenge
            </Text>

            {/* 🗓️ Dynamic Date History Button */}
            <TouchableOpacity
              onPress={() => setShowHistoryModal(true)}
              className="bg-emerald-100 px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Text className="text-xs font-bold color-emerald-700">
                🗓️ {getHeaderDateString()} | History
              </Text>
            </TouchableOpacity>
          </View>

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
                <View key={b.id} className="items-center">
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
              <Text className="text-lg color-emerald-600 font-bold mt-1">
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

      {/* 📅 Calendar History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="bg-white rounded-3xl p-5 w-full max-w-md">
            <Text className="text-xl font-bold color-slate-800 text-center mb-4">
              📅 Challenge History
            </Text>

            <Calendar
              key={todayStr}
              current={todayStr}
              markedDates={{
                ...markedDates,
                ...(markedDates[todayStr]
                  ? {}
                  : {
                      [todayStr]: {
                        today: true,
                        selected: true,
                        selectedColor: '#E2E8F0',
                        textColor: '#0F172A',
                      },
                    }),
              }}
              theme={{
                todayTextColor: '#10B981',
                arrowColor: '#10B981',
                indicatorColor: '#10B981',
                selectedDayBackgroundColor: '#10B981',
              }}
            />

            {/* Indicator Legend */}
            <View className="flex-row justify-center gap-6 mt-4">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-emerald-500" />
                <Text className="text-xs color-slate-600 font-semibold">
                  Completed
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-rose-500" />
                <Text className="text-xs color-slate-600 font-semibold">
                  Failed
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              className="bg-slate-800 py-3 rounded-xl items-center mt-5"
            >
              <Text className="color-white font-bold text-base">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
