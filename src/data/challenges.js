export const challenges = [
  'Drink 2 liters of water today',
  'Walk 5,000 steps',
  'Read 10 pages of a book',
  'Do 15 minutes of stretching',
  'No sugar for the whole day',
  'Meditate for 10 minutes',
  'Write down 3 things you are grateful for',
  'Sleep for at least 7-8 hours tonight',
  'Learn 5 new English words',
  'Avoid social media for 2 hours',
  'No Junk food for a day',
  'No Cigarette for a day',
];

export const getTodayChallenge = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24,
  );
  return challenges[dayOfYear % challenges.length];
};
