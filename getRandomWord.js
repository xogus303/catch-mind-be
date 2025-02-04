import axios from "axios";
import Hangul from "hangul-js";
import { XMLParser } from "fast-xml-parser";

const { assemble } = Hangul;

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
  return [cho, jung, jong];
};

export const fetchWord = async () => {
  const randomSyllable = getRandomSyllable();
  const inputWord = assemble(randomSyllable);
  const url = `https://krdict.korean.go.kr/api/search?key=9F21B891FDD74E00797612B093260716&q=${inputWord}&advanced=y&method=include&pos=1,2,3,4,5,6,7,8,11,12,13,14&letter_e=8`;

  try {
    const response = await axios.get(url);
    const parser = new XMLParser();
    const objData = parser.parse(response.data);
    console.log("objData", typeof objData, objData);
    const words = objData.channel.item;
    console.log("words", words);
    if (words && words.length > 0) {
      console.log("words.length", words.length);
      const randomIndex = Math.floor(Math.random() * words.length);
      console.log("randomIndex", randomIndex);
      return words[randomIndex].word;
    } else {
      return await fetchWord();
    }
  } catch (err) {
    console.log("fetchWord err", err);
    throw new Error("fetchWord fail");
  }
};
