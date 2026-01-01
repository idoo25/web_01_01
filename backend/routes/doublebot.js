import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import GroupReflection from '../models/GroupReflection.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';

const router = express.Router();

// Helper: Call Cerebras API
async function callCerebras(messages, systemPrompt) {
  const cerebrasMessages = [];

  if (systemPrompt) {
    cerebrasMessages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  cerebrasMessages.push(...messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  })));

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: cerebrasMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Cerebras API error');
  }

  return data.choices[0].message.content;
}

// BOT 2: Generate question outline for Bot 1 (BEFORE conversation)
async function bot2GenerateOutline(teamId, projectTopic) {
  // 1. Load last 5 history chats
  const previousReflections = await GroupReflection.find({
    teamId: teamId,
    stage: 'completed'
  }).sort({ createdAt: -1 }).limit(5);

  // 2. Load previous tasks from database
  const previousTasks = await Task.find({
    teamId: teamId
  }).sort({ createdAt: -1 }).limit(10);

  let historyContext = '';

  if (previousReflections.length > 0) {
    historyContext = `היסטוריית שיחות קודמות:\n${previousReflections.map((ref, idx) => `
שיחה ${idx + 1} (${new Date(ref.createdAt).toLocaleDateString('he-IL')}):
- ניקוד כללי: ${ref.scores?.overallScore || 'N/A'}
- תקשורת: ${ref.scores?.conversationQuality || 'N/A'}/10
- דינמיקה: ${ref.scores?.teamDynamics || 'N/A'}/10
- ניתוח: ${ref.finalAnalysis?.substring(0, 300)}...
`).join('\n')}`;
  }

  let tasksContext = '';
  if (previousTasks.length > 0) {
    tasksContext = `\n\nמשימות שניתנו לצוות:\n${previousTasks.map((task, idx) => `
${idx + 1}. ${task.title} (קטגוריה: ${task.category}, עדיפות: ${task.priority}/10)
   - תיאור: ${task.description}
   - סטטוס: ${task.completed ? '✅ הושלמה' : '⏳ ממתינה'}
   - תאריך יעד: ${new Date(task.dueDate).toLocaleDateString('he-IL')}
`).join('\n')}`;
  }

  // 3. Generate outline for Bot 1
  const outlinePrompt = `אתה בוט אנליסט מנוסה (Bot 2) שעובד עם בוט שיחה (Bot 1).

תפקידך: נתח את ההיסטוריה של הצוות וצור תוכנית שאלות ל-Bot 1.

הצוות עובד על: "${projectTopic}"

${historyContext || 'זוהי השיחה הראשונה של הצוות - אין היסטוריה.'}
${tasksContext || ''}

צור תוכנית שאלות מובנית ל-Bot 1:

אם יש היסטוריה:
- זהה נושאים שטרם נחקרו לעומק
- בדוק אם משימות הושלמו (שאל עליהן)
- התמקד בבעיות שזוהו בשיחות קודמות
- חקור אם יש שיפור או הידרדרות

אם זו שיחה ראשונה:
- התמקד בנושאים בסיסיים: חלוקת תפקידים, תקשורת, שיתוף פעולה

ספק תוכנית ב-3-5 נושאים עיקריים שעל Bot 1 לחקור.
כל נושא צריך להיות קונקרטי וממוקד.

פורמט: רשימה ממוספרת של נושאים לחקירה בעברית.`;

  const outline = await callCerebras([], outlinePrompt);

  return {
    outline,
    hasHistory: previousReflections.length > 0,
    previousSessionCount: previousReflections.length,
    pendingTasks: previousTasks.filter(t => !t.completed).length
  };
}

// Helper: Call heBERT for sentiment analysis
async function analyzeSentiment(text) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/avichr/heBERT_sentiment_analysis',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const data = await response.json();
    console.log('🤖 Hugging Face response:', { ok: response.ok, status: response.status, data });

    if (!response.ok) {
      console.error('❌ Hugging Face API error:', data);
      return null;
    }
    return data[0];
  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);
    return null;
  }
}

// BOT 1: Adaptive system prompt that follows Bot 2's outline
function getBot1SystemPrompt(bot2Outline, conversationHistory, messageCount) {
  const basePrompt = `אתה בוט שיחה (Bot 1) שמדבר עם קבוצת סטודנטים.

תפקידך: לנהל שיחה טבעית ומעמיקה על פי תוכנית השאלות שקיבלת מ-Bot 2.

תוכנית השאלות שלך (מ-Bot 2):
${bot2Outline}

חוקי שיחה:
- עקוב אחרי התוכנית אבל היה גמיש - אם הסטודנט מזכיר משהו חשוב, חקור את זה
- שאל שאלה אחת בלבד בכל פעם
- אם הסטודנט הזכיר קושי/בעיה - חקור לעומק
- אם הסטודנט חיובי - שאל על נקודות חוזק
- אל תחזור על שאלות שכבר נשאלו
- היה אמפתי, תומך וידידותי
- דבר בעברית בלבד

`;

  // Adjust based on conversation progress
  if (messageCount < 3) {
    return basePrompt + `\nמצב: תחילת השיחה - התחל מהנושא הראשון בתוכנית.`;
  } else if (messageCount < 6) {
    return basePrompt + `\nמצב: אמצע השיחה - המשך עם הנושאים הבאים, חפש עומק.`;
  } else {
    return basePrompt + `\nמצב: סיום - אם כיסית את התוכנית, סכם ושאל שאלה אחרונה מסכמת.`;
  }
}

// POST /api/doublebot/start - Bot 2 generates outline, Bot 1 starts conversation
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { reflectionId } = req.body;

    const reflection = await GroupReflection.findOne({
      _id: reflectionId,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    // BOT 2: Generate question outline based on history
    const bot2Data = await bot2GenerateOutline(
      reflection.teamId || reflection.groupName,
      reflection.projectTopic
    );

    // BOT 1: Start conversation following Bot 2's outline
    const bot1Prompt = `אתה בוט שיחה (Bot 1) שמתחיל שיחה עם קבוצת סטודנטים.

הצוות עובד על: "${reflection.projectTopic}"

${bot2Data.hasHistory ? `זוהי שיחה מספר ${bot2Data.previousSessionCount + 1} של הצוות. יש ${bot2Data.pendingTasks} משימות ממתינות.` : 'זוהי השיחה הראשונה של הצוות.'}

תוכנית השאלות שלך (מ-Bot 2):
${bot2Data.outline}

שאל שאלת פתיחה ידידותית שמתחילה את הנושא הראשון מהתוכנית.
שאלה אחת בלבד. דבר בעברית.`;

    const botMessage = await callCerebras([], bot1Prompt);

    reflection.conversationHistory.push({
      role: 'assistant',
      content: botMessage
    });

    reflection.stage = 'conversation';

    // Store bot2's outline in the reflection for Bot 1 to follow
    if (!reflection.metadata) {
      reflection.metadata = {};
    }
    reflection.metadata = {
      bot2Outline: bot2Data.outline,
      hasHistory: bot2Data.hasHistory,
      previousSessionCount: bot2Data.previousSessionCount
    };

    await reflection.save();

    res.json({
      message: 'Conversation started',
      botMessage,
      bot2Context: {
        hasHistory: bot2Data.hasHistory,
        previousSessions: bot2Data.previousSessionCount,
        pendingTasks: bot2Data.pendingTasks
      },
      reflection
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/doublebot/message - Adaptive follow-up questions
router.post('/message', authenticateToken, async (req, res) => {
  try {
    console.log('📨 /message endpoint called');
    const { reflectionId, userMessage } = req.body;
    console.log('📝 User message:', userMessage);
    console.log('🔑 Reflection ID:', reflectionId);
    console.log('👤 User ID:', req.user._id);

    // Find the reflection (team members can access each other's reflections)
    const reflection = await GroupReflection.findOne({ _id: reflectionId });

    if (!reflection) {
      console.log('❌ Reflection not found in database');
      return res.status(404).json({ error: 'Reflection not found' });
    }

    console.log('📋 Reflection found');
    console.log('👥 Reflection teamId:', reflection.teamId);

    // Verify user is part of the same team (lenient for development)
    if (reflection.teamId) {
      const userTeam = await Team.findOne({ teamId: reflection.teamId });
      if (userTeam) {
        console.log('🔍 Team found:', reflection.teamId);
        console.log('📧 User email:', req.user.email);

        // Match by email since Team members don't have userId
        const isMember = userTeam.members?.some(m => {
          console.log('  - Checking member email:', m.email, '===', req.user.email);
          return m.email === req.user.email;
        });
        console.log('🔒 User is team member:', isMember);

        if (!isMember) {
          console.log('⚠️ Warning: User is not a team member, but allowing access for development');
          // In production, uncomment this to enforce strict access control:
          // return res.status(403).json({ error: 'Access denied - not a team member' });
        }
      } else {
        console.log('⚠️ Team not found in database, allowing access');
      }
    }

    console.log('✅ Access granted, adding user message');
    // Add user message
    reflection.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messageCount = reflection.conversationHistory.length;
    console.log('📊 Message count:', messageCount);

    // Get Bot 2's outline from metadata
    const bot2Outline = reflection.metadata?.bot2Outline || 'אין תוכנית זמינה - נהל שיחה כללית על דינמיקה קבוצתית.';
    console.log('📋 Bot2 outline exists:', !!reflection.metadata?.bot2Outline);

    const systemPrompt = getBot1SystemPrompt(bot2Outline, reflection.conversationHistory, messageCount);
    console.log('✅ System prompt generated');

    // Adaptive instructions based on user's message
    let adaptiveInstruction = `\nהסטודנט אמר: "${userMessage}"\n\n`;

    // Check for keywords and adapt
    if (userMessage.includes('בעיה') || userMessage.includes('קושי') || userMessage.includes('קשה')) {
      adaptiveInstruction += 'הסטודנט הזכיר קושי או בעיה. חקור את זה עמוק יותר - מה הסיבה? איך זה משפיע? מה אפשר לעשות?';
    } else if (userMessage.includes('טוב') || userMessage.includes('מצוין') || userMessage.includes('עובד')) {
      adaptiveInstruction += 'הסטודנט חיובי. שאל מה עוד עובד טוב ומהי נקודת החוזק של הקבוצה.';
    } else if (userMessage.includes('לא') || userMessage.includes('כולם') || userMessage.includes('מישהו')) {
      adaptiveInstruction += 'יש רמז לדינמיקה מעניינת. חקור את התפקידים והמעורבות של חברי הקבוצה.';
    } else if (messageCount > 8) {
      adaptiveInstruction += 'השיחה ארוכה - זמן לסכום. שאל שאלה מסכמת על מה הקבוצה למדה או רוצה לשפר.';
    } else {
      adaptiveInstruction += 'המשך לחקור את הדינמיקה הקבוצתית בהתבסס על מה שכבר נאמר.';
    }

    console.log('🤖 Calling Cerebras API...');
    const botMessage = await callCerebras(
      reflection.conversationHistory,
      systemPrompt + adaptiveInstruction
    );
    console.log('✅ Bot response received:', botMessage?.substring(0, 50) + '...');

    reflection.conversationHistory.push({
      role: 'assistant',
      content: botMessage
    });

    await reflection.save();
    console.log('💾 Reflection saved successfully');

    res.json({
      message: 'Message sent',
      botMessage,
      reflection
    });
  } catch (error) {
    console.error('❌ Message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// BOT 2: Analyze conversation and generate tasks (AFTER conversation)
async function bot2Analyze(reflection) {
  const conversationText = reflection.conversationHistory
    .map(m => m.content)
    .join(' ');

  const sentimentResults = await analyzeSentiment(conversationText);

  // GET CONVERSATION HISTORY for this team
  const previousReflections = await GroupReflection.find({
    teamId: reflection.teamId,
    _id: { $ne: reflection._id },
    stage: 'completed'
  }).sort({ createdAt: -1 }).limit(5);

  let historyContext = '';
  if (previousReflections.length > 0) {
    historyContext = `\n\nהיסטוריית שיחות קודמות של הצוות:
${previousReflections.map((ref, idx) => `
שיחה ${idx + 1} (${new Date(ref.createdAt).toLocaleDateString('he-IL')}):
- ניקוד: ${ref.scores?.overallScore || 'N/A'}
- ניתוח: ${ref.finalAnalysis?.substring(0, 200)}...
`).join('\n')}

חשוב: השווה את השיחה הנוכחית לשיחות הקודמות. האם יש שיפור? האם הבעיות נפתרו? תן המלצות בהתאם להתקדמות.`;
  } else {
    historyContext = '\n\nזוהי השיחה הראשונה של הצוות.';
  }

  // Enhanced analysis prompt with history
  const analysisPrompt = `נתח את השיחה הבאה בין בוט לקבוצת סטודנטים:

${conversationText}
${historyContext}

ספק ניתוח מעמיק (4-5 משפטים) על:
1. **תקשורת ושיתוף פעולה**: איך הקבוצה עובדת ביחד?
2. **נקודות חוזק**: מה עובד טוב בדינמיקה?
3. **אזורי שיפור**: איפה יש מקום להתפתחות?
${previousReflections.length > 0 ? '4. **התקדמות**: האם יש שיפור לעומת שיחות קודמות?' : ''}
5. **המלצה קונקרטית**: פעולה אחת ספציפית שהקבוצה צריכה לעשות השבוע.

דבר בעברית בלבד. היה ספציפי ומעשי.`;

  const analysisText = await callCerebras([], analysisPrompt);

  // Smart scoring based on conversation depth and sentiment
  let scores = {
    conversationQuality: 5,
    criticalThinking: 5,
    teamDynamics: 5,
    participationLevel: 'Low',
    insights: []
  };

  const messageCount = reflection.conversationHistory.length;

  // Conversation quality based on length and depth
  scores.conversationQuality = Math.min(10, 3 + Math.floor(messageCount / 2));
  scores.criticalThinking = Math.min(10, 4 + Math.floor(messageCount / 2.5));

  if (sentimentResults) {
    const sorted = sentimentResults.sort((a, b) => b.score - a.score);
    const dominant = sorted[0];

    if (dominant.label === 'positive') {
      scores.teamDynamics = 8 + Math.floor(dominant.score * 2);
      scores.participationLevel = 'High';
      scores.insights.push('🟢 אווירה חיובית ושיתוף פעולה טוב');
    } else if (dominant.label === 'neutral') {
      scores.teamDynamics = 6 + Math.floor(dominant.score);
      scores.participationLevel = 'Medium';
      scores.insights.push('🟡 שיחה מאוזנת ואובייקטיבית');
    } else {
      scores.teamDynamics = 4 + Math.floor(dominant.score);
      scores.participationLevel = 'Low';
      scores.insights.push('🔴 יש מתח או קושי בקבוצה - צריך תשומת לב');
    }

    scores.insights.push(`רגש דומיננטי: ${dominant.label} (${(dominant.score * 100).toFixed(0)}%)`);
  }

  // Bonus for deep conversations
  if (messageCount >= 8) {
    scores.insights.push('⭐ רפלקציה מעמיקה - השתתפות גבוהה');
    scores.conversationQuality = Math.min(10, scores.conversationQuality + 1);
  }

  scores.overallScore = Number(
    ((scores.conversationQuality + scores.criticalThinking + scores.teamDynamics) / 3).toFixed(1)
  );

  reflection.finalAnalysis = analysisText;
  reflection.scores = scores;
  reflection.stage = 'completed';
  await reflection.save();

  // Smart task generation
  const tasks = [];

  if (sentimentResults) {
    const sorted = sentimentResults.sort((a, b) => b.score - a.score);
    const dominant = sorted[0];

    if (dominant.label === 'negative' || dominant.score < 0.5) {
      tasks.push({
        teamId: reflection.teamId || reflection.groupName,
        title: 'פגישת חירום לשיפור האווירה',
        description: 'קיימו פגישת קבוצה דחופה לדון בקשיים ולשפר את התקשורת',
        category: 'communication',
        priority: 10,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      });
    } else if (dominant.label === 'neutral') {
      tasks.push({
        teamId: reflection.teamId || reflection.groupName,
        title: 'הגדירו תפקידים ברורים',
        description: 'וודאו שכל חבר קבוצה יודע בדיוק מה התפקיד שלו',
        category: 'planning',
        priority: 8,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      });
    }
  }

  if (messageCount < 6) {
    tasks.push({
      teamId: reflection.teamId || reflection.groupName,
      title: 'רפלקציה מעמיקה יותר',
      description: 'בפעם הבאה ענו על יותר שאלות (מינימום 8 הודעות)',
      category: 'communication',
      priority: 7,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }

  // Always add a follow-up task
  tasks.push({
    teamId: reflection.teamId || reflection.groupName,
    title: 'יישמו את ההמלצות',
    description: 'קראו את הניתוח והמלצות הבוט ויישמו לפחות המלצה אחת השבוע',
    category: 'other',
    priority: 9,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  for (const taskData of tasks) {
    const task = new Task(taskData);
    await task.save();
  }

  // Update team status
  if (reflection.teamId) {
    const team = await Team.findOne({ teamId: reflection.teamId });
    if (team) {
      const avgSentiment = sentimentResults?.[0]?.score || 0;

      if (avgSentiment > 0.5) {
        team.status = 'green';
      } else if (avgSentiment > 0.2) {
        team.status = 'yellow';
      } else {
        team.status = 'red';
      }

      team.averageSentiment = avgSentiment;
      team.lastActivity = new Date();
      team.sessionCount = (team.sessionCount || 0) + 1;
      await team.save();
    }
  }

  return {
    analysis: analysisText,
    scores,
    sentimentResults,
    tasks
  };
}

// POST /api/doublebot/analyze - Deep analysis
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { reflectionId } = req.body;

    const reflection = await GroupReflection.findOne({
      _id: reflectionId,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    // BOT 2: Analyze the conversation
    const result = await bot2Analyze(reflection);

    res.json({
      message: 'Analysis completed',
      analysis: result.analysis,
      scores: result.scores,
      sentimentResults: result.sentimentResults,
      tasks: result.tasks,
      reflection
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


