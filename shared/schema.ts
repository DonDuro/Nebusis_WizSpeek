import { pgTable, text, serial, integer, boolean, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  avatar: text("avatar"),
  publicKey: text("public_key"),
  role: text("role").notNull().default("user"), // user, admin, compliance_officer, auditor
  department: text("department"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  name: text("name"),
  type: text("type").notNull().default("direct"), // direct, group
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  userId: integer("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, voice, file, image
  classification: text("classification"), // Policy_Notification, Audit_Notice, Corrective_Action, General, etc.
  priority: text("priority").default("normal"), // low, normal, high, urgent
  requiresAcknowledgment: boolean("requires_acknowledgment").default(false),
  metadata: json("metadata"), // for file info, voice duration, etc.
  encryptedContent: text("encrypted_content"),
  contentHash: text("content_hash"), // cryptographic hash for immutability
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  readBy: json("read_by").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  encryptedKey: text("encrypted_key"),
  fileHash: text("file_hash"), // cryptographic hash for immutability
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance tables for ISO 9001 and ISO 27001
export const messageAcknowledgments = pgTable("message_acknowledgments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  userId: integer("user_id").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const retentionPolicies = pgTable("retention_policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  messageClassification: text("message_classification"), // which classification this applies to
  retentionPeriodDays: integer("retention_period_days").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // view, download, edit, delete, export
  resourceType: text("resource_type").notNull(), // message, file, conversation
  resourceId: integer("resource_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const auditTrails = pgTable("audit_trails", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // message_sent, message_edited, file_uploaded, user_login, etc.
  userId: integer("user_id").references(() => users.id),
  resourceType: text("resource_type"),
  resourceId: integer("resource_id"),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // retention_due, access_summary, audit_trail
  reportData: json("report_data").notNull(),
  generatedBy: integer("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  parameters: json("parameters"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  participations: many(conversationParticipants),
  acknowledgments: many(messageAcknowledgments),
  accessLogs: many(accessLogs),
  auditTrails: many(auditTrails),
  retentionPolicies: many(retentionPolicies),
  complianceReports: many(complianceReports),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  participants: many(conversationParticipants),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  files: many(files),
  acknowledgments: many(messageAcknowledgments),
}));

export const filesRelations = relations(files, ({ one }) => ({
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
  }),
}));

export const messageAcknowledgmentsRelations = relations(messageAcknowledgments, ({ one }) => ({
  message: one(messages, {
    fields: [messageAcknowledgments.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageAcknowledgments.userId],
    references: [users.id],
  }),
}));

export const retentionPoliciesRelations = relations(retentionPolicies, ({ one }) => ({
  creator: one(users, {
    fields: [retentionPolicies.createdBy],
    references: [users.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
}));

export const auditTrailsRelations = relations(auditTrails, ({ one }) => ({
  user: one(users, {
    fields: [auditTrails.userId],
    references: [users.id],
  }),
}));

export const complianceReportsRelations = relations(complianceReports, ({ one }) => ({
  generator: one(users, {
    fields: [complianceReports.generatedBy],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isOnline: true,
  lastSeen: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true,
  isDeleted: true,
  readBy: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertMessageAcknowledgmentSchema = createInsertSchema(messageAcknowledgments).omit({
  id: true,
  acknowledgedAt: true,
});

export const insertRetentionPolicySchema = createInsertSchema(retentionPolicies).omit({
  id: true,
  createdAt: true,
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  timestamp: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrails).omit({
  id: true,
  timestamp: true,
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  generatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type MessageAcknowledgment = typeof messageAcknowledgments.$inferSelect;
export type InsertMessageAcknowledgment = z.infer<typeof insertMessageAcknowledgmentSchema>;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type InsertRetentionPolicy = z.infer<typeof insertRetentionPolicySchema>;
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AuditTrail = typeof auditTrails.$inferSelect;
export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;

// Enums for consistent values
export const MessageClassification = {
  POLICY_NOTIFICATION: "Policy_Notification",
  AUDIT_NOTICE: "Audit_Notice",
  CORRECTIVE_ACTION: "Corrective_Action",
  SECURITY_ALERT: "Security_Alert",
  COMPLIANCE_REQUIREMENT: "Compliance_Requirement",
  GENERAL: "General",
} as const;

export const UserRole = {
  USER: "user",
  ADMIN: "admin",
  COMPLIANCE_OFFICER: "compliance_officer",
  AUDITOR: "auditor",
} as const;

export const AccessAction = {
  VIEW: "view",
  DOWNLOAD: "download",
  EDIT: "edit",
  DELETE: "delete",
  EXPORT: "export",
  ACKNOWLEDGE: "acknowledge",
} as const;
