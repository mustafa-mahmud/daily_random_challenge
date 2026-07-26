import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
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

// Local Animations Import
import happyAnim from '../assets/animations/happy.json';
import plantAnim from '../assets/animations/plant.json';
import sadAnim from '../assets/animations/sad.json';

// Safety Fallback (ইমপোর্ট ফেইল করলেও অ্যাপ ক্র্যাশ করবে না)
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
  const [loading, setLoading] = useState(true);
  const confettiRef = useRef<any>(null);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const getTodayKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `status_${today}`;
  };

  const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `status_${yesterday.toISOString().split('T')[0]}`;
  };

  const getShuffleKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `shuffle_${today}`;
  };

  const getCustomChallengeKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `challenge_${today}`;
  };

  const handleReset = async () => {
    await AsyncStorage.clear();
    setStatus('pending');
    setTreeLevel(1);
    setStreak(0);
    setShuffleLeft(5);
    setTodayChallenge(getTodayChallenge());
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedStatus = await AsyncStorage.getItem(getTodayKey());
      const savedLevel = await AsyncStorage.getItem('tree_level');
      const savedStreak = await AsyncStorage.getItem('streak_count');
      const savedShuffle = await AsyncStorage.getItem(getShuffleKey());
      const savedCustomChallenge = await AsyncStorage.getItem(
        getCustomChallengeKey(),
      );

      const yesterdayStatus = await AsyncStorage.getItem(getYesterdayKey());

      if (savedCustomChallenge) {
        setTodayChallenge(savedCustomChallenge);
      } else {
        setTodayChallenge(getTodayChallenge());
      }

      if (savedShuffle !== null) {
        setShuffleLeft(parseInt(savedShuffle, 10));
      } else {
        setShuffleLeft(5);
      }

      let currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;

      if (yesterdayStatus !== 'completed' && savedStatus !== 'completed') {
        currentStreak = 0;
        await AsyncStorage.setItem('streak_count', '0');
      }

      setStreak(currentStreak);
      if (savedStatus) setStatus(savedStatus);
      if (savedLevel) setTreeLevel(parseInt(savedLevel, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎲 নতুন চ্যালেঞ্জ শাফেল করার সেফ লজিক
  const handleShuffle = async () => {
    if (shuffleLeft <= 0 || status !== 'pending') return;

    // challengesList নিশ্চিত করে নিরাপদ filter করা হচ্ছে
    const availableChallenges = challengesList.filter(
      (c) => c !== todayChallenge,
    );
    if (availableChallenges.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    const newChallenge = availableChallenges[randomIndex];

    const updatedShuffleCount = shuffleLeft - 1;

    setTodayChallenge(newChallenge);
    setShuffleLeft(updatedShuffleCount);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await AsyncStorage.setItem(getCustomChallengeKey(), newChallenge);
    await AsyncStorage.setItem(getShuffleKey(), updatedShuffleCount.toString());
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

      setTimeout(() => {
        triggerShake();
      }, 500);

      const newLevel = treeLevel + 1;
      const newStreak = streak + 1;

      setStatus('completed');
      setTreeLevel(newLevel);
      setStreak(newStreak);

      await AsyncStorage.setItem(getTodayKey(), 'completed');
      await AsyncStorage.setItem('tree_level', newLevel.toString());
      await AsyncStorage.setItem('streak_count', newStreak.toString());
    } catch (error) {
      console.error('Error saving complete status:', error);
    }
  };

  const handleFail = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate([0, 150, 100, 150]);

      setTimeout(() => {
        triggerShake();
      }, 500);

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
    <SafeAreaView className="flex-1 bg-slate-50 justify-between py-12 px-5">
      <StatusBar barStyle="dark-content" />

      <Animated.View
        style={{
          transform: [{ translateX: shakeAnimation }],
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <View className="items-center mt-2">
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
        </View>

        <Button onPress={handleReset} title="Reset" />

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
        <View className="items-center justify-center my-4 h-64 w-64">
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
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-lg color-emerald-600 font-bold mt-2">
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
                style={{ width: 180, height: 180 }}
              />
              <Text className="text-lg color-rose-500 font-bold mt-2">
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
