// Mock data for static demo version
export const mockUser = {
  id: 1,
  username: "demo_user",
  email: "demo@wizspeak.com",
  role: "user" as const,
  isOnline: true,
  avatar: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date()
};

export const mockMessages = [
  {
    id: 1,
    conversationId: 1,
    senderId: 1,
    content: "Welcome to WizSpeek® - Your secure messaging platform with ISO 9001/27001 compliance features.",
    messageType: "text" as const,
    classification: "general" as const,
    priority: "normal" as const,
    requiresAcknowledgment: false,
    encryptedContent: null,
    integritySig: "demo_signature",
    createdAt: new Date("2024-07-13T10:00:00Z"),
    updatedAt: new Date("2024-07-13T10:00:00Z"),
    sender: {
      id: 2,
      username: "WizSpeek_System",
      email: "system@wizspeak.com",
      role: "admin" as const,
      isOnline: true,
      avatar: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date()
    }
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1,
    content: "This is a demo version showcasing our enterprise-grade messaging interface with comprehensive compliance features.",
    messageType: "text" as const,
    classification: "policy_notification" as const,
    priority: "high" as const,
    requiresAcknowledgment: true,
    encryptedContent: null,
    integritySig: "demo_signature_2",
    createdAt: new Date("2024-07-13T10:05:00Z"),
    updatedAt: new Date("2024-07-13T10:05:00Z"),
    sender: mockUser
  },
  {
    id: 3,
    conversationId: 1,
    senderId: 2,
    content: "Key features include:\n• Real-time messaging with WebSocket\n• End-to-end encryption\n• Comprehensive audit trails\n• ISO 9001/27001 compliance\n• Role-based access control",
    messageType: "text" as const,
    classification: "general" as const,
    priority: "normal" as const,
    requiresAcknowledgment: false,
    encryptedContent: null,
    integritySig: "demo_signature_3",
    createdAt: new Date("2024-07-13T10:10:00Z"),
    updatedAt: new Date("2024-07-13T10:10:00Z"),
    sender: {
      id: 2,
      username: "WizSpeek_System",
      email: "system@wizspeak.com",
      role: "admin" as const,
      isOnline: true,
      avatar: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date()
    }
  }
];

export const mockConversations = [
  {
    id: 1,
    name: "WizSpeek® Demo Chat",
    type: "group" as const,
    description: "Interactive demo of WizSpeek® messaging platform",
    isEncrypted: true,
    retentionPolicyId: 1,
    createdAt: new Date("2024-07-13T09:00:00Z"),
    updatedAt: new Date("2024-07-13T10:10:00Z"),
    participants: [
      {
        id: 1,
        conversationId: 1,
        userId: 1,
        role: "member" as const,
        joinedAt: new Date("2024-07-13T09:00:00Z"),
        user: mockUser
      },
      {
        id: 2,
        conversationId: 1,
        userId: 2,
        role: "admin" as const,
        joinedAt: new Date("2024-07-13T09:00:00Z"),
        user: {
          id: 2,
          username: "WizSpeek_System",
          email: "system@wizspeak.com",
          role: "admin" as const,
          isOnline: true,
          avatar: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date()
        }
      }
    ],
    lastMessage: mockMessages[2]
  }
];

export const mockRetentionPolicies = [
  {
    id: 1,
    name: "Standard Business Policy",
    description: "Standard 7-year retention for business communications",
    retentionPeriodDays: 2555,
    isActive: true,
    createdById: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date()
  }
];

export const mockComplianceReports = [
  {
    id: 1,
    type: "audit_trail" as const,
    title: "Monthly Compliance Audit - July 2024",
    description: "Comprehensive audit trail report for ISO compliance",
    generatedById: 2,
    reportData: {
      summary: {
        totalMessages: 1247,
        auditEvents: 89,
        policyViolations: 0,
        complianceScore: 98.5
      }
    },
    createdAt: new Date("2024-07-01"),
    generator: {
      id: 2,
      username: "WizSpeek_System",
      email: "system@wizspeak.com",
      role: "admin" as const,
      isOnline: true,
      avatar: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date()
    }
  }
];

export const mockAuditTrail = [
  {
    id: 1,
    userId: 1,
    eventType: "user_login" as const,
    resourceType: "authentication",
    resourceId: 1,
    eventData: { method: "password", ipAddress: "192.168.1.100" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date("2024-07-13T09:00:00Z"),
    user: mockUser
  },
  {
    id: 2,
    userId: 1,
    eventType: "message_sent" as const,
    resourceType: "message",
    resourceId: 2,
    eventData: { conversationId: 1, classification: "policy_notification" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date("2024-07-13T10:05:00Z"),
    user: mockUser
  }
];

// Demo state for static version
export const demoState = {
  isAuthenticated: true,
  currentUser: mockUser,
  currentConversation: mockConversations[0],
  messages: mockMessages,
  conversations: mockConversations,
  isTyping: false,
  onlineUsers: [mockUser],
  unreadCount: 0
};