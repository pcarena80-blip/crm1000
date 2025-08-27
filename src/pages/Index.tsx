import { CRMSidebar } from "@/components/CRMSidebar";
import { TopBar } from "@/components/TopBar";
import { TaskItem } from "@/components/TaskItem";
import { LeadItem } from "@/components/LeadItem";
import { DealItem } from "@/components/DealItem";
import AIChatDashboard from "@/components/AIChatDashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCRMData } from "@/useCRMData";
import { useAuth } from "@/contexts/AuthContext";
import {
  Rocket,
  CheckCircle,
  DollarSign,
  Loader2,
  MessageSquare,
  Trophy,
  TrendingUp,
  Star,
  Crown,
  Medal,
  Award,
  Home,
  Search,
  Grid3X3,
  BarChart3,
  Settings,
  RefreshCw,
  User,
  MoreHorizontal,
  Send,
  Eye,
  Maximize2,
  MoreVertical,
  Clock,
  Wallet,
  TrendingDown,
  ExternalLink,
  Brain,
  Package,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Smile,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Key,
  Phone,
  Mic,
  Edit,
  Trash2,
  Forward,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { activityService } from "@/services/activityService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { io, Socket } from "socket.io-client";

type ChatMode = "private" | "general" | "group";

type UserT = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
};

type ChatMessage = {
  id: string | number;
  sender: string; // user id or "user1" for self
  content: string;
  timestamp: Date;
};

type AiMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

type UserScore = {
  id: string;
  name: string;
  role: string;
  score: number;
  level: "Master" | "Expert" | "Advanced" | "Intermediate" | string;
  avatar?: string;
  rank: number;
};

const Index = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Move ALL hooks to the top, before any conditional returns
  const [currentView, setCurrentView] = useState("overview");
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  // AI Chat state
  const [selectedAI, setSelectedAI] = useState<'gemini' | 'chatgpt' | 'cohere' | 'deepai'>('gemini');
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);

  // Search functionality for Private Chat
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Socket.IO connection for real-time messaging
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Only call useCRMData when user is authenticated
  const { data: crmData, isLoading, error } = useCRMData();

  // Mock user data for chat - moved to top to fix hoisting issue
  const mockUsers: UserT[] = [];

  // Initialize empty messages for private chats
  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatMessage[]>>({});

  // Mock messages for general chat - only keep basic team messages
  const mockGeneralMessages: ChatMessage[] = [];

  // Remove all dummy private messages - start with empty conversations
  const mockPrivateMessages: Record<string, ChatMessage[]> = {};

  // Mock user scores - replace with real data from backend
  const mockUserScores: UserScore[] = [];

  // Chat functionality state
  const [users, setUsers] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortedUsers, setSortedUsers] = useState<any[]>([]);
  
  // Message deduplication - track processed message IDs
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // Context menu functions
  const handleMessageRightClick = (e: React.MouseEvent, message: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const isMessageEditable = (message: any) => {
    if (!message.timestamp) return false;
    const messageTime = new Date(message.timestamp).getTime();
    const currentTime = Date.now();
    const oneMinute = 60 * 1000; // 60 seconds in milliseconds
    return (currentTime - messageTime) <= oneMinute;
  };

  const handleEditMessage = (message: any) => {
    setEditingMessage({
      id: message.id,
      content: message.content
    });
    closeContextMenu();
  };

  const handleDeleteMessage = async (message: any) => {
    try {
      // Mark message as deleted locally
      setChatMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
      
      // TODO: Send delete request to server
      console.log('🗑️ Message deleted:', message.id);
      
      toast({
        title: "Message Deleted",
        description: "Message has been deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
    closeContextMenu();
  };

  const handleForwardMessage = (message: any) => {
    // TODO: Implement forward functionality
    console.log('📤 Forwarding message:', message.id);
    toast({
      title: "Forward Message",
      description: "Forward functionality coming soon!",
      variant: "default"
    });
    closeContextMenu();
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editingMessage.content.trim()) return;
    
    try {
      // Update message locally
      setChatMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: editingMessage.content.trim(), edited: true } : msg
      ));
      
      // TODO: Send edit request to server
      console.log('✏️ Message edited:', editingMessage.id);
      
      toast({
        title: "Message Edited",
        description: "Message has been updated",
        variant: "default"
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive"
      });
    }
    
    setEditingMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu?.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu?.visible]);

  // Function to sort users by last message time (WhatsApp-style) with rate limiting
  const sortUsersByLastMessage = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID, skipping sort');
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users to sort');
      return;
    }
    
    try {
      console.log('🔄 Sorting users by last message...');
      console.log('👥 Current users array:', users);
      console.log('👤 Current user ID:', user.id);
      
      // Get all messages
      const response = await fetch('/api/messages.json');
      const allMessages = await response.json();
      console.log('📨 Messages loaded:', allMessages.length);
      
      // Get all users except current user
      const otherUsers = users.filter((userItem: any) => 
        userItem.id.toString() !== user.id.toString()
      );
      console.log('👥 Other users (excluding current):', otherUsers.length);
      
      // Calculate last message time for each user
      const usersWithLastMessage = otherUsers.map((userItem: any) => {
        const selfId = user.id.toString();
        const peerId = userItem.id.toString();
        const chatId = [selfId, peerId].sort().join('-');
        
        // Find the latest message in this chat
        const chatMessages = allMessages.filter((msg: any) => msg.chatId === chatId);
        const lastMessage = chatMessages.length > 0 
          ? chatMessages.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          : null;
        
        return {
          ...userItem,
          lastMessageTime: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0,
          lastMessage: lastMessage ? lastMessage.content : null
        };
      });
      
      // Sort by last message time (most recent first)
      const sorted = usersWithLastMessage.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      console.log('✅ Sorted users:', sorted);
      setSortedUsers(sorted);
      console.log('✅ Users sorted successfully');
    } catch (error) {
      console.error('❌ Error sorting users by last message:', error);
      // Fallback to original user list
      const otherUsers = users.filter((userItem: any) => 
        userItem.id.toString() !== user.id.toString()
      );
      console.log('🔄 Fallback: setting unsorted users:', otherUsers);
      setSortedUsers(otherUsers);
    }
  }, [user?.id, users]);

  // Chat functions - defined early to avoid initialization errors
  const loadChatMessages = useCallback(async () => {
    if (!selectedChatUser || !currentUser) return;
    
    setIsLoadingMessages(true);
    try {
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      // Load messages from messages.json
      const response = await fetch('/api/messages.json');
      const allMessages = await response.json();
      
      // Filter messages for this chat
      const chatMessages = allMessages.filter((msg: any) => msg.chatId === chatId);
      setChatMessages(chatMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChatUser, currentUser]);

  // Add authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting...');
      return;
    }
    console.log('User authenticated:', user);
  }, [isAuthenticated, user]);
  
  // Add error handling for CRM data
  useEffect(() => {
    if (error) {
      console.error('CRM Data Error:', error);
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Initialize messages based on chat mode/user and seed leaderboard
  useEffect(() => {
    if (chatMode === "general") {
      setMessages(mockGeneralMessages);
    } else if (selectedUser) {
      setMessages(privateMessages[selectedUser] || []);
    } else {
      setMessages([]);
    }
    setUserScores(mockUserScores);
  }, [chatMode, selectedUser, privateMessages]);

  // Update messages when selectedUser changes
  useEffect(() => {
    if (chatMode === "private" && selectedUser) {
      setMessages(privateMessages[selectedUser] || []);
    }
  }, [selectedUser, chatMode, privateMessages]);

  // Auto scroll for both chats
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isTyping]);

  // Auto scroll for private chat messages - WhatsApp style
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        // Also try to scroll the chat container directly
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages.length]);

  // Scroll to bottom when chat user changes (opening a new chat)
  useEffect(() => {
    if (selectedChatUser) {
      // Small delay to ensure messages are loaded and DOM is updated
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        // Also try to scroll the chat container directly
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 200);
    }
  }, [selectedChatUser]);

  // Load users for chat
  useEffect(() => {
    const loadUsers = async () => {
      console.log('🔄 Loading users...');
      setIsLoadingUsers(true);
      try {
        const response = await fetch('/api/register.json');
        console.log('📡 Users API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const usersData = await response.json();
        console.log('👥 Users data loaded:', usersData);
        console.log('👥 Number of users:', usersData.length);
        
        setUsers(usersData);
        setCurrentUser(user);
        
        // Initialize sortedUsers with users data immediately
        const otherUsers = usersData.filter((userItem: any) => 
          userItem.id.toString() !== user.id.toString()
        );
        setSortedUsers(otherUsers);
        console.log('👥 Initial sortedUsers set:', otherUsers.length);
        
        // Also set the regular users array as fallback
        setUsers(usersData);
        console.log('👥 Users array set:', usersData.length);
        
        // Sort users by last message time after loading
        setTimeout(() => sortUsersByLastMessage(), 100);
      } catch (error) {
        console.error('❌ Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (user && isAuthenticated) {
      console.log('✅ User authenticated, loading users...');
      console.log('👤 Current user:', user);
      loadUsers();
    } else {
      console.log('❌ No user authenticated, skipping user load');
      console.log('👤 User state:', user);
      console.log('🔐 Is authenticated:', isAuthenticated);
    }
  }, [user, isAuthenticated]); // Added isAuthenticated dependency

  // Load messages when user selection changes
  useEffect(() => {
    if (selectedChatUser && currentUser && socket) {
      // Join the private chat room
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      console.log('🔌 Joining chat room:', chatId);
      socket.emit('joinPrivateChat', chatId);
      
      // Load existing messages
      loadChatMessages();
    }
  }, [selectedChatUser, currentUser, socket]); // Removed loadChatMessages dependency

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedChatUser && currentUser && socket && isConnected) {
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      // Mark all messages in this chat as read
      const unreadMessages = chatMessages.filter(m => 
        m.chatId === chatId && 
        !m.readBy?.includes(selfId) &&
        m.senderId !== selfId
      );
      
      if (unreadMessages.length > 0) {
        console.log('👁️ Marking messages as read:', unreadMessages.length);
        
        // Update local state to mark messages as read
        setChatMessages(prev => prev.map(msg => 
          msg.chatId === chatId && 
          !msg.readBy?.includes(selfId) &&
          msg.senderId !== selfId
            ? { ...msg, readBy: [...(msg.readBy || []), selfId], status: 'read' }
            : msg
        ));
        
        // Send read status to server via socket
        socket.emit('markRead', {
          chatId,
          messageIds: unreadMessages.map(m => m.id),
          readerId: selfId
        });
      }
    }
  }, [selectedChatUser, currentUser, socket, isConnected, chatMessages]);

  // Chat functions

  const sendChatMessage = async () => {
    if (!selectedChatUser || !currentUser || !chatInput.trim()) return;
    
    console.log('🚀 sendChatMessage called with:', { selectedChatUser, currentUser, chatInput: chatInput.trim() });
    
    const selfId = currentUser.id.toString();
    const peerId = selectedChatUser.id.toString();
    const chatId = [selfId, peerId].sort().join('-');
    
    console.log('🔍 Chat details:', { selfId, peerId, chatId });
    
    const newMessage = {
      // Don't set ID - let backend generate it to prevent duplicates
      chatId,
      senderId: selfId,
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
      status: 'sent',
      readBy: []
    };
    
    console.log('📝 New message object:', newMessage);
    
    // Add temporary message to local state for immediate feedback
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: selfId,
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
      status: 'sending', // Mark as sending
      readBy: []
    };
    
    setChatMessages(prev => [...prev, tempMessage]);
    
    // Clear input immediately for better UX
    setChatInput('');
    
    // Send message to server via socket only (backend will save it)
    if (socket) {
      console.log('🔌 Sending message via socket:', { chatId, content: chatInput.trim(), senderId: selfId });
      socket.emit('sendMessage', {
        chatId,
        content: chatInput.trim(),
        senderId: selfId
      });
    } else {
      console.log('❌ Socket not available, cannot send message');
      // Remove temporary message if socket is not available
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast({
        title: "Connection Error",
        description: "Cannot send message. Please refresh the page.",
        variant: "destructive"
      });
    }
  };
  
  // Search users from register.json
  const searchUsers = useCallback(async (query: string) => {
    if (!user?.id) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/register.json');
      const allUsers = await response.json();
      
      // Filter out the current logged-in user
      const otherUsers = allUsers.filter((userItem: any) => 
        userItem.id.toString() !== user.id.toString()
      );
      
      if (!query.trim()) {
        // Show sorted users when no search query (WhatsApp-style)
        setSearchResults(sortedUsers);
      } else {
        // Filter users based on search query (name or email)
        const filteredUsers = otherUsers.filter((userItem: any) => 
          userItem.name.toLowerCase().includes(query.toLowerCase()) ||
          userItem.email.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]);
  
  // Search effect with debouncing
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        // Show sorted users when no search query (WhatsApp-style)
        setSearchResults(sortedUsers);
      }
    }, 500); // Increased debounce time to reduce API calls
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isAuthenticated, user, searchUsers]); // Removed sortedUsers dependency to prevent infinite loops
  
  // Load all users on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize with sorted users
      setTimeout(() => sortUsersByLastMessage(), 100);
    }
  }, [isAuthenticated, user]); // Removed sortUsersByLastMessage dependency to prevent infinite loops
  
  // Socket.IO connection setup
  useEffect(() => {
    if (isAuthenticated && user) {
      const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:3001';
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);
      
      const newSocket = io(serverUrl, { 
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      // Store socket in state
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server');
        setIsConnected(true);
        
        // Authenticate user with Socket.IO
        newSocket.emit('authenticate', user.id.toString());
        console.log('🔐 Authenticating user:', user.id);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server. Trying to reconnect...",
          variant: "destructive"
        });
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from Socket.IO server:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          newSocket.connect();
        }
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Reconnected to Socket.IO server after', attemptNumber, 'attempts');
        setIsConnected(true);
        
        // Re-authenticate after reconnection
        newSocket.emit('authenticate', user.id.toString());
        
        // Re-join current chat room if any
        if (selectedChatUser && currentUser) {
          const selfId = currentUser.id.toString();
          const peerId = selectedChatUser.id.toString();
          const chatId = [selfId, peerId].sort().join('-');
          newSocket.emit('joinPrivateChat', chatId);
        }
      });
      
      newSocket.on('reconnect_error', (error) => {
        console.error('🔌 Reconnection error:', error);
        setIsConnected(false);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.error('🔌 Reconnection failed');
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Unable to reconnect to chat server. Please refresh the page.",
          variant: "destructive"
        });
      });
      
      // Listen for incoming messages
      const handleReceiveMessage = (message: any) => {
        console.log('📨 Received real-time message:', message);
        
        // Skip if this is our own message (we already added it locally)
        if (message.senderId === user.id.toString()) {
          console.log('📨 Skipping own message in real-time handler');
          return;
        }
        
        // Create message object for chatMessages state
        const newMessage = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          timestamp: message.timestamp,
          edited: false,
          deleted: false,
          status: 'received',
          readBy: []
        };
        
        // Update chatMessages state if this is for the currently selected chat
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const currentChatId = [selfId, peerId].sort().join('-');
          
          if (message.chatId === currentChatId) {
            console.log('📨 Adding real-time message to current chat');
            setChatMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('📨 Message already exists, skipping duplicate');
                return prev;
              }
              
              // Add new message
              return [...prev, newMessage];
            });
            
            // Update sorted users to reflect new message order
            setTimeout(() => sortUsersByLastMessage(), 100);
          }
        }

        // Show toast notification for new messages (only if not in current chat)
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const currentChatId = [selfId, peerId].sort().join('-');
          
          if (message.chatId !== currentChatId) {
            const senderName = users.find(u => u.id.toString() === message.senderId)?.name || 'Unknown';
            toast({
              title: "New Message",
              description: `New message from ${senderName}`,
              variant: "default"
            });
          }
        }
      };
      
      newSocket.on('receiveMessage', handleReceiveMessage);

      // Listen for loading existing messages
      const handleLoadMessages = (messages: any) => {
        console.log('📚 Loading existing messages:', messages.length);
        
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const chatId = [selfId, peerId].sort().join('-');
          const chatMessages = messages.filter((m: any) => m.chatId === chatId);
          setChatMessages(chatMessages);
          
          // Update sorted users after loading messages
          setTimeout(() => sortUsersByLastMessage(), 100);
        }
      };

      // Listen for message delivery status
      const handleMessageDelivered = (data: any) => {
        console.log('✅ Message delivered:', data);
        
        // Update message status to delivered
        setChatMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        ));
      };
      
      // Listen for message read status
      const handleMessagesRead = (data: any) => {
        console.log('👁️ Messages read:', data);
        
        // Update message status to read
        setChatMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
        ));
      };
      
      // Listen for new user registrations
      const handleNewUserRegistered = (newUser: any) => {
        console.log('👤 New user registered via Socket.IO:', newUser);
        
        // Add new user to users array
        setUsers(prev => {
          // Check if user already exists
          const userExists = prev.some(u => u.id.toString() === newUser.id.toString());
          if (userExists) {
            console.log('👤 User already exists, skipping duplicate');
            return prev;
          }
          
          // Add new user
          const updatedUsers = [...prev, newUser];
          console.log('👥 Users updated with new user:', updatedUsers.length);
          return updatedUsers;
        });
        
        // Also update sortedUsers
        setSortedUsers(prev => {
          // Check if user already exists
          const userExists = prev.some(u => u.id.toString() === newUser.id.toString());
          if (userExists) {
            return prev;
          }
          
          // Add new user to sorted list
          const updatedSortedUsers = [...prev, newUser];
          console.log('👥 Sorted users updated with new user:', updatedSortedUsers.length);
          return updatedSortedUsers;
        });
        
        // Show toast notification
        toast({
          title: "New User Joined",
          description: `${newUser.name} has joined the platform!`,
          variant: "default"
        });
      };
      
      newSocket.on('loadMessages', handleLoadMessages);
      newSocket.on('messageDelivered', handleMessageDelivered);
      newSocket.on('messagesRead', handleMessagesRead);
      newSocket.on('newUserRegistered', handleNewUserRegistered);
      
      // Cleanup function
      return () => {
        console.log('🔌 Cleaning up socket connection');
        // Remove event listeners to prevent memory leaks
        newSocket.off('receiveMessage', handleReceiveMessage);
        newSocket.off('loadMessages', handleLoadMessages);
        newSocket.off('messageDelivered', handleMessageDelivered);
        newSocket.off('messagesRead', handleMessagesRead);
        newSocket.off('newUserRegistered', handleNewUserRegistered);
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, selectedChatUser, currentUser, users, sortUsersByLastMessage, toast]);

  // Helper function for level colors
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Master":
        return "bg-yellow-100 text-yellow-800";
      case "Expert":
        return "bg-orange-100 text-orange-800";
      case "Advanced":
        return "bg-blue-100 text-blue-800";
      case "Intermediate":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function for level icons
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Master":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "Expert":
        return <Trophy className="w-4 h-4 text-orange-500" />;
      case "Advanced":
        return <Medal className="w-4 h-4 text-blue-500" />;
      case "Intermediate":
        return <Award className="w-4 h-4 text-green-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication error if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard</p>
          <p className="text-sm text-gray-500 mb-4">Current auth state: {JSON.stringify({ user, isAuthenticated, authLoading })}</p>
          <Button onClick={() => window.location.href = "/login"}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state for CRM data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state for CRM data
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkTaskDone = (taskId: number) => {
    toast({
      title: "Task completed!",
      description: "Task has been marked as done.",
    });

    // Remove dummy scoring system
    // updateScores("user1", 50);

    activityService.log({
      type: "project",
      title: "Task completed",
      description: "Marked a task as done",
      priority: "medium",
      status: "completed",
      user: { id: "user1", name: "You", role: "Admin" },
      metadata: { taskId },
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (chatMode === "private" && !selectedUser) return;
    
    // Prevent users from messaging themselves
    if (chatMode === "private" && selectedUser) {
      const actualUserId = selectedUser.replace('user_', '');
      if (actualUserId === user.id.toString()) {
        toast({
          title: "Cannot Send Message",
          description: "You cannot send a message to yourself.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (!socket || !isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to chat server. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    if (chatMode === "private" && selectedUser) {
      const actualUserId = selectedUser.replace('user_', '');
      
      // Join private chat room
      const roomId = [user.id.toString(), actualUserId].sort().join('-');
      socket.emit('joinPrivateChat', {
        userId1: user.id.toString(),
        userId2: actualUserId
      });
      
      // Send message through Socket.IO
      socket.emit('sendMessage', {
        chatId: roomId,
        content: newMessage.trim(),
        senderId: user.id.toString()
      });
      
      console.log(`📨 Sent message to user ${actualUserId} in room ${roomId}`);
    }

    setNewMessage("");
  };

  const renderOverview = () => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Sales Analysis</h1>
            <p className="text-muted-foreground">Comprehensive overview of your business performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-blue-600 hover:bg-blue-700">+ Add Widget</Button>
            <Button variant="outline" size="icon">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="outline">Filter</Button>
          </div>
        </div>
      </div>

      {/* AI Assistant Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 bg-gradient-to-br to-black from-gray-900 via-purple-900 text-white border-0 shadow-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Gemini AI Assistant</h3>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Powered by Google Gemini. Get intelligent insights and assistance for your business needs.
              </p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 border-0" onClick={() => setCurrentView("ai-chat")}>
                Chat with Gemini
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Total Sales Widget */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Total Sales</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="week">
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Mon</span>
                <span className="text-muted-foreground">Tue</span>
                <span className="text-muted-foreground">Wed</span>
                <span className="text-muted-foreground">Thur</span>
                <span className="text-muted-foreground">Fri</span>
                <span className="text-muted-foreground">Sat</span>
              </div>
              <div className="flex justify-between items-end h-32">
                <div className="w-8 bg-orange-500 rounded-t-sm h-14 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$450.60</span>
                </div>
                <div className="w-8 bg-orange-500 rounded-t-sm h-20 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$542.34</span>
                </div>
                <div className="w-8 bg-orange-500 rounded-t-sm h-24 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$750.26</span>
                </div>
                <div className="w-8 bg-orange-500 rounded-t-sm h-28 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$890.58</span>
                </div>
                <div className="w-8 bg-orange-500 rounded-t-sm h-24 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$750.26</span>
                </div>
                <div className="w-8 bg-orange-500 rounded-t-sm h-28 relative">
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-orange-600">$890.58</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Revenue Widget */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Sales Revenue</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">24% for 1 day</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">$1,609.18</div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Received Amount</span>
                </div>
                <div className="h-16 bg-green-100 rounded mt-2 flex items-end justify-center">
                  <div className="w-full bg-green-500 rounded h-12"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">8%</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">$2,189.21</div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Ordered Amount</span>
                </div>
                <div className="h-16 bg-red-100 rounded mt-2 flex items-end justify-center">
                  <div className="w-full bg-red-500 rounded h-8"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Recent Sales</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="week">
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Uzair", time: "Today", status: "New", amount: "+$324.99", statusColor: "bg-green-100 text-green-800" },
                { name: "Umair", time: "2 Days Ago", status: "New", amount: "+$200.00", statusColor: "bg-green-100 text-green-800" },
                { name: "Hannan", time: "1 Day Ago", status: "Cancelled", amount: "", statusColor: "bg-red-100 text-red-800" },
                { name: "Samreen", time: "2 Days Ago", status: "Completed", amount: "+$840.99", statusColor: "bg-purple-100 text-purple-800" },
              ].map((sale, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {sale.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{sale.name}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={sale.statusColor}>{sale.status}</Badge>
                    {sale.amount && <span className="text-sm font-medium text-green-600">{sale.amount}</span>}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Growth</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="67.8"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-purple-600">+73.1%</div>
                <div className="text-xs text-muted-foreground">Growth rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Item Sales Widget */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Top Item Sales</CardTitle>
              </div>
              <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700">
                View All &gt;
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Infinix Smartphone", category: "Mobiles", amount: "$320.24", change: "+12%", changeColor: "text-green-600" },
                { name: "Khaadi Kurta", category: "Clothing", amount: "$180.90", change: "-23%", changeColor: "text-red-600" },
                { name: "Cricket Bat", category: "Sports", amount: "$124.00", change: "+42%", changeColor: "text-green-600" },
                { name: "Harry Potter and the Cursed Child", category: "Books", amount: "$100.40", change: "+29%", changeColor: "text-green-600" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.amount}</p>
                      <p className={`text-xs ${item.changeColor}`}>{item.change}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, 60 + index * 10)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderLeads = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Leads</h1>
        <p className="text-muted-foreground">Manage your lead pipeline</p>
      </div>

      <div className="space-y-4">
        {crmData?.leads.map((lead) => (
          <LeadItem key={lead.id} name={lead.name} email={lead.email} company={lead.company} status={lead.status} value={lead.value} source={lead.source} />
        ))}
      </div>
    </>
  );

  const renderDeals = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Deals</h1>
        <p className="text-muted-foreground">Track your sales opportunities</p>
      </div>

      <div className="space-y-4">
        {crmData?.deals.map((deal) => (
          <DealItem
            key={deal.id}
            title={deal.title}
            company={deal.company}
            value={deal.value}
            stage={deal.stage}
            probability={deal.probability}
            closeDate={deal.closeDate}
            owner={deal.owner}
          />
        ))}
      </div>
    </>
  );

  const renderTasks = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tasks</h1>
        <p className="text-muted-foreground">Manage your daily tasks</p>
      </div>

      <div className="space-y-4">
        {crmData?.tasks.map((task) => (
          <TaskItem key={task.id} title={task.title} dueDate={task.dueDate} onMarkDone={() => handleMarkTaskDone(task.id)} />
        ))}
      </div>
    </>
  );

    const renderChat = () => {
    return (
      <>
        {/* Full-Screen Team Chat Mode */}
        <div className="fixed inset-0 bg-white z-50">
          {/* Chat Header */}
          <div className="h-16 bg-white border-b flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (selectedChatUser) {
                    setSelectedChatUser(null);
                  } else {
                    setCurrentView("overview");
                  }
                }} 
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <Search className="w-5 h-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* True Responsive Layout - One Panel at a Time on Mobile */}
          <div className="h-[calc(100vh-64px)] relative">
            {/* Mobile: Show Chat List OR Chat Area (not both) */}
            {/* Desktop: Show both side by side */}
            
            {/* Chat List Panel */}
            <div className={`${
              selectedChatUser 
                ? 'hidden md:block md:absolute md:left-0 md:top-0 md:bottom-0 md:w-80' 
                : 'block absolute inset-0 md:relative md:w-80'
            } bg-white border-gray-200 border-r flex flex-col min-w-0 z-10 transition-all duration-300 ease-in-out`}>
              {/* Chat List Header with Tabs */}
              <div className="p-3 border-b bg-white border-gray-200">
                <div className="flex space-x-1 mb-3">
                  <button className="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
                    General {chatMessages.filter(m => !m.readBy?.includes(currentUser?.id?.toString())).length}
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg">
                    Archive 0
                  </button>
                  <button 
                    onClick={() => {
                      // Manual refresh of users
                      const loadUsers = async () => {
                        try {
                          const response = await fetch('/api/register.json');
                          if (response.ok) {
                            const usersData = await response.json();
                            setUsers(usersData);
                            const otherUsers = usersData.filter((userItem: any) => 
                              userItem.id.toString() !== user?.id?.toString()
                            );
                            setSortedUsers(otherUsers);
                            toast({
                              title: "Users Refreshed",
                              description: `Found ${usersData.length} users`,
                              variant: "default"
                            });
                          }
                        } catch (error) {
                          console.error('Error refreshing users:', error);
                        }
                      };
                      loadUsers();
                    }}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg border border-blue-200 hover:border-blue-300"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" />
                    Refresh
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                {isLoadingUsers ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-300 animate-spin" />
                    <p className="text-sm">Loading chats...</p>
                  </div>
                ) : sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => {
                    const unreadCount = chatMessages.filter(m => 
                      m.chatId === [currentUser?.id, user.id].sort().join('-') && 
                      !m.readBy?.includes(currentUser?.id?.toString()) &&
                      m.senderId !== currentUser?.id?.toString()
                    ).length;
                    
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedChatUser(user)}
                        className={`w-full text-left p-3 border-b hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                          selectedChatUser?.id === user.id ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Chat Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-gray-900 truncate">{user.name}</div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="text-xs text-gray-400">
                                  {user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>
                            </div>
                            
                            {/* Last Message Preview */}
                            {user.lastMessage && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 truncate flex-1">
                                  {user.lastMessage}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 text-green-500">✓</div>
                                  {unreadCount > 0 && (
                                    <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                                      {unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : users.length > 0 ? (
                  // Fallback: show users from users array if sortedUsers is empty
                  <>
                    <div className="p-2 text-xs text-gray-400 bg-green-50 border-b">
                      Fallback: Showing users from users array
                    </div>
                    {users.filter((userItem: any) => 
                      userItem.id.toString() !== currentUser?.id?.toString()
                    ).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedChatUser(user)}
                        className="w-full text-left p-3 border-b hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{user.name}</div>
                            <div className="text-sm text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No chats available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area Panel */}
            <div className={`${
              !selectedChatUser 
                ? 'hidden md:block md:absolute md:left-80 md:top-0 md:right-0 md:bottom-0' 
                : 'block absolute inset-0 md:relative md:ml-80 md:flex-1'
            } flex flex-col bg-gray-50 z-20 transition-all duration-300 ease-in-out h-full`}>
              {selectedChatUser ? (
                <>
                  {/* Chat Header - Fixed at top */}
                  <div className="flex-shrink-0 p-3 border-b bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Mobile Back Button - Only show on mobile when chat is open */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedChatUser(null)}
                          className="md:hidden"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {selectedChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedChatUser.name}</h3>
                          <p className="text-sm text-gray-500">{selectedChatUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={loadChatMessages}
                          disabled={isLoadingMessages}
                          className="text-gray-400 hover:text-gray-600"
                          title="Refresh Messages"
                        >
                          {isLoadingMessages ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area - Scrollable, takes remaining space */}
                  <div className="flex-1 overflow-y-auto p-4 -webkit-overflow-scrolling-touch min-h-0">
                    {isLoadingMessages ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500">Loading messages...</div>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500">No messages yet. Start the conversation!</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.filter(message => message && message.id && message.content).map((message) => {
                          const isOwnMessage = currentUser?.id.toString() === message.senderId;
                          const messageTime = new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          
                          // Check if message is being edited
                          const isEditing = editingMessage?.id === message.id;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                  isOwnMessage
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-gray-800 shadow-sm'
                                } ${message.deleted ? 'opacity-60' : ''}`}
                                onContextMenu={(e) => handleMessageRightClick(e, message)}
                              >
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingMessage.content}
                                      onChange={(e) => setEditingMessage(prev => 
                                        prev ? { ...prev, content: e.target.value } : null
                                      )}
                                      className={`w-full p-2 rounded border resize-none ${
                                        isOwnMessage 
                                          ? 'bg-green-400 text-white placeholder-green-200' 
                                          : 'bg-gray-50 text-gray-800'
                                      }`}
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        className={`px-3 py-1 rounded text-sm font-medium ${
                                          isOwnMessage 
                                            ? 'bg-green-600 text-white hover:bg-green-700' 
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className={`px-3 py-1 rounded text-sm font-medium ${
                                          isOwnMessage 
                                            ? 'bg-gray-400 text-white hover:bg-gray-500' 
                                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                        }`}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="whitespace-pre-wrap break-words">
                                      {message.deleted ? (
                                        <span className="italic text-gray-500">This message was deleted</span>
                                      ) : (
                                        message.content
                                      )}
                                    </div>
                                    <div className={`flex items-center justify-between mt-2 text-xs ${
                                      isOwnMessage ? 'text-green-100' : 'text-gray-500'
                                    }`}>
                                      <span>{messageTime}</span>
                                      {isOwnMessage && !message.deleted && (
                                        <span className="ml-2">
                                          {message.edited && '✏️ '}
                                          {message.status === 'sending' && '⏳'}
                                          {message.status === 'sent' && '✓'}
                                          {message.status === 'delivered' && '✓✓'}
                                          {message.status === 'read' && '✓✓'}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Scroll anchor for auto-scrolling to bottom */}
                        <div ref={chatEndRef} className="h-1" />
                      </div>
                    )}
                  </div>

                  {/* Input Area - Fixed at absolute bottom */}
                  <div className="flex-shrink-0 p-4 border-t bg-white mt-auto">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          placeholder="Your message"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <Mic className="w-5 h-5" />
                      </Button>
                      <Button 
                        onClick={sendChatMessage} 
                        disabled={!chatInput.trim()}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
                            ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat to start messaging</h3>
                    <p className="text-sm text-gray-500">Choose a user from the left panel to begin your conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu?.visible && (
          <div
            className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {/* Edit Option - Only show if message is less than 1 minute old */}
            {isMessageEditable(contextMenu.message) && (
              <button
                onClick={() => handleEditMessage(contextMenu.message)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            
            {/* Delete Option - Always visible */}
            <button
              onClick={() => handleDeleteMessage(contextMenu.message)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            
            {/* Forward Option - Always visible */}
            <button
              onClick={() => handleForwardMessage(contextMenu.message)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
            >
              <Forward className="w-4 h-4" />
              <span>Forward</span>
            </button>
          </div>
        )}
      </>
    );
  };



  const renderAiChat = () => {
    return (
      <>
        {/* Full-Screen AI Chat Mode */}
        <div className={`fixed inset-0 bg-white z-50`}>
          {/* Chat Header */}
          <div className={`h-16 bg-white border-b flex items-center justify-between px-6`}>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView("overview")} className={`hover:bg-gray-100`}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-600" />
                <h1 className={`text-xl font-bold text-gray-900`}>AI Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className={`hover:bg-gray-100`}>
                <Search className="w-5 h-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" className={`hover:bg-gray-100`}>
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Full Width Chat Layout */}
          <div className="flex h-[calc(100vh-64px)]">
            {/* AI Selection Dropdown */}
            <div className={`w-80 bg-gray-50 border-gray-200 border-r flex flex-col`}>
              {/* AI Selection Header */}
              <div className={`p-4 border-b bg-white border-gray-200`}>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-sm text-gray-500">Select your preferred AI</p>
              </div>

              {/* AI Selection Dropdown */}
              <div className="p-4">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Gemini AI - Always Visible */}
                  <div 
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedAI === 'gemini' 
                        ? 'bg-gradient-to-r from-purple-50 to-purple-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAI('gemini')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Gemini AI Assistant</h3>
                        <p className="text-sm text-gray-500">Powered by Google Gemini</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'gemini' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ChatGPT - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'chatgpt' 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAI('chatgpt')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">ChatGPT</h3>
                        <p className="text-sm text-gray-500">Powered by OpenAI</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'chatgpt' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cohere AI - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'cohere' 
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAI('cohere')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Cohere AI</h3>
                        <p className="text-sm text-gray-500">Powered by Cohere</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'cohere' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DeepAI - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'deepai' 
                        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAI('deepai')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">DeepAI</h3>
                        <p className="text-sm text-gray-500">Powered by DeepAI</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'deepai' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Chat Window */}
            <div className={`flex-1 bg-white flex flex-col`}>
              {/* Chat Header */}
              <div className={`p-4 border-b bg-white border-gray-200 flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`${
                      selectedAI === 'gemini' 
                        ? 'bg-purple-100 text-purple-600' 
                        : selectedAI === 'chatgpt' 
                        ? 'bg-blue-100 text-blue-600'
                        : selectedAI === 'cohere'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-indigo-100 text-indigo-600'
                    } font-semibold`}>
                      {selectedAI === 'gemini' ? 'AI' : selectedAI === 'chatgpt' ? 'GPT' : selectedAI === 'cohere' ? 'Cohere' : 'DeepAI'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className={`font-semibold text-gray-900`}>
                      {selectedAI === 'gemini' ? 'Gemini AI Assistant' : selectedAI === 'chatgpt' ? 'ChatGPT Assistant' : selectedAI === 'cohere' ? 'Cohere AI Assistant' : 'DeepAI Assistant'}
                    </h2>
                    <p className={`text-sm text-gray-500`}>Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className={`hover:bg-gray-100`}>
                    <Search className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`hover:bg-gray-100`}>
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {/* Messages Area - Full Width */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50`}>
                <AIChatDashboard />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderActivities = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Activity Scoring & Leaderboard</h1>
        <p className="text-muted-foreground">Track team performance and engagement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {userScores.find((u) => u.id === "user1")?.score || 0}
            </div>
            <Badge className={`text-sm ${getLevelColor(userScores.find((u) => u.id === "user1")?.level || "Beginner")}`}>
              {getLevelIcon(userScores.find((u) => u.id === "user1")?.level || "Beginner")}
              {userScores.find((u) => u.id === "user1")?.level || "Beginner"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">Rank #{userScores.find((u) => u.id === "user1")?.rank || 0} of {userScores.length}</p>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Messages Sent</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deals Closed</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Login</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userScores.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? "bg-yellow-50 border border-yellow-200"
                      : index === 1
                      ? "bg-gray-50 border border-gray-200"
                      : index === 2
                      ? "bg-orange-50 border border-orange-200"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-500 text-white"
                          : index === 2
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getLevelColor(user.level)}>
                      {getLevelIcon(user.level)}
                      {user.level}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg">{user.score}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );



  const renderSettings = () => {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">S</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Suham</h3>
                  <p className="text-sm text-muted-foreground">Sales Manager</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input defaultValue="Suham" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue="suham@company.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Input defaultValue="Sales Manager" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Bell className="w-5 h-5 mr-2 text-green-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chat Alerts</p>
                    <p className="text-sm text-muted-foreground">New message notifications</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  API Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Light mode</p>
                  </div>
                  <Select value="light" onValueChange={() => {}}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center space-x-2">
                          <span>🌞</span>
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center space-x-2">
                          <span>🌙</span>
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center space-x-2">
                          <span>🌓</span>
                          <span>System</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground">English (US)</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Time Zone</p>
                    <p className="text-sm text-muted-foreground">UTC-5 (Eastern Time)</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };



  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return renderOverview();
      case "leads":
        return renderLeads();
      case "deals":
        return renderDeals();
      case "tasks":
        return renderTasks();
      case "chat":
        return renderChat();
      case "ai-chat":
        return renderAiChat();
      case "activities":
        return renderActivities();
      case "settings":
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <CRMSidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1">
        <TopBar />
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Index;

