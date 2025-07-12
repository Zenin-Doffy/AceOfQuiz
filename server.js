const express      = require("express");
const http         = require("http");
const cors         = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { Server }   = require("socket.io");
const path         = require("path");
const bcrypt       = require("bcrypt");
const jwt          = require("jsonwebtoken");

const PORT       = process.env.PORT || 3000;
const MONGO_URI  = process.env.MONGO_URI || "mongodb+srv://jerasod877:BDJI0grd0nOFieef@cluster15.ccsrtsu.mongodb.net";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

if (JWT_SECRET === "your-secret-key-change-in-production") {
  console.warn("⚠️  WARNING: Using default JWT_SECRET. Change this in production!");
}
jkngbefs
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});
hello

app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE"] }));
app.use(express.json());
app.use(express.static(__dirname));
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));

const sessions = new Map();

let db,
    Questions, GameResults, ChatMessages,
    Users, UserProfiles, Achievements,
    Friendships, Teams, UserQuestions;

const client = new MongoClient(MONGO_URI);

async function initializeDatabase() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully");
    
    db = client.db("quizdb");
    Questions = db.collection("questions");
    GameResults = db.collection("gameResults");
    ChatMessages = db.collection("chatMessages");
    Users = db.collection("users");
    UserProfiles = db.collection("userProfiles");
    Achievements = db.collection("achievements");
    Friendships = db.collection("friendships");
    Teams = db.collection("teams");
    UserQuestions = db.collection("userQuestions");

    await initializeAchievements();
    await initializeSampleQuestions();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.log("📝 Falling back to in-memory sample questions");
    createSampleQuestions();
  }
}

async function initializeAchievements() {
  try {
    const existingAchievements = await Achievements.countDocuments();
    if (existingAchievements === 0) {
      const defaultAchievements = [
        { id: "first_quiz", name: "First Steps", description: "Complete your first quiz", icon: "🎯", xpReward: 50 },
        { id: "perfect_score", name: "Perfect Score", description: "Get 100% on a quiz", icon: "⭐", xpReward: 100 },
        { id: "speed_demon", name: "Speed Demon", description: "Answer 5 questions in under 10 seconds each", icon: "⚡", xpReward: 75 },
        { id: "social_butterfly", name: "Social Butterfly", description: "Add 5 friends", icon: "🦋", xpReward: 100 },
        { id: "quiz_creator", name: "Quiz Creator", description: "Create your first quiz", icon: "📝", xpReward: 150 },
        { id: "knowledge_seeker", name: "Knowledge Seeker", description: "Complete 10 quizzes", icon: "📚", xpReward: 200 },
        { id: "team_player", name: "Team Player", description: "Join a team", icon: "👥", xpReward: 100 },
        { id: "streak_master", name: "Streak Master", description: "Maintain a 7-day login streak", icon: "🔥", xpReward: 250 }
      ];
      await Achievements.insertMany(defaultAchievements);
      console.log("✅ Default achievements initialized");
    }
  } catch (err) {
    console.error("❌ Error initializing achievements:", err);
  }
}

async function initializeSampleQuestions() {
  try {
    const existingQuestions = await Questions.countDocuments();
    if (existingQuestions === 0) {
      const sampleQuestions = getSampleQuestions();
      await Questions.insertMany(sampleQuestions);
      console.log("✅ Sample questions added to database");
    }
  } catch (err) {
    console.error("❌ Error initializing sample questions:", err);
  }
}

function createSampleQuestions() {
  global.sampleQuestions = getSampleQuestions();
  console.log("📝 Using in-memory sample questions for demo");
}

function getSampleQuestions() {
  return [
    {
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctIndex: 2,
      difficulty: "easy",
      category: "Geography",
      createdBy: "system"
    },
    {
      text: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      difficulty: "easy",
      category: "Science",
      createdBy: "system"
    },
    {
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      difficulty: "easy",
      category: "Math",
      createdBy: "system"
    },
    {
      text: "Who painted the Mona Lisa?",
      options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
      correctIndex: 2,
      difficulty: "medium",
      category: "Art",
      createdBy: "system"
    },
    {
      text: "What is the largest ocean on Earth?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correctIndex: 3,
      difficulty: "easy",
      category: "Geography",
      createdBy: "system"
    },
    {
      text: "Which programming language is known for web development?",
      options: ["Python", "JavaScript", "C++", "Java"],
      correctIndex: 1,
      difficulty: "medium",
      category: "Technology",
      createdBy: "system"
    },
    {
      text: "What year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctIndex: 1,
      difficulty: "medium",
      category: "History",
      createdBy: "system"
    },
    {
      text: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctIndex: 2,
      difficulty: "easy",
      category: "Science",
      createdBy: "system"
    },
    {
      text: "What is the fastest land animal?",
      options: ["Lion", "Cheetah", "Leopard", "Tiger"],
      correctIndex: 1,
      difficulty: "easy",
      category: "Animals",
      createdBy: "system"
    },
    {
      text: "Which country is home to the kangaroo?",
      options: ["New Zealand", "Australia", "South Africa", "Brazil"],
      correctIndex: 1,
      difficulty: "easy",
      category: "Geography",
      createdBy: "system"
    }
  ];
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getXpForNextLevel(currentLevel) {
  return Math.pow(currentLevel, 2) * 100;
}

async function awardXP(userId, amount, reason) {
  try {
    if (!UserProfiles) return null;
    
    const profile = await UserProfiles.findOneAndUpdate(
      { userId: userId },
      { 
        $inc: { totalXP: amount },
        $push: { xpHistory: { amount, reason, timestamp: new Date() } }
      },
      { returnDocument: "after", upsert: true }
    );
    
    const newLevel = calculateLevel(profile.value.totalXP);
    if (newLevel > (profile.value.level || 0)) {
      await UserProfiles.updateOne(
        { userId: userId },
        { $set: { level: newLevel } }
      );
      
      io.to(userId.toString()).emit("levelUp", { newLevel, totalXP: profile.value.totalXP });
    }
    
    return profile.value;
  } catch (err) {
    console.error("Error awarding XP:", err);
    return null;
  }
}

async function checkAndAwardAchievement(userId, achievementId) {
  try {
    if (!UserProfiles || !Achievements) return false;
    
    const profile = await UserProfiles.findOne({ userId: userId });
    if (!profile || profile.achievements?.includes(achievementId)) {
      return false;
    }
    
    const achievement = await Achievements.findOne({ id: achievementId });
    if (!achievement) return false;
    
    await UserProfiles.updateOne(
      { userId: userId },
      { 
        $push: { achievements: achievementId },
        $inc: { totalXP: achievement.xpReward }
      }
    );
    
    io.to(userId.toString()).emit("achievementUnlocked", achievement);
    
    return true;
  } catch (err) {
    console.error("Error checking achievement:", err);
    return false;
  }
}

async function initializeSession(roomId, hostId) {
  if (!sessions.has(roomId)) {
    sessions.set(roomId, {
      host: hostId,
      players: [],
      gameState: "waiting",
      currentQuestion: 0,
      questions: [],
      answers: new Map(),
      scores: new Map(),
      lastActivity: Date.now()
    });
  }
  return sessions.get(roomId);
}

async function broadcastPlayerList(roomId) {
  const s = sessions.get(roomId);
  if (!s) return;
  
  try {
    const enhancedPlayers = await Promise.all(s.players.map(async (p) => {
      let profile = {};
      if (UserProfiles) {
        profile = await UserProfiles.findOne({ userId: p.userId }) || {};
      }
      return {
        id: p.id,
        name: p.name,
        score: p.score,
        isHost: p.id === s.host,
        level: profile.level || 1,
        totalXP: profile.totalXP || 0,
        achievements: profile.achievements || []
      };
    }));
    
    io.to(roomId).emit("playerList", {
      players: enhancedPlayers,
      hostId: s.host
    });
  } catch (err) {
    console.error("Error broadcasting player list:", err);
  }
}

async function getRandomQuestions(count = 10) {
  try {
    if (Questions) {
      const questions = await Questions.aggregate([{ $sample: { size: count } }]).toArray();
      if (questions.length > 0) {
        return questions;
      }
    }
  } catch (err) {
    console.error("Error fetching questions from DB:", err);
  }
  
  const sampleQuestions = global.sampleQuestions || getSampleQuestions();
  const shuffled = [...sampleQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, sampleQuestions.length));
}

setInterval(() => {
  const now = Date.now();
  sessions.forEach((s, roomId) => {
    if (now - s.lastActivity > 3_600_000) {
      sessions.delete(roomId);
      console.log(`🧹 Cleaned up room ${roomId}`);
    }
  });
}, 600_000);

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    
    if (!Users) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const existingUser = await Users.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await Users.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });
    
    await UserProfiles.insertOne({
      userId: result.insertedId.toString(),
      username,
      level: 1,
      totalXP: 0,
      achievements: [],
      stats: {
        quizzesCompleted: 0,
        totalScore: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        averageScore: 0
      },
      preferences: {
        theme: "default",
        notifications: true
      },
      createdAt: new Date()
    });
    
    const token = jwt.sign(
      { userId: result.insertedId.toString(), username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        email
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    if (!Users) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const user = await Users.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    await Users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    if (!UserProfiles) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const profile = await UserProfiles.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json(profile);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { bio, preferences } = req.body;
    
    if (!UserProfiles) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (preferences) updateData.preferences = { ...preferences };
    
    const result = await UserProfiles.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    res.json(result.value);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { type = "xp", limit = 10 } = req.query;
    
    if (!UserProfiles) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    let sortField = "totalXP";
    if (type === "level") sortField = "level";
    if (type === "quizzes") sortField = "stats.quizzesCompleted";
    
    const leaderboard = await UserProfiles.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .project({
        username: 1,
        level: 1,
        totalXP: 1,
        "stats.quizzesCompleted": 1,
        "stats.averageScore": 1,
        achievements: 1
      })
      .toArray();
    
    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

app.get("/api/achievements", async (req, res) => {
  try {
    if (!Achievements) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const achievements = await Achievements.find({}).toArray();
    res.json(achievements);
  } catch (err) {
    console.error("Achievements fetch error:", err);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

app.post("/api/questions", authenticateToken, async (req, res) => {
  try {
    const { title, category, difficulty, questions } = req.body;
    
    if (!title || !category || !difficulty || !questions || questions.length === 0) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.options || q.options.length !== 4 || q.correctIndex === undefined) {
        return res.status(400).json({ error: `Invalid question ${i + 1}` });
      }
    }
    
    if (!UserQuestions) {
      return res.status(503).json({ error: "Database not available" });
    }
    
    const quizResult = await UserQuestions.insertOne({
      title,
      category,
      difficulty,
      createdBy: req.user.userId,
      createdAt: new Date(),
      questions: questions.map(q => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex
      }))
    });
    
    await checkAndAwardAchievement(req.user.userId, "quiz_creator");
    
    res.status(201).json({
      message: "Quiz created successfully",
      quizId: quizResult.insertedId.toString()
    });
  } catch (err) {
    console.error("Question creation error:", err);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    
    const questions = await getRandomQuestions(parseInt(limit));
    
    let filteredQuestions = questions;
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
    
    const safeQuestions = filteredQuestions.map(q => ({
      _id: q._id,
      text: q.text,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    }));
    
    res.json(safeQuestions);
  } catch (err) {
    console.error("Questions fetch error:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  socket.on("joinRoom", async (data) => {
    try {
      const { roomId, playerName, userId } = data;
      
      if (!roomId || !playerName) {
        socket.emit("error", { message: "Room ID and player name are required" });
        return;
      }
      
      const session = await initializeSession(roomId, socket.id);
      session.lastActivity = Date.now();
      
      const existingPlayer = session.players.find(p => p.id === socket.id);
      if (!existingPlayer) {
        session.players.push({
          id: socket.id,
          name: playerName,
          userId: userId || null,
          score: 0
        });
      }
      
      socket.join(roomId);
      socket.roomId = roomId;
      
      socket.emit("joinedRoom", { 
        roomId, 
        isHost: socket.id === session.host,
        gameState: session.gameState 
      });
      
      await broadcastPlayerList(roomId);
      
      console.log(`👤 ${playerName} joined room ${roomId}`);
    } catch (err) {
      console.error("Join room error:", err);
      socket.emit("error", { message: "Failed to join room" });
    }
  });
  
  socket.on("startQuiz", async (data) => {
    try {
      const { roomId, quizId } = data;
      const session = sessions.get(roomId);
      
      if (!session || socket.id !== session.host) {
        socket.emit("error", { message: "Only the host can start the quiz" });
        return;
      }
      
      if (session.gameState !== "waiting") {
        socket.emit("error", { message: "Quiz already in progress" });
        return;
      }
      
      if (quizId) {
        const quiz = await UserQuestions.findOne({ _id: new ObjectId(quizId) });
        if (!quiz) {
          socket.emit("error", { message: "Quiz not found" });
          return;
        }
        session.questions = quiz.questions;
      } else {
        session.questions = await getRandomQuestions(10);
      }
      
      session.gameState = "playing";
      session.currentQuestion = 0;
      session.answers.clear();
      session.scores.clear();
      session.lastActivity = Date.now();
      
      session.players.forEach(p => {
        session.scores.set(p.id, 0);
      });
      
      io.to(roomId).emit("quizStarted", {
        totalQuestions: session.questions.length
      });
      
      setTimeout(() => {
        sendQuestion(roomId);
      }, 2000);
      
      console.log(`🎯 Quiz started in room ${roomId} with ${quizId ? 'custom' : 'random'} questions`);
    } catch (err) {
      console.error("Start quiz error:", err);
      socket.emit("error", { message: "Failed to start quiz" });
    }
  });
  
  socket.on("submitAnswer", async (data) => {
    try {
      const { roomId, answerIndex, timeRemaining } = data;
      const session = sessions.get(roomId);
      
      if (!session || session.gameState !== "playing") {
        socket.emit("error", { message: "No active quiz found" });
        return;
      }
      
      const currentQ = session.questions[session.currentQuestion];
      if (!currentQ) {
        socket.emit("error", { message: "Invalid question" });
        return;
      }
      
      if (session.answers.has(socket.id)) {
        return;
      }
      
      const isCorrect = answerIndex === currentQ.correctIndex;
      let points = 0;
      
      if (isCorrect) {
        const basePoints = currentQ.difficulty === "easy" ? 100 : currentQ.difficulty === "medium" ? 150 : 200;
        const speedBonus = Math.floor((timeRemaining / 30) * 50);
        points = basePoints + speedBonus;
      }
      
      session.answers.set(socket.id, {
        answerIndex,
        isCorrect,
        points,
        timeRemaining
      });
      
      const currentScore = session.scores.get(socket.id) || 0;
      session.scores.set(socket.id, currentScore + points);
      
      socket.emit("answerResult", {
        isCorrect,
        points,
        correctAnswer: currentQ.correctIndex,
        explanation: currentQ.explanation || ""
      });
      
      // Update user stats if logged in
      const player = session.players.find(p => p.id === socket.id);
      if (player && player.userId) {
        const update = {
          $inc: {
            "stats.questionsAnswered": 1
          }
        };
        if (isCorrect) {
          update.$inc["stats.correctAnswers"] = 1;
        }
        await UserProfiles.updateOne(
          { userId: player.userId },
          update
        );
      }
      
      if (session.answers.size === session.players.length) {
        setTimeout(() => {
          nextQuestion(roomId);
        }, 3000);
      }
    } catch (err) {
      console.error("Submit answer error:", err);
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const session = sessions.get(socket.roomId);
      if (session) {
        session.players = session.players.filter(p => p.id !== socket.id);
        
        if (socket.id === session.host && session.players.length > 0) {
          session.host = session.players[0].id;
        }
        
        if (session.players.length === 0) {
          sessions.delete(socket.roomId);
        } else {
          broadcastPlayerList(socket.roomId);
        }
      }
    }
  });
});

function sendQuestion(roomId) {
  const session = sessions.get(roomId);
  if (!session || session.gameState !== "playing") return;
  
  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return;
  
  session.answers.clear();
  
  io.to(roomId).emit("newQuestion", {
    questionNumber: session.currentQuestion + 1,
    totalQuestions: session.questions.length,
    question: {
      text: currentQ.text,
      options: currentQ.options,
      category: currentQ.category,
      difficulty: currentQ.difficulty
    },
    timeLimit: 30
  });
  
  setTimeout(() => {
    nextQuestion(roomId);
  }, 32000);
}

async function nextQuestion(roomId) {
  const session = sessions.get(roomId);
  if (!session || session.gameState !== "playing") return;
  
  session.currentQuestion++;
  
  if (session.currentQuestion >= session.questions.length) {
    await endQuiz(roomId);
  } else {
    setTimeout(() => {
      sendQuestion(roomId);
    }, 2000);
  }
}

async function endQuiz(roomId) {
  const session = sessions.get(roomId);
  if (!session) return;
  
  session.gameState = "ended";
  
  const results = session.players.map(p => ({
    id: p.id,
    name: p.name,
    score: session.scores.get(p.id) || 0,
    userId: p.userId
  })).sort((a, b) => b.score - a.score);
  
  for (const player of results) {
    if (player.userId) {
      const xpAmount = Math.floor(player.score / 10);
      const profile = await awardXP(player.userId, xpAmount, "Quiz completion");
      
      if (profile) {
        const totalQuizzes = (profile.stats?.quizzesCompleted || 0) + 1;
        const totalScore = (profile.stats?.totalScore || 0) + player.score;
        const averageScore = Math.round(totalScore / totalQuizzes);
        
        await UserProfiles.updateOne(
          { userId: player.userId },
          {
            $inc: { "stats.quizzesCompleted": 1, "stats.totalScore": player.score },
            $set: { "stats.averageScore": averageScore }
          }
        );
      }
      
      if (player.score === results[0].score && results[0].score > 0) {
        await checkAndAwardAchievement(player.userId, "perfect_score");
      }
      
      await checkAndAwardAchievement(player.userId, "first_quiz");
    }
  }
  
  io.to(roomId).emit("quizEnded", {
    results,
    winner: results[0] || null
  });
  
  try {
    if (GameResults) {
      await GameResults.insertOne({
        roomId,
        results,
        completedAt: new Date(),
        totalQuestions: session.questions.length
      });
    }
  } catch (err) {
    console.error("Error saving game results:", err);
  }
  
  console.log(`🏁 Quiz ended in room ${roomId}`);
}

initializeDatabase().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});