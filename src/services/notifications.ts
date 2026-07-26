import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Expo Go চেনার সবচেয়ে নির্ভুল উপায় (SDK 53+)
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

// Expo Go না হলেই কেবল নেটিভ নোটিফিকেশন মডিউল লোড হবে
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('Failed to load notifications module:', error);
  }
}

export async function registerForPushNotificationsAsync() {
  // Expo Go হলে বা মডিউল না থাকলে সরাসরি রিটার্ন করবে
  if (isExpoGo || !Notifications) {
    console.warn(
      'Notifications are disabled in Expo Go (SDK 53+). Use Development Build for testing.',
    );
    return;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted!');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }
  } catch (error) {
    console.log('Notification permission setup skipped or failed:', error);
  }
}

export async function scheduleDailyNotification() {
  if (isExpoGo || !Notifications) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌱 Today's Daily Challenge is Waiting!",
        body: "Don't break your streak 🔥! Open the app and complete today's task.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (error) {
    console.log(
      'Notification scheduling skipped in current environment:',
      error,
    );
  }
}
