const User = require("../models/user");

const { randomBinary } = require("../utils/utils");
const generatePattern = require("../utils/generatePattern");
const { CATS_COUNT, DOGS_COUNT } = require("../config/Constants");

/** =========================== FUNCTION FOR CREATING AND STORING LOGIN PATTERN  ==============================*/
const createLoginPattern = async (user, loginId) => {
  const session = user.sessions.find((session) => session.loginId === loginId);
  let pattern;

  //session doesn't exist, creating new session
  if (!session) {
    pattern = randomBinary("");

    user.sessions.push({
      loginId,
      pattern,
      patternTime: new Date().getTime() + 60 * 1000, //1 minute,
    });
  }
  //session exists, updating pattern and timestamp
  else {
    const index = user.sessions.indexOf(session);
    pattern = randomBinary(session.pattern);
    user.sessions[index].pattern = pattern;
  }

  await user.save();
  return pattern;
};

/** =========================== FUNCTION FOR CLEARING SESSION FROM DATABASE ==============================*/
const clearSession = async (user, session) => {
  const index = user.sessions.indexOf(session);
  user.sessions.splice(index, 1);
  await user.save();
};

/** =========================== FUNCTION FOR CLEARING PATTERN FROM DATABASE ==============================*/
const clearPattern = async (user, session) => {
  const index = user.sessions.indexOf(session);
  user.sessions[index].pattern = "";
  user.sessions[index].patternTime = 0;
  await user.save();
};

/** =========================== FUNCTION FOR SENDING RANDOM IMAGE PATTERN TO CLIENT ==============================*/
const imagePattern = async (req, res) => {
  const { username, loginId } = req.body;

  if (!username || !loginId) {
    return res
      .status(400)
      .json({ message: "username, loginId not found", success: false });
  }

  const user = await User.findOne({ username }).exec();

  //firstly creating login pattern to be stored in DB and also get it
  const pattern = await createLoginPattern(user, loginId);

  let { category, pass_image } = user;

  //getting pass_image value and login pattern value
  pass_image = pass_image.substring(pass_image.length - 1);

  let categorySize;

  switch (category) {
    case "Cat":
      categorySize = CATS_COUNT;
      break;
    case "Dog":
      categorySize = DOGS_COUNT;
      break;
    default:
      categorySize = 0;
  }

  //generating image pattern to be sent to client
  const imagesPattern = generatePattern(
    pattern,
    categorySize,
    pass_image
  );

  return res.status(200).json({
    message: "pattern generated",
    isExist: true,
    pattern: imagesPattern,
    category,
  });
};

/** =========================== FUNCTION FOR FINAL VALIDATION OF USER BY PATTERN  ==============================*/
const validateLogin = async (req, res) => {
  const { username, loginId, pattern, timestamp } = req.body;

  if (!username || !loginId || !pattern || !timestamp) {
    return res.status(400).json({ message: "Empty Field(s)", success: false });
  }

  try {
    const user = await User.findOne({ username }).exec();

    //getting session from user loginId
    const session = user.sessions.find(
      (session) => session.loginId === loginId
    );

    if (!session) {
      return res.status(409).json({
        message: "session doesn't exist",
        success: false,
      });
    }

    //getting pattern,patternTime from session
    const dbPattern = session.pattern;
    const dbTimestamp = session.patternTime;

    //checking validity of pattern by timestamp
    if (timestamp > dbTimestamp) {
      //clearing pattern from user's data
      //once pattern is cleared, pattern always show pattern expired, unless user relogin with username
      await clearPattern(user, session);

      return res.status(401).json({
        message: "Pattern expired, please relogin",
        success: false,
      });
    }

    //checking pattern
    if (dbPattern === pattern) {
      //clearing session after successful login
      await clearSession(user);

      //returning success message
      return res.status(200).json({
        message: "pattern validated",
        success: true,
      });
    } else {
      //for every wrong attemp, pattern is reset and increased by 1
      await createLoginPattern(user, loginId);

      //unauthorized
      return res.status(401).json({
        message: "pattern not validated",
        success: false,
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};

module.exports = { imagePattern, validateLogin };
