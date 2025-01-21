import axios from "axios";

// 초성, 중성, 종성 배열
const chosung = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const jungsung = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"];
const jongsung = [
  "",
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const getRandomSyllable = () => {
  const cho = chosung[Math.floor(Math.random() * chosung.length)];
  const jung = jungsung[Math.floor(Math.random() * jungsung.length)];
  const jong = jongsung[Math.floor(Math.random() * jongsung.length)];
  return `${cho}${jung}${jong}`;
};

export const fetchWord = async () => {
  const randomSyllable = getRandomSyllable();
  const url = `https://krdict.korean.go.kr/api/search?key=9F21B891FDD74E00797612B093260716&type_search=search&q=${encodeURIComponent(
    randomSyllable
  )}`;

  try {
    const response = await axios.get(url);
    console.log("response.data", response.data);
    const words = response.data.channel.item;
    console.log("words", words);
  } catch (err) {}
  return randomSyllable;
};
