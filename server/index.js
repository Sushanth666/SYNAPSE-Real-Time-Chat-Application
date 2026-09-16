import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  initialUsers,
  initialConversations,
  initialMessages
} from './mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-Memory Database
const users = [...initialUsers];
const conversations = [...initialConversations];
const messages = [...initialMessages];

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// HTTP & WS Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map();
const disconnectGraceTimeouts = new Map();

function broadcast(event, payload, recipientIds) {
  const data = JSON.stringify({ event, payload });
  clients.forEach((session, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (!recipientIds || recipientIds.includes(session.userId)) {
        ws.send(data);
      }
    }
  });
}

function sendToUser(userId, event, payload) {
  const data = JSON.stringify({ event, payload });
  clients.forEach((session, ws) => {
    if (session.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// Ensure default 10 chats for any user (2 group channels + 8 direct chats with other teammates)
function ensureDefault10ChatsForUser(userId) {
  const currentUser = users.find(u => u.id === userId);
  if (!currentUser) return;

  // 1. Ensure user is in default group channels: c1 (Product Launch) and c4 (Design Systems)
  const group1 = conversations.find(c => c.id === 'c1');
  if (group1 && !group1.participantIds.includes(userId)) {
    group1.participantIds.push(userId);
  }
  const group2 = conversations.find(c => c.id === 'c4');
  if (group2 && !group2.participantIds.includes(userId)) {
    group2.participantIds.push(userId);
  }

  // 2. Count current direct chats
  const existingDirects = conversations.filter(
    c => c.type === 'direct' && c.participantIds.includes(userId)
  );

  const targetDirects = 8;
  if (existingDirects.length < targetDirects) {
    // Select other team members (strictly exclude currentUser by ID and Name)
    const eligibleOthers = users.filter(
      u => u.id !== userId && u.name.toLowerCase() !== currentUser.name.toLowerCase()
    );

    const needed = targetDirects - existingDirects.length;
    let addedCount = 0;

    for (const otherUser of eligibleOthers) {
      if (addedCount >= needed) break;

      const alreadyExists = conversations.some(
        c => c.type === 'direct' &&
             c.participantIds.includes(userId) &&
             c.participantIds.includes(otherUser.id)
      );

      if (!alreadyExists) {
        const convId = `c_direct_${[userId, otherUser.id].sort().join('_')}`;
        const minutesAgo = (addedCount + 1) * 12 + 6;
        const updatedAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

        const newConv = {
          id: convId,
          type: 'direct',
          name: otherUser.name,
          avatar: otherUser.avatar,
          participantIds: [userId, otherUser.id],
          updatedAt
        };

        conversations.push(newConv);

        // Seed 2 realistic messages
        const welcomeDialogues = [
          `Hey ${currentUser.name.split(' ')[0]}! Great to connect with you on Synapse.`,
          `Welcome to the team ${currentUser.name.split(' ')[0]}! Let me know if you want to pair on anything today.`,
          `Hi ${currentUser.name.split(' ')[0]}! Just reviewed the latest updates, everything looks solid.`,
          `Hey! Feel free to ping me here whenever you have questions about our modules.`,
          `Good to have you here ${currentUser.name.split(' ')[0]}! We just published the sprint objectives.`,
          `Hey there! I am testing the real-time presence indicators — looks super responsive.`,
          `Hi ${currentUser.name.split(' ')[0]}! Ping me when you are ready for a quick sync.`
        ];

        messages.push({
          id: `m_seed_${convId}_1`,
          conversationId: convId,
          senderId: otherUser.id,
          text: welcomeDialogues[addedCount % welcomeDialogues.length],
          createdAt: new Date(Date.now() - (minutesAgo + 4) * 60 * 1000).toISOString(),
          status: 'read'
        });

        messages.push({
          id: `m_seed_${convId}_2`,
          conversationId: convId,
          senderId: addedCount % 2 === 0 ? userId : otherUser.id,
          text: addedCount % 2 === 0
            ? `Thanks ${otherUser.name.split(' ')[0]}! Really excited to work together.`
            : `I've shared the reference links in our shared group channel as well.`,
          createdAt: updatedAt,
          status: 'read'
        });

        addedCount++;
      }
    }
  }
}

// Track whether initial unread chats have been initialized for a given user session
const userUnreadInitialized = new Set();

function isMessageUnreadForUser(m, userId) {
  if (m.senderId === userId) return false;
  if (Array.isArray(m.readBy)) {
    return !m.readBy.includes(userId);
  }
  return m.status === 'sent' || m.status === 'delivered';
}

// Ensures that whenever any user logs in, they have unread messages in exactly 4 to 5 chats
function ensureUnreadChatsForUser(userId, force = false) {
  if (!userId) return;
  if (!force && userUnreadInitialized.has(userId)) return;
  userUnreadInitialized.add(userId);

  const currentUser = users.find(u => u.id === userId);
  if (!currentUser) return;

  // 1. Ensure user has 10 conversations
  ensureDefault10ChatsForUser(userId);

  // 2. Fetch conversations for this user, sorted by updatedAt descending
  const userConvs = conversations
    .filter(c => c.participantIds.includes(userId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (userConvs.length < 6) return;

  // 3. Conversation 0: Keep completely read (since frontend automatically selects conv[0] on load)
  messages.filter(m => m.conversationId === userConvs[0].id).forEach(m => {
    if (!m.readBy) m.readBy = [];
    if (!m.readBy.includes(userId)) m.readBy.push(userId);
  });

  // 4. Any conversation from index 6 onwards: mark as read for this user
  for (let i = 6; i < userConvs.length; i++) {
    messages.filter(m => m.conversationId === userConvs[i].id).forEach(m => {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(userId)) m.readBy.push(userId);
    });
  }

  // 5. Exactly 5 conversations (indices 1, 2, 3, 4, 5) get unread messages
  const targetChats = userConvs.slice(1, 6);
  const targetCounts = [3, 2, 4, 1, 2];

  // Topic sets per conversation slot — each set has UNIQUE messages so no duplicates
  const topics = [
    // Slot 1 – Product launch coordination & roadmap
    [
      "The Q4 launch checklist is up in Notion — please review your section and confirm by EOD.",
      "Marketing just signed off on the hero copy. We're good to hand off to dev.",
      "Beta invite emails go out tomorrow — can someone double-check the onboarding flow one more time?"
    ],
    // Slot 2 – Design & visual QA
    [
      "Just uploaded the final glassmorphism card specs to Figma. Dark mode tokens are locked.",
      "Could you check the contrast ratios on the new notification badges?"
    ],
    // Slot 3 – Infrastructure & staging deployment
    [
      "Staging deployment finished successfully — all services green across US-East and EU-West.",
      "Load balancer is routing correctly. P95 latency is sitting at 11ms under simulated peak traffic.",
      "Health dashboard is live at /metrics. Let's review it together before the go/no-go call.",
      "Redis cache hit rate is at 94% — that's well above our 85% target for launch."
    ],
    // Slot 4 – Code review & QA feedback
    [
      "Left a review comment on the PR — just one minor issue with the optimistic update rollback path."
    ],
    // Slot 5 – Mobile & real-time feature testing
    [
      "Voice memo playback is silky smooth on iOS and Android — no clipping at all now.",
      "Tested on a throttled 3G connection — messages still deliver optimistically within 80ms."
    ]
  ];

  targetChats.forEach((conv, idx) => {
    // Cap count to topic set length so we never repeat messages in the same chat
    const topicSet = topics[idx % topics.length];
    const count = Math.min(targetCounts[idx], topicSet.length);
    const dialogueSet = topicSet;

    // Determine partner / sender
    let senderId;
    if (conv.type === 'direct') {
      senderId = conv.participantIds.find(id => id !== userId);
    } else {
      const teammate = users.find(u => u.id !== userId && conv.participantIds.includes(u.id));
      senderId = teammate ? teammate.id : 'u2';
    }
    if (!senderId) senderId = 'u2';

    // Mark prior existing messages in this chat as read by this user
    messages.filter(m => m.conversationId === conv.id).forEach(m => {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(userId)) m.readBy.push(userId);
    });

    // Seed fresh unread messages for this user
    const baseMinutesAgo = (idx + 1) * 8 + 4;
    let lastMsg = null;

    // Build a pool of senders from conversation participants (excluding current user) for variety
    const senderPool = conv.participantIds.filter(id => id !== userId);

    for (let k = 0; k < count; k++) {
      const minAgo = Math.max(1, baseMinutesAgo - (count - 1 - k) * 2);
      const createdAt = new Date(Date.now() - minAgo * 60 * 1000).toISOString();
      // Use exactly the k-th unique dialogue entry (no modulo cycling = no duplicates)
      const text = dialogueSet[k];
      // Rotate sender across available participants so messages come from different people
      const msgSenderId = senderPool[k % senderPool.length] || senderId;

      const unreadMsg = {
        id: `m_unread_${userId}_${conv.id}_${k}_${Date.now() + k}`,
        conversationId: conv.id,
        senderId: msgSenderId,
        text,
        createdAt,
        status: 'delivered',
        readBy: []
      };

      messages.push(unreadMsg);
      lastMsg = unreadMsg;
    }

    if (lastMsg) {
      conv.updatedAt = lastMsg.createdAt;
      conv.lastMessage = lastMsg;
    }
  });
}

// REST Routes

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, userId } = req.body;
  let user;

  if (userId) {
    user = users.find(u => u.id === userId);
  } else if (email) {
    user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({
      error: 'This email is not registered. Please check your email address or click Register to create an account.',
      code: 'EMAIL_NOT_REGISTERED'
    });
  }

  if (disconnectGraceTimeouts.has(user.id)) {
    clearTimeout(disconnectGraceTimeouts.get(user.id));
    disconnectGraceTimeouts.delete(user.id);
  }

  user.status = 'online';
  user.lastSeen = undefined;
  broadcast('presence:update', { userId: user.id, status: 'online' });

  // Ensure user has default 10 chats and unread chats for login
  ensureDefault10ChatsForUser(user.id);
  ensureUnreadChatsForUser(user.id, true);

  return res.json({
    user,
    token: `token_${user.id}_${Date.now()}`
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, avatar, bio } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({
      error: 'An account with this email is already registered. Please sign in instead.',
      code: 'EMAIL_ALREADY_EXISTS'
    });
  }

  const newUser = {
    id: `u_${Date.now()}`,
    name,
    email,
    avatar: (avatar && typeof avatar === 'string' && avatar.trim()) ? avatar.trim() : null,
    status: 'online',
    bio: bio || 'Synapse user'
  };

  users.push(newUser);

  if (disconnectGraceTimeouts.has(newUser.id)) {
    clearTimeout(disconnectGraceTimeouts.get(newUser.id));
    disconnectGraceTimeouts.delete(newUser.id);
  }

  // Automatically initialize default 10 chats and unread chats for newly registered user
  ensureDefault10ChatsForUser(newUser.id);
  ensureUnreadChatsForUser(newUser.id, true);
  broadcast('presence:update', { userId: newUser.id, status: 'online' });

  return res.json({
    user: newUser,
    token: `token_${newUser.id}_${Date.now()}`
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.replace('Bearer ', '');
  const match = token.match(/^token_(u\w+)_/);
  if (!match) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = match[1];
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (disconnectGraceTimeouts.has(user.id)) {
    clearTimeout(disconnectGraceTimeouts.get(user.id));
    disconnectGraceTimeouts.delete(user.id);
  }

  user.status = 'online';
  user.lastSeen = undefined;
  broadcast('presence:update', { userId: user.id, status: 'online' });

  ensureDefault10ChatsForUser(user.id);
  ensureUnreadChatsForUser(user.id, false);

  return res.json({ user });
});

// Users
app.get('/api/users', (_req, res) => {
  res.json(users);
});

app.patch('/api/users/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.replace('Bearer ', '');
  const match = token.match(/^token_(u\w+)_/);
  if (!match) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = match[1];
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, bio, avatar, status } = req.body;
  if (name && typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }
  if (bio !== undefined && typeof bio === 'string') {
    user.bio = bio.trim();
  }
  if (avatar !== undefined) {
    user.avatar = (avatar && typeof avatar === 'string' && avatar.trim()) ? avatar.trim() : null;
  }
  if (status && ['online', 'away', 'busy', 'offline'].includes(status)) {
    user.status = status;
  }

  return res.json({ user });
});

// Conversations
app.get('/api/conversations', (req, res) => {
  const userId = req.query.userId || 'u1';
  ensureDefault10ChatsForUser(userId);
  ensureUnreadChatsForUser(userId, false);

  const currentUser = users.find(u => u.id === userId);

  const userConversations = conversations
    .filter(c => c.participantIds.includes(userId))
    .map(c => {
      const convMessages = messages.filter(m => m.conversationId === c.id);
      const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined;

      // Count unread messages not sent by this user
      const unreadCount = convMessages.filter(m => isMessageUnreadForUser(m, userId)).length;

      // For direct chats, name & avatar must always be the other participant
      let displayName = c.name;
      let displayAvatar = c.avatar;
      if (c.type === 'direct') {
        const otherId = c.participantIds.find(id => id !== userId);
        const otherUser = users.find(u => u.id === otherId);
        if (otherUser) {
          displayName = otherUser.name;
          displayAvatar = otherUser.avatar;
        }
      }

      // Security check: NEVER display the logged-in user's own credentials/name as the chat name
      if (c.type === 'direct' && currentUser && displayName.toLowerCase() === currentUser.name.toLowerCase()) {
        const otherId = c.participantIds.find(id => id !== userId);
        const otherUser = users.find(u => u.id === otherId);
        if (otherUser && otherUser.name.toLowerCase() !== currentUser.name.toLowerCase()) {
          displayName = otherUser.name;
          displayAvatar = otherUser.avatar;
        } else {
          const alternateUser = users.find(u => u.id !== userId && u.name.toLowerCase() !== currentUser.name.toLowerCase());
          if (alternateUser) {
            displayName = alternateUser.name;
            displayAvatar = alternateUser.avatar;
          }
        }
      }

      return {
        ...c,
        name: displayName,
        avatar: displayAvatar,
        lastMessage,
        unreadCount,
        totalMessagesCount: convMessages.length,
        memberCount: c.participantIds?.length || 2
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json(userConversations);
});

app.post('/api/conversations', (req, res) => {
  const { type, name, participantIds, description, avatar } = req.body;
  if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 participants required' });
  }

  // If direct, check if already exists
  if (type === 'direct') {
    const existing = conversations.find(
      c => c.type === 'direct' &&
      c.participantIds.length === 2 &&
      c.participantIds.includes(participantIds[0]) &&
      c.participantIds.includes(participantIds[1])
    );
    if (existing) {
      return res.json(existing);
    }
  }

  const newConv = {
    id: `c_${Date.now()}`,
    type: type || 'direct',
    name: name || 'New Conversation',
    avatar: avatar || (type === 'group' ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80' : undefined),
    description,
    participantIds,
    adminIds: type === 'group' ? [participantIds[0]] : undefined,
    updatedAt: new Date().toISOString()
  };

  conversations.unshift(newConv);

  // Broadcast to participants
  broadcast('conversation:new', newConv, participantIds);

  res.status(201).json(newConv);
});

// Messages with cursor pagination
app.get('/api/conversations/:id/messages', (req, res) => {
  const convId = req.params.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const before = req.query.before; // ISO date string or message id

  let convMessages = messages
    .filter(m => m.conversationId === convId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (before) {
    const targetTime = isNaN(Date.parse(before))
      ? new Date(convMessages.find(m => m.id === before)?.createdAt || Date.now()).getTime()
      : new Date(before).getTime();

    convMessages = convMessages.filter(m => new Date(m.createdAt).getTime() < targetTime);
  }

  const total = convMessages.length;
  const sliced = convMessages.slice(Math.max(0, total - limit), total);
  const hasMore = total > limit;

  res.json({
    messages: sliced,
    hasMore,
    nextCursor: sliced.length > 0 ? sliced[0].createdAt : null
  });
});

// File upload with progress simulation & url return
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const isImage = file.mimetype.startsWith('image/');
  const fileUrl = `/uploads/${file.filename}`;

  const attachment = {
    id: `att_${Date.now()}`,
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
    url: fileUrl,
    thumbnail: isImage ? fileUrl : undefined
  };

  res.json(attachment);
});

// Email conversation backup endpoint
app.post('/api/conversations/:id/email-backup', (req, res) => {
  const { id } = req.params;
  const { email, conversationName, messageCount, transcript } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  console.log(`[Backup Email] Sending chat backup for conversation ${id} ("${conversationName || 'Chat'}") to ${email} (${messageCount || 0} messages)`);

  res.json({
    success: true,
    message: `Full chat backup successfully dispatched to ${email}`,
    email,
    conversationId: id,
    messageCount: messageCount || 0,
    backupId: `bk_${Date.now()}`,
    sentAt: new Date().toISOString()
  });
});

// WebSocket Handling
wss.on('connection', (ws) => {
  let authenticatedUserId = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { action, payload, token } = data;

      switch (action) {
        case 'auth': {
          let uId = payload?.userId;
          if (!uId && token) {
            const match = token.match(/^token_(u\w+)_/);
            if (match) uId = match[1];
          }
          if (uId) {
            if (disconnectGraceTimeouts.has(uId)) {
              clearTimeout(disconnectGraceTimeouts.get(uId));
              disconnectGraceTimeouts.delete(uId);
            }
            authenticatedUserId = uId;
            clients.set(ws, { ws, userId: uId });

            const user = users.find(u => u.id === uId);
            if (user) {
              user.status = 'online';
              user.lastSeen = undefined;
            }

            ws.send(JSON.stringify({
              event: 'auth:success',
              payload: { userId: uId, status: 'online' }
            }));

            broadcast('presence:update', { userId: uId, status: 'online' });
          }
          break;
        }

        case 'message:send': {
          const { conversationId, text, replyTo, attachments, tempId, poll, voiceMemo } = payload;
          if (!authenticatedUserId || !conversationId) return;

          const conv = conversations.find(c => c.id === conversationId);
          if (!conv || !conv.participantIds.includes(authenticatedUserId)) return;

          const newMsg = {
            id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            conversationId,
            senderId: authenticatedUserId,
            text: text || '',
            createdAt: new Date().toISOString(),
            status: 'sent',
            replyTo,
            attachments,
            reactions: {},
            poll,
            voiceMemo,
            readBy: [authenticatedUserId]
          };

          messages.push(newMsg);
          conv.updatedAt = newMsg.createdAt;

          // Check if any other participant is online to immediately mark as 'delivered'
          const onlineRecipients = conv.participantIds.filter(
            id => id !== authenticatedUserId && users.find(u => u.id === id)?.status !== 'offline'
          );
          if (onlineRecipients.length > 0) {
            newMsg.status = 'delivered';
          }

          // Broadcast to all participants of this conversation
          broadcast('message:new', { message: newMsg, tempId }, conv.participantIds);
          break;
        }

        case 'message:read': {
          const { conversationId, messageIds } = payload;
          if (!authenticatedUserId || !conversationId) return;

          const conv = conversations.find(c => c.id === conversationId);
          if (!conv) return;

          let updatedAny = false;
          messages.forEach(m => {
            if (
              m.conversationId === conversationId &&
              m.senderId !== authenticatedUserId &&
              (!messageIds || messageIds.includes(m.id))
            ) {
              if (!m.readBy) m.readBy = [];
              if (!m.readBy.includes(authenticatedUserId)) {
                m.readBy.push(authenticatedUserId);
                updatedAny = true;
              }
              m.status = 'read';
            }
          });

          if (updatedAny) {
            broadcast('message:status', {
              conversationId,
              status: 'read',
              readBy: authenticatedUserId
            }, conv.participantIds);
          }
          break;
        }

        case 'message:edit': {
          const { messageId, text } = payload;
          if (!authenticatedUserId || !messageId) return;

          const msg = messages.find(m => m.id === messageId);
          if (msg && msg.senderId === authenticatedUserId) {
            msg.text = text;
            msg.isEdited = true;
            msg.updatedAt = new Date().toISOString();

            const conv = conversations.find(c => c.id === msg.conversationId);
            if (conv) {
              broadcast('message:update', { message: msg }, conv.participantIds);
            }
          }
          break;
        }

        case 'message:delete': {
          const { messageId } = payload;
          if (!authenticatedUserId || !messageId) return;

          const msg = messages.find(m => m.id === messageId);
          if (msg && msg.senderId === authenticatedUserId) {
            msg.isDeleted = true;
            msg.text = 'This message was deleted';
            msg.attachments = [];

            const conv = conversations.find(c => c.id === msg.conversationId);
            if (conv) {
              broadcast('message:deleted', {
                messageId: msg.id,
                conversationId: msg.conversationId,
                message: msg
              }, conv.participantIds);
            }
          }
          break;
        }

        case 'message:react': {
          const { messageId, emoji } = payload;
          if (!authenticatedUserId || !messageId || !emoji) return;

          const msg = messages.find(m => m.id === messageId);
          if (msg) {
            if (!msg.reactions) msg.reactions = {};
            const userList = msg.reactions[emoji] || [];

            if (userList.includes(authenticatedUserId)) {
              // Remove reaction
              msg.reactions[emoji] = userList.filter(id => id !== authenticatedUserId);
              if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
              }
            } else {
              // Add reaction
              msg.reactions[emoji] = [...userList, authenticatedUserId];
            }

            const conv = conversations.find(c => c.id === msg.conversationId);
            if (conv) {
              broadcast('message:reaction', {
                messageId: msg.id,
                conversationId: msg.conversationId,
                reactions: msg.reactions
              }, conv.participantIds);
            }
          }
          break;
        }

        case 'message:pin': {
          const { messageId, conversationId } = payload;
          if (!authenticatedUserId || !messageId) return;

          const msg = messages.find(m => m.id === messageId);
          if (msg) {
            msg.isPinned = !msg.isPinned;
            const conv = conversations.find(c => c.id === (conversationId || msg.conversationId));
            if (conv) {
              conv.pinnedMessageId = msg.isPinned ? msg.id : undefined;
              broadcast('message:pin', {
                messageId: msg.id,
                conversationId: msg.conversationId,
                isPinned: msg.isPinned,
                pinnedMessage: msg.isPinned ? msg : null
              }, conv.participantIds);
            }
          }
          break;
        }

        case 'message:vote': {
          const { messageId, optionId } = payload;
          if (!authenticatedUserId || !messageId || !optionId) return;

          const msg = messages.find(m => m.id === messageId);
          if (msg && msg.poll) {
            const poll = msg.poll;
            poll.options.forEach((opt) => {
              if (opt.id === optionId) {
                if (opt.votes.includes(authenticatedUserId)) {
                  opt.votes = opt.votes.filter((id) => id !== authenticatedUserId);
                } else {
                  opt.votes.push(authenticatedUserId);
                }
              } else if (!poll.allowsMultiple) {
                opt.votes = opt.votes.filter((id) => id !== authenticatedUserId);
              }
            });

            const conv = conversations.find(c => c.id === msg.conversationId);
            if (conv) {
              broadcast('message:vote', {
                messageId: msg.id,
                conversationId: msg.conversationId,
                poll: msg.poll
              }, conv.participantIds);
            }
          }
          break;
        }

        case 'typing:start': {
          const { conversationId } = payload;
          if (!authenticatedUserId || !conversationId) return;

          const user = users.find(u => u.id === authenticatedUserId);
          const conv = conversations.find(c => c.id === conversationId);
          if (conv && user) {
            broadcast('typing:update', {
              conversationId,
              userId: authenticatedUserId,
              userName: user.name,
              isTyping: true
            }, conv.participantIds);
          }
          break;
        }

        case 'typing:stop': {
          const { conversationId } = payload;
          if (!authenticatedUserId || !conversationId) return;

          const conv = conversations.find(c => c.id === conversationId);
          if (conv) {
            broadcast('typing:update', {
              conversationId,
              userId: authenticatedUserId,
              isTyping: false
            }, conv.participantIds);
          }
          break;
        }

        case 'typing:simulate': {
          const { conversationId } = payload;
          if (!authenticatedUserId || !conversationId) return;
          const conv = conversations.find(c => c.id === conversationId);
          if (!conv) return;

          const partnerId = conv.participantIds.find(id => id !== authenticatedUserId) || 'u2';
          const partnerUser = users.find(u => u.id === partnerId) || users[1];
          if (partnerUser) {
            broadcast('typing:update', {
              conversationId,
              userId: partnerUser.id,
              userName: partnerUser.name,
              isTyping: true
            }, conv.participantIds);

            setTimeout(() => {
              broadcast('typing:update', {
                conversationId,
                userId: partnerUser.id,
                isTyping: false
              }, conv.participantIds);
            }, 3500);
          }
          break;
        }

        case 'presence:update': {
          const { status } = payload;
          if (!authenticatedUserId || !status) return;

          const user = users.find(u => u.id === authenticatedUserId);
          if (user) {
            user.status = status;
            if (status === 'offline') {
              user.lastSeen = new Date().toISOString();
            } else {
              user.lastSeen = undefined;
            }
            broadcast('presence:update', { userId: user.id, status, lastSeen: user.lastSeen });
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ event: 'pong', payload: { time: Date.now() } }));
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (authenticatedUserId) {
      clients.delete(ws);
      // Check if user has other active connections
      let hasOtherSession = false;
      clients.forEach(session => {
        if (session.userId === authenticatedUserId) hasOtherSession = true;
      });

      if (!hasOtherSession) {
        if (disconnectGraceTimeouts.has(authenticatedUserId)) {
          clearTimeout(disconnectGraceTimeouts.get(authenticatedUserId));
        }
        const timer = setTimeout(() => {
          disconnectGraceTimeouts.delete(authenticatedUserId);
          let stillHasSession = false;
          clients.forEach(session => {
            if (session.userId === authenticatedUserId) stillHasSession = true;
          });
          if (!stillHasSession) {
            const user = users.find(u => u.id === authenticatedUserId);
            if (user) {
              user.status = 'offline';
              user.lastSeen = new Date().toISOString();
              broadcast('presence:update', { userId: user.id, status: 'offline', lastSeen: user.lastSeen });
            }
          }
        }, 3000);
        disconnectGraceTimeouts.set(authenticatedUserId, timer);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Synapse Server] REST & WebSocket API listening on http://localhost:${PORT}`);
});
