// Collection of explicit Hindi messages for notifications
export const hindiMessages = [
  // Explicit greetings
  "Tera khel ab khatm ha",
  "khel khatm",
  "tel khatm ha",
  "mainu maaf kari maa meriye",
  "Tatte polish karde",

  // More explicit content
  "Bhosdike 📞",
  "Madarchod yr",
  "Chutiye, kya kar raha?",
  "Bhosdike, online aaya kar! 💻",
  "Madarchod, message dekh le! 📱",
];

/**
 * Get a random Hindi message
 * @returns {string} A random funny Hindi message
 */
export const getRandomHindiMessage = () => {
  const randomIndex = Math.floor(Math.random() * hindiMessages.length);
  return hindiMessages[randomIndex];
};

/**
 * Get multiple random Hindi messages
 * @param {number} count - Number of messages to return
 * @returns {string[]} Array of random Hindi messages
 */
export const getRandomHindiMessages = (count = 1) => {
  const shuffled = [...hindiMessages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
