// সব চ্যালেঞ্জের তালিকা
export const CHALLENGES = [
  'Drink 2 glasses of water',
  'Walk 1000 steps',
  'Read 10 pages',
  'Stretch for 5 minutes',
  'Meditate for 3 minutes',
  'Call your parents',
  'No soft drinks today',
  'Sleep before 11 PM',
  'Write 5 positive thoughts',
  'Eat one fruit',
];

// প্রতিদিন একই চ্যালেঞ্জ পাওয়ার বিশেষ গাণিতিক লজিক
export const getTodayChallenge = () => {
  const today = new Date().toDateString(); // যেমন: "Sun Jul 26 2026"

  // তারিখকে একটি ইউনিক সংখ্যার হ্যাশে রূপান্তর
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }

  // হ্যাশ সংখ্যা থেকে লিস্টের সঠিক ইনডেক্স খুঁজে বের করা
  const index = Math.abs(hash) % CHALLENGES.length;
  return CHALLENGES[index];
};
