const { randomArray } = require("../utils/utils");
const { GRID_SIZE } = require("../config/Constants");

const generateImagesPattern = (pattern, categorySize, pass_image) => {
  let imagePattern = [];

  for (let i = 0; i < pattern.length; i++) {
    let arr = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      arr = randomArray(arr, +pass_image, 1, categorySize + 1);
    }

    if (pattern[i] === "1") {
      const index = Math.floor(Math.random() * GRID_SIZE);
      arr[index] = +pass_image;
    }
    // const str = arr.join("");

    imagePattern.push(arr);
  }

  return imagePattern;
};

module.exports = generateImagesPattern;