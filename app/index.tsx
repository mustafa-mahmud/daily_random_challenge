import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
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
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import ConfettiCannon from 'react-native-confetti-cannon';
import { captureRef } from 'react-native-view-shot';
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

  // 🌙 Dark Mode State (Default True)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ✍️ Custom Challenge States
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // 📅 Calendar & History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  // 📸 Share Card Ref
  const cardRef = useRef<View>(null);

  const confettiRef = useRef<any>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const handleReset = async () => {
    await AsyncStorage.clear();
    setStatus('pending');
    setTreeLevel(1);
    setStreak(0);
    setShuffleLeft(5);
    setUnlockedBadges([]);
    setMarkedDates({});
    setIsDarkMode(true); // 🌙 Default to dark mode on reset
    setTodayChallenge(getTodayChallenge());
  };

  // 📅 Local Timezone অনুযায়ী আজকের তারিখ পাওয়ার হেলপার ফাংশন
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
      const savedTheme = await AsyncStorage.getItem('theme_dark_mode');

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
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      } else {
        setIsDarkMode(true); // 🌙 Default dark mode if no saved preference
      }

      await fetchHistoryData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🌙 ডার্ক মোড টগল হ্যান্ডলার
  const toggleDarkMode = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem('theme_dark_mode', JSON.stringify(nextMode));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // 📸 সোশ্যাল মিডিয়ায় শেয়ার করার হ্যান্ডলার
  const handleShareProgress = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        alert('তোমার ডিভাইসে শেয়ার সুবিধাটি উপলভ্য নয়।');
        return;
      }

      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 0.9,
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your progress with friends!',
        });
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
  };

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
            selectedColor: '#10B981',
            textColor: '#FFFFFF',
          };
        } else if (val === 'failed') {
          newMarkedDates[dateStr] = {
            selected: true,
            selectedColor: '#EF4444',
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

  const handleAddCustomChallenge = async () => {
    if (!customInput.trim()) return;

    const newChallenge = customInput.trim();
    setTodayChallenge(newChallenge);
    await AsyncStorage.setItem(getCustomChallengeKey(), newChallenge);

    setCustomInput('');
    setShowCustomModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      await fetchHistoryData();

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

      await fetchHistoryData();
    } catch (error) {
      console.error('Error saving fail status:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${
          isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
        }`}
      >
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  const todayStr = getFormattedDate(new Date());

  return (
    <SafeAreaView
      className={`flex-1 justify-between py-10 px-5 ${
        isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
      }`}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

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
            <Text
              className={`text-xl font-bold ${
                isDarkMode ? 'color-slate-100' : 'color-slate-800'
              }`}
            >
              🌱 Daily Challenge
            </Text>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={toggleDarkMode}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <Text className="text-base">{isDarkMode ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowHistoryModal(true)}
                className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${
                  isDarkMode ? 'bg-emerald-950' : 'bg-emerald-100'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isDarkMode ? 'color-emerald-400' : 'color-emerald-700'
                  }`}
                >
                  🗓️ {getHeaderDateString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center gap-3 mt-1">
            <Text
              className={`text-xs font-semibold ${
                isDarkMode ? 'color-emerald-400' : 'color-emerald-600'
              }`}
            >
              Tree Level: {treeLevel}
            </Text>
            <Text className="text-xs font-bold color-orange-500">
              🔥 Streak: {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Badges Gallery Bar */}
          <View
            className={`flex-row justify-around w-full p-3 rounded-xl mt-3 shadow-sm ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            {BADGES.map((b) => {
              const isUnlocked = unlockedBadges.includes(b.id);
              return (
                <View key={b.id} className="items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isUnlocked
                        ? isDarkMode
                          ? 'bg-amber-900/50'
                          : 'bg-amber-100'
                        : isDarkMode
                          ? 'bg-slate-700'
                          : 'bg-slate-100'
                    }`}
                  >
                    <Text className="text-lg">
                      {isUnlocked ? b.icon : '🔒'}
                    </Text>
                  </View>
                  <Text
                    className={`text-[10px] font-bold mt-1 ${
                      isDarkMode ? 'color-slate-400' : 'color-slate-600'
                    }`}
                  >
                    {b.days}d
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Button onPress={handleReset} title="Reset Progress" color="#EF4444" />

        {/* 📸 Challenge Card (Capturable for Sharing) */}
        <View
          ref={cardRef}
          collapsable={false}
          className={`w-full p-6 rounded-2xl items-center shadow-md ${
            isDarkMode
              ? 'bg-slate-800 shadow-none'
              : 'bg-white shadow-slate-200 elevation-3'
          }`}
        >
          <View className="flex-row justify-between items-center w-full mb-3">
            <Text
              className={`text-xs font-black tracking-widest ${
                isDarkMode ? 'color-slate-400' : 'color-slate-400'
              }`}
            >
              TODAY'S TASK
            </Text>

            {status === 'pending' && (
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setShowCustomModal(true)}
                  className={`px-2.5 py-1 rounded-full ${
                    isDarkMode ? 'bg-blue-950' : 'bg-blue-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isDarkMode ? 'color-blue-400' : 'color-blue-700'
                    }`}
                  >
                    ✍️ Custom
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShuffle}
                  disabled={shuffleLeft === 0}
                  className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${
                    shuffleLeft > 0
                      ? isDarkMode
                        ? 'bg-amber-950'
                        : 'bg-amber-100'
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isDarkMode ? 'color-amber-400' : 'color-amber-700'
                    }`}
                  >
                    🎲 ({shuffleLeft})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text
            className={`text-xl font-semibold text-center my-2 ${
              isDarkMode ? 'color-slate-100' : 'color-slate-800'
            }`}
          >
            {todayChallenge}
          </Text>

          {/* 📸 Card Branding when shared */}
          {status === 'completed' && (
            <View className="mt-3 bg-emerald-500/10 px-3 py-1 rounded-full flex-row items-center gap-1">
              <Text className="text-xs font-bold color-emerald-600">
                ✅ Completed! 🔥 {streak} Days Streak
              </Text>
            </View>
          )}
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
              <Text
                className={`text-lg font-bold mt-1 ${
                  isDarkMode ? 'color-rose-400' : 'color-rose-500'
                }`}
              >
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
          <View className="w-full gap-3">
            {/* 📸 Share Progress Button (Only when completed) */}
            {status === 'completed' && (
              <TouchableOpacity
                onPress={handleShareProgress}
                className="w-full bg-emerald-500 py-3.5 rounded-xl items-center shadow-sm flex-row justify-center gap-2 active:opacity-80"
              >
                <Text className="color-white font-bold text-base">
                  📸 Share Progress
                </Text>
              </TouchableOpacity>
            )}

            <View
              className={`w-full py-3.5 rounded-xl items-center ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            >
              <Text
                className={`font-semibold text-sm text-center ${
                  isDarkMode ? 'color-slate-300' : 'color-slate-600'
                }`}
              >
                See you tomorrow for a new challenge! ✨
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ✍️ Custom Challenge Modal */}
      <Modal visible={showCustomModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/70 px-5">
          <View
            className={`rounded-3xl p-6 w-full max-w-md ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <Text
              className={`text-xl font-bold text-center mb-1 ${
                isDarkMode ? 'color-slate-100' : 'color-slate-800'
              }`}
            >
              ✍️ Set Custom Challenge
            </Text>
            <Text
              className={`text-xs text-center mb-4 ${
                isDarkMode ? 'color-slate-400' : 'color-slate-500'
              }`}
            >
              তোমার আজকের নিজের পছন্দমতো চ্যালেঞ্জ লিখে নিচে সেট করো
            </Text>

            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="e.g. Read 20 mins, Practice Coding..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              className={`border rounded-xl p-4 text-base mb-5 ${
                isDarkMode
                  ? 'bg-slate-700 color-slate-100 border-slate-600'
                  : 'bg-slate-100 color-slate-800 border-slate-200'
              }`}
              multiline
              numberOfLines={3}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              >
                <Text
                  className={`font-bold text-base ${
                    isDarkMode ? 'color-slate-200' : 'color-slate-700'
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddCustomChallenge}
                className="flex-1 bg-emerald-500 py-3 rounded-xl items-center"
              >
                <Text className="color-white font-bold text-base">
                  Set Task
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📅 Calendar History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/70 px-5">
          <View
            className={`rounded-3xl p-5 w-full max-w-md ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <Text
              className={`text-xl font-bold text-center mb-4 ${
                isDarkMode ? 'color-slate-100' : 'color-slate-800'
              }`}
            >
              📅 Challenge History
            </Text>

            <Calendar
              key={`${todayStr}_${isDarkMode}`}
              current={todayStr}
              markedDates={{
                ...markedDates,
                ...(markedDates[todayStr]
                  ? {}
                  : {
                      [todayStr]: {
                        today: true,
                        selected: true,
                        selectedColor: isDarkMode ? '#334155' : '#E2E8F0',
                        textColor: isDarkMode ? '#F8FAFC' : '#0F172A',
                      },
                    }),
              }}
              theme={{
                calendarBackground: isDarkMode ? '#1E293B' : '#FFFFFF',
                textSectionTitleColor: isDarkMode ? '#CBD5E1' : '#B6C1CD',
                dayTextColor: isDarkMode ? '#F8FAFC' : '#2D4150',
                monthTextColor: isDarkMode ? '#F8FAFC' : '#162B4D',
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
                <Text
                  className={`text-xs font-semibold ${
                    isDarkMode ? 'color-slate-300' : 'color-slate-600'
                  }`}
                >
                  Completed
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-rose-500" />
                <Text
                  className={`text-xs font-semibold ${
                    isDarkMode ? 'color-slate-300' : 'color-slate-600'
                  }`}
                >
                  Failed
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              className={`py-3 rounded-xl items-center mt-5 ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-800'
              }`}
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
        <View className="flex-1 justify-center items-center bg-black/70 px-6">
          <View
            className={`rounded-3xl p-6 items-center w-full max-w-sm ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <Text className="text-6xl mb-2">{earnedBadgeModal?.icon}</Text>
            <Text className="text-2xl font-extrabold color-emerald-500 mb-1">
              Badge Unlocked!
            </Text>
            <Text
              className={`text-lg font-bold mb-2 ${
                isDarkMode ? 'color-slate-100' : 'color-slate-800'
              }`}
            >
              {earnedBadgeModal?.title}
            </Text>
            <Text
              className={`text-sm text-center mb-6 ${
                isDarkMode ? 'color-slate-400' : 'color-slate-500'
              }`}
            >
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
