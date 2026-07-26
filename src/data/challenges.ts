export const challenges: string[] = [
  // 💧 Health & Hydration (১-১৫)
  'Drink 2 liters of water today',
  'Drink a glass of warm water right after waking up',
  'No sugary drinks or soda for the whole day',
  'Eat at least one fresh fruit today',
  'Avoid processed junk food all day',
  'Drink a warm cup of green tea or herbal tea',
  'Eat a green vegetable-rich lunch',
  'Avoid eating any heavy meal after 8 PM',
  'No fast food or fried food today',
  'Chew your food slowly during all meals',
  'Drink a glass of water before every meal',
  'Replace one snack time with nuts or seeds',
  'Avoid adding extra salt to your meal today',
  'Have a completely homemade meal today',
  'Drink at least 8 full glasses of water',

  // 🏃 Fitness & Movement (১৬-৩০)
  'Walk 5,000 steps today',
  'Do 15 minutes of full-body stretching',
  'Do 20 push-ups or 20 knee push-ups',
  'Take the stairs instead of the elevator today',
  'Do a 30-second plank, 3 times today',
  'Go for a 20-minute brisk walk in the evening',
  'Do 30 jumping jacks today',
  'Do 20 bodyweight squats',
  'Walk for 10 minutes right after lunch',
  'Stand up and stretch every 1 hour during work',
  'Do a 10-minute quick cardio workout',
  'Hold a wall sit for 45 seconds',
  'Do 15 lunges on each leg',
  'Walk 7,000 steps before the end of the day',
  'Do neck and shoulder mobility exercises',

  // 🧠 Mindset & Mental Wellness (৩১-৪৫)
  'Meditate silently for 5 minutes today',
  'Write down 3 things you are grateful for',
  'Take 10 deep slow breaths whenever you feel stressed',
  'Spend 15 minutes sitting quietly without your phone',
  'Write down one goal you want to achieve this month',
  'Practice positive self-talk in front of the mirror',
  'Spend 10 minutes sitting outdoors in fresh air',
  'List 3 personal accomplishments from this week',
  'Listen to a relaxing instrumental track for 10 mins',
  'Forgive someone in your mind and let go of resentment',
  'Smile at yourself in the mirror every time you see it',
  'Do a quick brain dump: write down all clutter in your mind',
  'Spend 5 minutes focusing only on your natural breathing',
  'Think of 3 things that made you happy recently',
  'Compliment yourself for a recent hard work',

  // 📚 Productivity & Learning (৪৬-৬০)
  'Read 10 pages of a book today',
  'Clean and organize your main work desk',
  'Clear out unread emails or junk notifications',
  'Write down a clear to-do list for tomorrow',
  'Focus on a single task for 25 minutes uninterrupted',
  'Watch an educational or skill-building video',
  'Learn 3 new words in a foreign language',
  'Organize your phone home screen or download folder',
  'Complete your hardest task first thing in the morning',
  'Listen to an informative podcast episode',
  'Back up your important phone photos or files',
  'Learn one new keyboard shortcut or tech hack',
  'Unsubscribe from 3 unwanted email newsletters',
  'Spend 20 minutes learning something new online',
  'Plan your budget or review expenses for the week',

  // 📵 Digital Detox & Focus (৬১-৭৫)
  'No social media usage for 2 hours straight today',
  'Keep your phone away from the bed before sleeping',
  'Turn off non-essential phone notifications today',
  'Spend 1 hour completely screen-free before bed',
  'Do not check your phone for the first 30 mins after waking up',
  'Unfollow 5 social media accounts that drain your energy',
  'Put your phone on Do Not Disturb during lunch',
  'Limit social media app usage to under 30 minutes today',
  'Leave your phone in another room while having meals',
  'Organize phone photo gallery and delete unwanted screenshots',
  'Take a 3-hour complete digital break in the afternoon',
  'Use greyscale or dark mode on phone to reduce screen addiction',
  'No video streaming (YouTube/Netflix) for the whole day',
  'Keep your phone face down while talking to anyone',
  'Log out of one distracting app for the rest of the day',

  // ❤️ Social & Kindness (৭৬-৯০)
  'Send a genuine appreciation message to a friend',
  'Call a family member or relative just to check on them',
  'Compliment a coworker or friend sincerely',
  'Hold the door open or say thank you to someone today',
  'Help someone with a small favor without expecting anything',
  'Wish someone a great day with a warm smile',
  'Send an encouraging voice note to a loved one',
  'Listen actively to someone today without interrupting',
  'Pay for someone’s coffee or share food with someone',
  'Feed a street animal or place water for birds',
  'Text an old friend you haven’t spoken to in a while',
  'Express gratitude to someone who helped you in the past',
  'Avoid complaining or gossiping about anyone all day',
  'Be patient in traffic or queues without getting annoyed',
  'Share a helpful resource or book with a friend',

  // 🧹 Life & Environment (৯১-১০০)
  'Make your bed neatly right after waking up',
  'Declutter one drawer or cabinet in your room',
  'Water the plants in your house or surroundings',
  'Change your bedsheets or pillow covers today',
  'Wipe clean your phone screen and phone cover',
  'Organize your wardrobe or clothes hanger',
  'Open all windows in the room to let fresh air in',
  'Throw away expired items or broken clutter from home',
  'Clean your shoes or footwear area',
  'Organize your cables and chargers neatly',
];

// 📅 আজকের তারিখ অনুযায়ী অটোমেটিক একটি চ্যালেঞ্জ বেছে নেওয়ার হেলপার ফাংশন
export const getTodayChallenge = (): string => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = dayOfYear % challenges.length;
  return challenges[index];
};
