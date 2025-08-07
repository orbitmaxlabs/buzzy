// Collection of explicit Hindi messages for notifications
export const hindiMessages = [
  // Explicit greetings
  "Bhosdike, kahan tha tu? 😤",
  "Madarchod, miss kar raha tha! 😅",
  "Chutiye, kya haal hai? 😂",
  "Bhenchod, kya scene hai? 🎪",
  "Saale, kahan mar gaya tha? 😆",
  
  // More explicit content
  "Bhosdike, phone utha le kabhi! 📞",
  "Madarchod, reply kar le yaar! 💬",
  "Chutiye, kya kar raha hai? 🤔",
  "Bhosdike, online aaya kar! 💻",
  "Madarchod, message dekh le! 📱",
  
  // Explicit expressions
  "Saale, tu toh ghost kar raha tha! 👻",
  "Bhosdike, kahan tha tu? 🤷‍♂️",
  "Madarchod, group mein aaya kar! 👥",
  "Chutiye, tu hi hai jo sabse funny hai! 😄",
  "Bhosdike, Internet slow hai kya? 🐌",
  
  // More explicit messages
  "Madarchod, tere liye hi wait kar raha tha! ⏰",
  "Saale, tu toh hero hai! 🦸‍♂️",
  "Bhosdike, tere saath time spend karna best! 🎯",
  "Madarchod, kya haal hai? Sab badhiya? 👍",
  "Chutiye, tere bina koi maza nahi aata! 🎊",
  
  // Additional explicit content
  "Bhosdike, tu toh legend hai! 👑",
  "Madarchod, tere saath baat karna always fun! 🎈",
  "Saale, kahan tha tu itne din? 😤",
  "Bhosdike, phone check kar le! 📱",
  "Madarchod, online aaya kar! 💻",
  
  // More explicit variations
  "Chutiye, kahan mar gaya tha tu? 😆",
  "Bhosdike, reply de le yaar! 💬",
  "Madarchod, kya scene hai? 🎪",
  "Saale, miss kar raha tha tujhe! 😅",
  "Bhosdike, kya haal hai? 😂",
  
  // Final explicit set
  "Madarchod, kahan tha tu? 🤔",
  "Chutiye, phone utha le kabhi! 📞",
  "Bhosdike, online aaya kar! 💻",
  "Madarchod, message dekh le! 📱",
  "Saale, tu toh ghost kar raha tha! 👻",
  
  // Last explicit messages
  "Bhosdike, kahan tha tu? 🤷‍♂️",
  "Madarchod, group mein aaya kar! 👥",
  "Chutiye, tu hi hai jo sabse funny hai! 😄",
  "Bhosdike, Internet slow hai kya? 🐌",
  "Madarchod, tere liye hi wait kar raha tha! ⏰"
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
