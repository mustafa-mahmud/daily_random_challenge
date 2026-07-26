import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getTodayChallenge } from '../src/data/challenges';

export default function App() {
  const [todayChallenge, setTodayChallenge] = useState('');
  const [status, setStatus] = useState('pending'); // 'pending', 'completed', 'failed'
  const [treeLevel, setTreeLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const handleReset = async () => {
    await AsyncStorage.clear();
    setStatus('pending');
    setTreeLevel(1);
  };

  const getTodayKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `status_${today}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const challenge = getTodayChallenge();
      setTodayChallenge(challenge);

      const savedStatus = await AsyncStorage.getItem(getTodayKey());
      const savedLevel = await AsyncStorage.getItem('tree_level');

      if (savedStatus) setStatus(savedStatus);
      if (savedLevel) setTreeLevel(parseInt(savedLevel, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const newLevel = treeLevel + 1;
      setStatus('completed');
      setTreeLevel(newLevel);

      await AsyncStorage.setItem(getTodayKey(), 'completed');
      await AsyncStorage.setItem('tree_level', newLevel.toString());
    } catch (error) {
      console.error('Error saving complete status:', error);
    }
  };

  const handleFail = async () => {
    try {
      setStatus('failed');
      await AsyncStorage.setItem(getTodayKey(), 'failed');
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
    <SafeAreaView className="flex-1 bg-slate-50 items-center justify-between py-12 px-5">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="items-center mt-2">
        <Text className="text-2xl font-bold color-slate-800">
          🌱 Daily Challenge
        </Text>
        <Text className="text-xs font-semibold color-emerald-600 mt-1">
          Tree Level: {treeLevel}
        </Text>
      </View>

      <Button onPress={handleReset} title="Reset" />

      {/* Challenge Card */}
      <View className="bg-white w-full p-6 rounded-2xl items-center shadow-md shadow-slate-200 elevation-3">
        <Text className="text-xs font-black color-slate-400 tracking-widest mb-2">
          TODAY'S TASK
        </Text>
        <Text className="text-xl font-semibold color-slate-800 text-center">
          {todayChallenge}
        </Text>
      </View>

      {/* Animation Display Area */}
      <View className="items-center justify-center my-4 h-64 w-64">
        {status === 'pending' && (
          <LottieView
            source={require('../assets/animations/tree.json')} // লোকাল ফাইল
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {status === 'completed' && (
          <View className="items-center">
            <LottieView
              source={require('../assets/animations/happy.json')} // লোকাল ফাইল
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
              source={require('../assets/animations/sad.json')} // লোকাল ফাইল
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
    </SafeAreaView>
  );
}
