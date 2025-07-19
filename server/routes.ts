import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertMessageSchema, 
  insertMessageAcknowledgmentSchema,
  insertRetentionPolicySchema,
  insertAccessLogSchema,
  insertAuditTrailSchema,
  insertComplianceReportSchema,
  MessageClassification,
  UserRole,
  AccessAction
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// WebSocket connection map
const wsConnections = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update online status
      await storage.updateUserOnlineStatus(user.id, true);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      await storage.updateUserOnlineStatus(req.user.id, false);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
    });
  });

  // Conversation routes
  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const { name, participantIds } = req.body;
      
      const conversation = await storage.createConversation({
        name,
        type: participantIds.length > 1 ? "group" : "direct",
      });

      // Add creator as participant
      await storage.addParticipant(conversation.id, req.user.id);
      
      // Add other participants
      for (const participantId of participantIds) {
        await storage.addParticipant(conversation.id, participantId);
      }

      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversationWithParticipants(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(p => p.user.id === req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await storage.getMessages(conversationId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        senderId: req.user.id,
      });

      const message = await storage.createMessage(messageData);
      
      // Broadcast to WebSocket clients
      const messageWithSender = {
        ...message,
        sender: req.user,
      };
      
      broadcastToConversation(conversationId, {
        type: "new_message",
        data: messageWithSender,
      });

      res.status(201).json(messageWithSender);
    } catch (error) {
      res.status(400).json({ message: "Invalid input", error: error.message });
    }
  });

  app.put("/api/messages/:id", authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { content } = req.body;

      await storage.updateMessage(messageId, content);
      
      res.json({ message: "Message updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/messages/:id", authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // File upload route
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = path.extname(req.file.originalname);
      const filename = `${randomUUID()}${fileExtension}`;
      const newPath = path.join("uploads", filename);

      // Move file to permanent location
      fs.renameSync(req.file.path, newPath);

      res.json({
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Serve uploaded files
  app.use("/api/files", express.static("uploads"));

  // Compliance API routes
  
  // Message acknowledgment routes
  app.post("/api/messages/:id/acknowledge", authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      
      // Log access
      await storage.logAccess({
        userId,
        action: AccessAction.ACKNOWLEDGE,
        resourceType: "message",
        resourceId: messageId,
        ipAddress,
        userAgent
      });
      
      // Create audit trail
      await storage.createAuditTrail({
        eventType: "message_acknowledged",
        userId,
        resourceType: "message",
        resourceId: messageId,
        newValues: { acknowledgedBy: userId, acknowledgedAt: new Date() },
        ipAddress,
        userAgent
      });
      
      const acknowledgment = await storage.acknowledgeMessage(messageId, userId, ipAddress, userAgent);
      res.json(acknowledgment);
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge message" });
    }
  });
  
  app.get("/api/messages/:id/acknowledgments", authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const acknowledgments = await storage.getMessageAcknowledgments(messageId);
      res.json(acknowledgments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get acknowledgments" });
    }
  });

  // Retention policy routes
  app.post("/api/compliance/retention-policies", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.COMPLIANCE_OFFICER) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const policyData = insertRetentionPolicySchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const policy = await storage.createRetentionPolicy(policyData);
      
      // Create audit trail
      await storage.createAuditTrail({
        eventType: "retention_policy_created",
        userId: req.user.id,
        resourceType: "retention_policy",
        resourceId: policy.id,
        newValues: policyData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      
      res.status(201).json(policy);
    } catch (error) {
      res.status(500).json({ message: "Failed to create retention policy" });
    }
  });
  
  app.get("/api/compliance/retention-policies", authenticateToken, async (req, res) => {
    try {
      const policies = await storage.getRetentionPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get retention policies" });
    }
  });

  // Access logs routes
  app.get("/api/compliance/access-logs", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.COMPLIANCE_OFFICER && req.user.role !== UserRole.AUDITOR) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const { resourceId, resourceType, limit } = req.query;
      
      if (!resourceId || !resourceType) {
        return res.status(400).json({ message: "resourceId and resourceType are required" });
      }
      
      const logs = await storage.getAccessLogs(
        parseInt(resourceId as string),
        resourceType as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get access logs" });
    }
  });

  // Audit trail routes
  app.get("/api/compliance/audit-trail", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.COMPLIANCE_OFFICER && req.user.role !== UserRole.AUDITOR) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const { userId, resourceType, eventType, dateFrom, dateTo, limit } = req.query;
      
      const filters = {
        userId: userId ? parseInt(userId as string) : undefined,
        resourceType: resourceType as string,
        eventType: eventType as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };
      
      const auditTrail = await storage.getAuditTrail(filters, limit ? parseInt(limit as string) : undefined);
      res.json(auditTrail);
    } catch (error) {
      res.status(500).json({ message: "Failed to get audit trail" });
    }
  });

  // Compliance reports routes
  app.post("/api/compliance/reports", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.COMPLIANCE_OFFICER) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const reportData = insertComplianceReportSchema.parse({
        ...req.body,
        generatedBy: req.user.id
      });
      
      const report = await storage.createComplianceReport(reportData);
      
      // Create audit trail
      await storage.createAuditTrail({
        eventType: "compliance_report_generated",
        userId: req.user.id,
        resourceType: "compliance_report",
        resourceId: report.id,
        newValues: reportData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create compliance report" });
    }
  });
  
  app.get("/api/compliance/reports", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.COMPLIANCE_OFFICER && req.user.role !== UserRole.AUDITOR) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const { type, limit } = req.query;
      const reports = await storage.getComplianceReports(type as string, limit ? parseInt(limit as string) : undefined);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to get compliance reports" });
    }
  });

  // Enhanced message creation with compliance features
  app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
        contentHash: crypto.createHash('sha256').update(req.body.content).digest('hex')
      });
      
      const message = await storage.createMessage(messageData);
      
      // Create audit trail
      await storage.createAuditTrail({
        eventType: "message_sent",
        userId: req.user.id,
        resourceType: "message",
        resourceId: message.id,
        newValues: messageData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      
      // Log access
      await storage.logAccess({
        userId: req.user.id,
        action: "create",
        resourceType: "message",
        resourceId: message.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
      
      // Get the message with sender info
      const messageWithSender = await storage.getMessages(message.conversationId, 1);
      const newMessage = messageWithSender.find(m => m.id === message.id);
      
      if (newMessage) {
        // Broadcast to conversation participants
        broadcastToConversation(message.conversationId, {
          type: "new_message",
          data: newMessage,
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let userId: number | null = null;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "auth") {
          try {
            const decoded = jwt.verify(data.token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
            wsConnections.set(userId, ws);
            
            // Update user online status
            await storage.updateUserOnlineStatus(userId, true);
            
            ws.send(JSON.stringify({ type: "auth_success" }));
          } catch (error) {
            ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
          }
        } else if (data.type === "typing") {
          if (userId) {
            broadcastToConversation(data.conversationId, {
              type: "typing",
              data: { userId, isTyping: data.isTyping },
            }, userId);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (userId) {
        wsConnections.delete(userId);
        await storage.updateUserOnlineStatus(userId, false);
      }
    });
  });

  function broadcastToConversation(conversationId: number, message: any, excludeUserId?: number) {
    // In a real implementation, you'd track which users are in which conversations
    // For now, broadcast to all connected users
    wsConnections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN && userId !== excludeUserId) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
