import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Initialize Google Generative AI client only if API key is available
let gemini: GoogleGenerativeAI | null = null;
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

// Debug: Log all environment variables
console.log("🔍 Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("SERVER_PORT:", process.env.SERVER_PORT);
console.log("GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "SET" : "NOT SET");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from "public"
app.use(express.static("public"));

// In-memory storage for development (in production, use a proper database)
interface ParsedUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface LoginUser {
  id: number;
  name: string;
  email: string;
  loginTime: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface ChatRoom {
  id: string;
  type: "private" | "group";
  name?: string;
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastMessageAt: Date;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
  originalContent?: string;
  editTimestamp?: Date;
  status?: 'sent' | 'delivered' | 'read';
  readBy?: string[];
}

interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
}

// In-memory data storage
let users: User[] = [];
let chatRooms: ChatRoom[] = [];
// eslint-disable-next-line prefer-const
let messages: Message[] = [];
let groups: Group[] = [];
// eslint-disable-next-line prefer-const
let onlineUsers = new Map<string, string>(); // userId -> socketId

// Load existing data from files
const loadData = () => {
  try {
    // Load users
    const usersData = fs.readFileSync(path.join(process.cwd(), 'public/api/register.json'), 'utf8');
    const parsedUsers = JSON.parse(usersData);
    users = parsedUsers.map((user: ParsedUser) => ({
      ...user,
      id: user.id.toString(),
      isOnline: false,
      lastSeen: new Date()
    }));

    // Load existing messages
    try {
      const messagesData = fs.readFileSync(path.join(process.cwd(), 'public/api/messages.json'), 'utf8');
      const parsedMessages = JSON.parse(messagesData);
      messages = parsedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editTimestamp: msg.editTimestamp ? new Date(msg.editTimestamp) : undefined,
        lastSeen: msg.lastSeen ? new Date(msg.lastSeen) : undefined
      }));
      console.log(`📚 Loaded ${messages.length} existing messages`);
    } catch (error) {
      console.log('No existing messages found, starting with empty messages array');
      messages = [];
    }

    // Load existing chat rooms
    try {
      const chatRoomsData = fs.readFileSync(path.join(process.cwd(), 'public/api/chat-rooms.json'), 'utf8');
      const parsedChatRooms = JSON.parse(chatRoomsData);
      chatRooms = parsedChatRooms.map((room: any) => ({
        ...room,
        createdAt: new Date(room.createdAt),
        lastMessageAt: new Date(room.lastMessageAt)
      }));
      console.log(`🔒 Loaded ${chatRooms.length} existing chat rooms`);
    } catch (error) {
      console.log('No existing chat rooms found, will create default ones');
      chatRooms = [];
    }

    // Load existing groups
    try {
      const groupsData = fs.readFileSync(path.join(process.cwd(), 'public/api/groups.json'), 'utf8');
      const parsedGroups = JSON.parse(groupsData);
      groups = parsedGroups.map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt)
      }));
      console.log(`👥 Loaded ${groups.length} existing groups`);
    } catch (error) {
      console.log('No existing groups found, will create default ones');
      groups = [];
    }

    // Create default groups if none exist
    if (groups.length === 0) {
      groups = [
        {
          id: uuidv4(),
          name: "General",
          description: "General team discussions",
          members: users.map(u => u.id),
          admins: users.filter(u => u.role === "Admin" || u.id === users[0]?.id).map(u => u.id),
          createdBy: users[0]?.id || "",
          createdAt: new Date()
        }
      ];
    }

    // Create chat rooms for groups if none exist
    if (chatRooms.length === 0) {
      groups.forEach(group => {
        chatRooms.push({
          id: group.id,
          type: "group",
          name: group.name,
          participants: group.members,
          createdBy: group.createdBy,
          createdAt: group.createdAt,
          lastMessageAt: new Date()
        });
      });
    }

    console.log(`✅ Loaded ${users.length} users, ${groups.length} groups, ${chatRooms.length} chat rooms`);
  } catch (error) {
    console.error('Error loading data:', error);
    // Initialize with default data if files don't exist
    users = [];
    groups = [];
    chatRooms = [];
    messages = [];
  }
};

// Save data to files
const saveData = () => {
  try {
    const usersToSave = users.map(u => ({
      id: parseInt(u.id),
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role || "User"
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/register.json'), JSON.stringify(usersToSave, null, 2));
    
    // Save messages
    const messagesToSave = messages.map(m => ({
      ...m,
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString(),
      editTimestamp: m.editTimestamp ? (typeof m.editTimestamp === 'string' ? m.editTimestamp : m.editTimestamp.toISOString()) : undefined
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/messages.json'), JSON.stringify(messagesToSave, null, 2));
    
    // Save chat rooms
    const chatRoomsToSave = chatRooms.map(room => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      lastMessageAt: room.lastMessageAt.toISOString()
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/chat-rooms.json'), JSON.stringify(chatRoomsToSave, null, 2));
    
    // Save groups
    const groupsToSave = groups.map(group => ({
      ...group,
      createdAt: group.createdAt.toISOString()
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/groups.json'), JSON.stringify(groupsToSave, null, 2));
    
    console.log(`💾 Saved ${users.length} users, ${messages.length} messages, ${chatRooms.length} chat rooms, and ${groups.length} groups`);
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Initialize data
loadData();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User authentication
  socket.on('authenticate', (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      onlineUsers.set(userId, socket.id);
      user.isOnline = true;
      user.lastSeen = new Date();
      
      // Join user to their groups
      groups.forEach(group => {
        if (group.members.includes(userId)) {
          socket.join(group.id);
        }
      });

      // Notify others that user is online
      socket.broadcast.emit('userStatusChange', {
        userId,
        isOnline: true,
        lastSeen: user.lastSeen
      });

      console.log(`✅ User ${user.name} authenticated and online`);
    }
  });

  // Join private chat room
  socket.on('joinPrivateChat', (chatId: string) => {
    console.log(`🔒 User joining private chat: ${chatId}`);
    
    // Create private chat room if it doesn't exist
    if (!chatRooms.find(r => r.id === chatId && r.type === "private")) {
      const userIds = chatId.split('-');
      if (userIds.length === 2) {
        const newRoom: ChatRoom = {
          id: chatId,
          type: "private",
          participants: userIds,
          createdBy: userIds[0],
          createdAt: new Date(),
          lastMessageAt: new Date()
        };
        chatRooms.push(newRoom);
        console.log(`🔒 Created new private chat room: ${chatId}`);
      }
    }

    socket.join(chatId);
    console.log(`🔒 User joined private chat: ${chatId}`);
    
    // Send existing messages for this chat
    const existingMessages = messages.filter(m => m.chatId === chatId);
    console.log(`🔍 Found ${existingMessages.length} existing messages for room ${chatId}:`, existingMessages.map(m => ({ id: m.id, content: m.content.substring(0, 30), senderId: m.senderId })));
    if (existingMessages.length > 0) {
      socket.emit('loadMessages', existingMessages);
      console.log(`📚 Sent ${existingMessages.length} existing messages for room ${chatId}`);
    } else {
      console.log(`📭 No existing messages found for room ${chatId}`);
    }
    
    // Debug: Check room status after join
    const room = io.sockets.adapter.rooms.get(chatId);
    if (room) {
      console.log(`🔒 Room ${chatId} now has ${room.size} users:`, Array.from(room));
    }
  });

  // Send message
  socket.on('sendMessage', (data: { chatId: string, content: string, senderId: string }) => {
    const { chatId, content, senderId } = data;
    
    const message: Message = {
      id: uuidv4(),
      chatId,
      senderId,
      content,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      status: 'sent',
      readBy: [],
    };

    messages.push(message);

    // Ensure chat room exists and update last message time
    let chatRoom = chatRooms.find(r => r.id === chatId);
    if (!chatRoom) {
      const maybeIds = chatId.split('-');
      if (maybeIds.length === 2) {
        chatRoom = {
          id: chatId,
          type: "private",
          participants: [maybeIds[0], maybeIds[1]],
          createdBy: senderId,
          createdAt: new Date(),
          lastMessageAt: new Date()
        };
        chatRooms.push(chatRoom);
      }
    } else {
      chatRoom.lastMessageAt = new Date();
    }

    // Debug: Check who's in the room
    const room = io.sockets.adapter.rooms.get(chatId);
    if (room && room.size > 1) {
      console.log(`📨 Room ${chatId} has ${room.size} users:`, Array.from(room));
      
      // Broadcast message to all users in the chat room
      io.to(chatId).emit('receiveMessage', message);
      
      // Send delivery confirmation to sender
      socket.emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      
      // If recipient is online, mark as delivered
      const recipientSocketId = Array.from(room).find(socketId => socketId !== socket.id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      }
    } else {
      console.log(`📨 Room ${chatId} is empty or has only sender, using direct delivery`);
      // Direct delivery to recipient(s) since room broadcast might not work
      const ids = chatId.split('-');
      const recipients = ids.filter(id => id !== senderId);
      
      // Send message to sender first
      socket.emit('receiveMessage', message);
      socket.emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      
      // Send to recipients
      recipients.forEach(recipientId => {
        const sockId = onlineUsers.get(recipientId);
        if (sockId) {
          io.to(sockId).emit('receiveMessage', message);
          io.to(sockId).emit('messageDelivered', { messageId: message.id, status: 'delivered' });
        }
      });
    }

    console.log(`📨 Message sent in chat ${chatId}: ${content.substring(0, 50)}...`);
    console.log(`📨 Message ID: ${message.id}`);
    console.log(`📨 Sender: ${senderId}`);
    console.log(`📨 Recipients: ${chatId.split('-').filter(id => id !== senderId).join(', ')}`);
    
    // Save messages to file after sending
    saveData();
  });

  // Mark message(s) as read
  socket.on('markRead', (data: { chatId: string, messageIds?: string[], readerId: string }) => {
    const { chatId, messageIds, readerId } = data;
    const targetMessages = messages.filter(m => m.chatId === chatId && (!messageIds || messageIds.includes(m.id)));
    const updated: Message[] = [];
    targetMessages.forEach(m => {
      if (m.senderId !== readerId) {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(readerId)) {
          m.readBy.push(readerId);
        }
        // If all other participants have read, mark as read
        const room = chatRooms.find(r => r.id === chatId);
        if (room) {
          const others = room.participants.filter(p => p !== m.senderId);
          const allRead = others.every(p => m.readBy?.includes(p));
          if (allRead) {
            m.status = 'read';
          }
        }
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      io.to(chatId).emit('messagesRead', { chatId, messageIds: updated.map(u => u.id), readerId });
      
      // Save messages to file after marking as read
      saveData();
    }
  });

  // Edit message
  socket.on('editMessage', (data: { messageId: string, newContent: string, senderId: string }) => {
    const { messageId, newContent, senderId } = data;
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.senderId === senderId) {
      const timeDiff = Date.now() - message.timestamp.getTime();
      const oneMinute = 60 * 1000; // 1 minute in milliseconds
      
      if (timeDiff <= oneMinute) {
        message.originalContent = message.content;
        message.content = newContent;
        message.edited = true;
        message.editTimestamp = new Date();
        
        // Broadcast edited message
        io.to(message.chatId).emit('messageEdited', message);
        console.log(`✏️ Message edited: ${messageId}`);
        
        // Save messages to file after editing
        saveData();
      } else {
        socket.emit('editError', { message: 'Message can only be edited within 1 minute' });
      }
    }
  });

  // Delete message
  socket.on('deleteMessage', (data: { messageId: string, senderId: string }) => {
    const { messageId, senderId } = data;
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.senderId === senderId) {
      message.deleted = true;
      message.content = "This message was deleted";
      
      // Broadcast deleted message
      io.to(message.chatId).emit('messageDeleted', message);
      console.log(`🗑️ Message deleted: ${messageId}`);
      
      // Save messages to file after deleting
      saveData();
    }
  });

  // Create group
  socket.on('createGroup', (data: { name: string, description: string, members: string[], createdBy: string }) => {
    const { name, description, members, createdBy } = data;
    
    const group: Group = {
      id: uuidv4(),
      name,
      description,
      members: [...members, createdBy],
      admins: [createdBy],
      createdBy,
      createdAt: new Date()
    };

    groups.push(group);

    // Create chat room for group
    const chatRoom: ChatRoom = {
      id: group.id,
      type: "group",
      name: group.name,
      participants: group.members,
      createdBy,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };

    chatRooms.push(chatRoom);

    // Add all members to the socket room
    group.members.forEach(memberId => {
      const memberSocketId = onlineUsers.get(memberId);
      if (memberSocketId) {
        io.sockets.sockets.get(memberSocketId)?.join(group.id);
      }
    });

    // Broadcast new group to all members
    io.to(group.id).emit('groupCreated', group);
    console.log(`👥 Group created: ${name}`);
    
    // Save data after creating group
    saveData();
  });

  // Join group
  socket.on('joinGroup', (data: { groupId: string, userId: string }) => {
    const { groupId, userId } = data;
    const group = groups.find(g => g.id === groupId);
    
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
      socket.join(groupId);
      
      // Broadcast user joined
      io.to(groupId).emit('userJoinedGroup', { groupId, userId });
      console.log(`👤 User ${userId} joined group ${group.name}`);
      
      // Save data after user joins group
      saveData();
    }
  });

  // Leave group
  socket.on('leaveGroup', (data: { groupId: string, userId: string }) => {
    const { groupId, userId } = data;
    const group = groups.find(g => g.id === groupId);
    
    if (group && group.members.includes(userId)) {
      group.members = group.members.filter(id => id !== userId);
      group.admins = group.admins.filter(id => id !== userId);
      socket.leave(groupId);
      
      // Broadcast user left
      io.to(groupId).emit('userLeftGroup', { groupId, userId });
      console.log(`👤 User ${userId} left group ${group.name}`);
      
      // Save data after user leaves group
      saveData();
    }
  });

  // Typing indicator
  socket.on('typing', (data: { chatId: string, userId: string, isTyping: boolean }) => {
    socket.to(data.chatId).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Find and update user status
    for (const [userId, socketId] of Array.from(onlineUsers.entries())) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        const user = users.find(u => u.id === userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          
          // Notify others that user is offline
          socket.broadcast.emit('userStatusChange', {
            userId,
            isOnline: false,
            lastSeen: user.lastSeen
          });
        }
        break;
      }
    }
  });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let response;
    
    if (model === 'gemini') {
      // Gemini AI
      if (!gemini) {
        return res.status(500).json({ error: 'Gemini AI not configured' });
      }
      
      try {
        const geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // For now, just use the last message to test
        const lastMessage = messages[messages.length - 1].content;
        
        const result = await geminiModel.generateContent(lastMessage);
        response = result.response.text();
        
        console.log('✅ Gemini AI response generated successfully');
      } catch (geminiError) {
        console.error('❌ Gemini AI error:', geminiError);
        return res.status(500).json({ 
          error: 'Gemini AI error', 
          details: geminiError.message 
        });
      }
      
    } else if (model === 'openai') {
      // OpenAI ChatGPT
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI not configured' });
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      response = completion.choices[0]?.message?.content || 'No response generated';
      
    } else if (model === 'cohere') {
      // Cohere AI
      const cohereApiKey = process.env.COHERE_API_KEY;
      if (!cohereApiKey) {
        return res.status(500).json({ error: 'Cohere AI not configured' });
      }
      
      const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messages[messages.length - 1].content,
          model: 'command',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      
      if (!cohereResponse.ok) {
        throw new Error(`Cohere API responded with status: ${cohereResponse.status}`);
      }
      
      const cohereData = await cohereResponse.json();
      response = cohereData.text || 'No response generated from Cohere';
      
    } else if (model === 'deepai') {
      // DeepAI
      const deepaiApiKey = process.env.DEEPAI_API_KEY;
      if (!deepaiApiKey) {
        return res.status(500).json({ error: 'DeepAI not configured' });
      }
      
      const deepaiResponse = await fetch('https://api.deepai.org/api/text-generator', {
        method: 'POST',
        headers: {
          'api-key': deepaiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messages[messages.length - 1].content,
          model: 'text-generator',
        }),
      });
      
      if (!deepaiResponse.ok) {
        throw new Error(`DeepAI API responded with status: ${deepaiResponse.status}`);
      }
      
      const deepaiData = await deepaiResponse.json();
      response = deepaiData.output || 'No response generated from DeepAI';
      
    } else {
      return res.status(400).json({ error: 'Unsupported model' });
    }

    res.json({ response });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// Helper functions for user management
const readRegisterFile = (): ParsedUser[] => {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'public/api/register.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading register file:', error);
    return [];
  }
};

const writeRegisterFile = (users: ParsedUser[]) => {
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public/api/register.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing register file:', error);
    return false;
  }
};

const readLoginFile = (): LoginUser[] => {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'public/api/login.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading login file:', error);
    return [];
  }
};

const writeLoginFile = (users: LoginUser[]) => {
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public/api/login.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing login file:', error);
    return false;
  }
};

// Store passwords as plain text (for development - in production, use bcrypt)
const storePassword = (password: string) => {
  return password; // Store as plain text
};

// Authentication endpoints
app.post('/api/register', (req, res) => {
  try {
    const { name, email, password } = (req.body || {}) as { name?: string; email?: string; password?: string };
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    const users = readRegisterFile();
    
    // Check if email already exists
    if (users.find((user: ParsedUser) => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: storePassword(password)
    };
    
    users.push(newUser);
    
    if (writeRegisterFile(users)) {
      console.log(`✅ New user registered: ${email}`);
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful! Please login.',
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
      });
    } else {
      res.status(500).json({ error: 'Failed to save user data' });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = readRegisterFile();
    const user = users.find((u: ParsedUser) => u.email === email);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Add user to login.json (currently logged in users)
    const loggedInUsers = readLoginFile();
    
    // Check if user is already logged in
    const existingLogin = loggedInUsers.find((u: LoginUser) => u.id === user.id);
    if (existingLogin) {
      // Update login time
      existingLogin.loginTime = new Date().toISOString();
    } else {
      // Add new login entry
      const newLogin = {
        id: user.id,
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString()
      };
      loggedInUsers.push(newLogin);
    }
    
    writeLoginFile(loggedInUsers);
    
    console.log(`✅ User logged in: ${email}`);
    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    // Provide a safer error response, avoiding JSON parsing issues on the client
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.post('/api/logout', (req, res) => {
  try {
    const { email } = (req.body || {}) as { email?: string };
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const loggedInUsers = readLoginFile();
    const userIndex = loggedInUsers.findIndex((u: LoginUser) => u.email === email);
    
    if (userIndex !== -1) {
      const removedUser = loggedInUsers.splice(userIndex, 1)[0];
      writeLoginFile(loggedInUsers);
      console.log(`✅ User logged out: ${removedUser.email}`);
    }
    
    res.json({ success: true, message: 'Logout successful' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/:email', (req, res) => {
  try {
    const { email } = req.params;
    const loggedInUsers = readLoginFile();
    const loggedInUser = loggedInUsers.find((u: LoginUser) => u.email === email);
    
    if (!loggedInUser) {
      return res.status(401).json({ error: 'User not logged in' });
    }
    
    const users = readRegisterFile();
    const user = users.find((u: ParsedUser) => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TeamChat API endpoints
app.get('/api/users', (req, res) => {
  try {
    const usersList = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen
    }));
    res.json(usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/groups', (req, res) => {
  try {
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.get('/api/chat/:chatId/messages', (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMessages = messages.filter(m => m.chatId === chatId);
    res.json(chatMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/chats', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userChats = chatRooms.filter(room => 
      room.participants.includes(userId as string)
    );
    
    res.json(userChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Serve CRM data
app.get('/api/crm-data.json', (req, res) => {
  try {
    const crmDataPath = path.join(process.cwd(), 'public', 'api', 'crm-data.json');
    const crmData = fs.readFileSync(crmDataPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(crmData);
  } catch (error) {
    console.error('Error serving CRM data:', error);
    res.status(500).json({ error: 'Failed to load CRM data' });
  }
});

// News API endpoint using RapidAPI
app.get('/api/news', async (req, res) => {
  try {
    const { story, country = 'US', lang = 'en', sort = 'RELEVANCE' } = req.query;
    
    if (!story) {
      return res.status(400).json({ error: 'Story parameter is required' });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;

    if (!rapidApiKey || !rapidApiHost) {
      return res.status(500).json({ error: 'RapidAPI configuration missing' });
    }

    const url = `https://real-time-news-data.p.rapidapi.com/full-story-coverage?story=${story}&sort=${sort}&country=${country}&lang=${lang}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI responded with status: ${response.status}`);
    }

    const newsData = await response.json();
    res.json(newsData);
    
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

// POST endpoint to save new messages
app.post('/api/messages', (req, res) => {
  try {
    const newMessage = req.body;
    
    // Validate required fields
    if (!newMessage.chatId || !newMessage.senderId || !newMessage.content) {
      return res.status(400).json({ error: 'Missing required fields: chatId, senderId, content' });
    }
    
    // Add timestamp if not provided
    if (!newMessage.timestamp) {
      newMessage.timestamp = new Date().toISOString();
    }
    
    // Add to in-memory messages array
    messages.push(newMessage);
    
    // Save to file immediately
    saveData();
    
    console.log(`💾 New message saved: ${newMessage.content.substring(0, 30)}...`);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Periodic save to ensure data persistence
setInterval(() => {
  saveData();
  console.log(`💾 Periodic save completed at ${new Date().toISOString()}`);
}, 30000); // Save every 30 seconds

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveData();
  console.log('💾 All data saved before shutdown');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveData();
  console.log('💾 All data saved before shutdown');
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server running on http://localhost:${PORT}`);
  console.log(`📱 AI Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   - Register: http://localhost:${PORT}/api/register`);
  console.log(`   - Login: http://localhost:${PORT}/api/login`);
  console.log(`   - Logout: http://localhost:${PORT}/api/logout`);
  console.log(`💬 TeamChat endpoints:`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
  console.log(`   - Groups: http://localhost:${PORT}/api/groups`);
  console.log(`   - Chats: http://localhost:${PORT}/api/chats`);
  console.log(`📊 CRM Data endpoint: http://localhost:${PORT}/api/crm-data.json`);
  console.log(`📰 News API endpoint: http://localhost:${PORT}/api/news`);
  console.log(`🤖 Supported models: Gemini (default), OpenAI, Cohere, DeepAI`);
  console.log(`🔑 API Keys loaded:`);
  console.log(`   - Gemini: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Cohere: ${process.env.COHERE_API_KEY ? '✅' : '❌'}`);
  console.log(`   - DeepAI: ${process.env.DEEPAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - RapidAPI: ${process.env.RAPIDAPI_KEY ? '✅' : '❌'}`);
  console.log(`💾 Message persistence: ENABLED - Messages will be saved to messages.json`);
});