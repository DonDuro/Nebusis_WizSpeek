# WizSpeek® - Secure AI-Powered Messaging Platform

## Overview

WizSpeek® is a secure, intelligent messaging platform built under the Nebusis® brand. This is a full-stack application that provides real-time messaging capabilities with end-to-end encryption, featuring a modern React frontend, Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Authentication**: JWT-based authentication with local storage
- **Real-time Communication**: WebSocket client for live messaging
- **Theme Support**: Light/dark mode toggle with CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Real-time**: WebSocket server for instant messaging
- **File Handling**: Multer for file uploads with 10MB limit
- **API Design**: RESTful endpoints with WebSocket enhancement

### Database Schema
- **Users**: Authentication, profiles, online status
- **Conversations**: Direct and group chat support
- **Messages**: Text, voice, file, and image message types
- **Files**: Attachment metadata and encryption keys
- **Participants**: Many-to-many relationship for conversation membership

## Key Components

### Authentication System
- User registration and login with JWT tokens
- Password hashing using bcrypt
- Token-based API authentication middleware
- Client-side authentication state management

### Real-time Messaging
- WebSocket connections for instant message delivery
- Typing indicators and user presence
- Message read receipts and delivery status
- Connection management with automatic reconnection

### File Management
- File upload support with size limits
- Metadata storage for attachments
- Encrypted file storage (placeholder implementation)
- Image, video, and document support

### Security Features
- End-to-end encryption (simplified implementation for demo)
- JWT token authentication
- Input validation and sanitization
- CORS protection and security headers

## Data Flow

1. **User Authentication**: Login/register → JWT token → stored in localStorage
2. **Message Flow**: User types → WebSocket sends → Server broadcasts → Recipients receive
3. **File Uploads**: Select file → Upload to server → Store metadata → Share with recipients
4. **Real-time Updates**: WebSocket connection maintains live state synchronization

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for database operations
- **Authentication**: jsonwebtoken, bcrypt for security
- **WebSocket**: ws for real-time communication
- **File Handling**: multer for file uploads
- **UI Components**: @radix-ui components with shadcn/ui

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Production server bundling
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

### Development Mode
- Frontend: Vite dev server with HMR
- Backend: tsx for TypeScript execution
- Database: Neon serverless PostgreSQL
- WebSocket: Integrated with Express server

### Production Build
- Frontend: Vite build to static assets
- Backend: ESBuild bundle for Node.js
- Database: Drizzle migrations for schema management
- Deployment: Single server hosting both frontend and backend

### Environment Configuration
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Token signing secret
- NODE_ENV: Environment mode (development/production)

## Legal Compliance & IP Independence

WizSpeek® is developed with strict compliance to avoid any infringement of Meta/WhatsApp intellectual property:

### Design Independence
- **Original UI/UX**: Custom chat interface design with unique layouts, colors, and interactions
- **WizSpeek® Branding**: Proprietary visual identity distinct from WhatsApp's green-white theme
- **Custom Terminology**: Original feature names (e.g., "SecurePing", "Relay Code") instead of WhatsApp terms
- **Independent Icons**: Custom-designed iconography and visual elements

### Technical Independence  
- **Clean-room Development**: All code written from scratch without reverse engineering
- **Original Architecture**: Proprietary backend design and database schema
- **Independent Encryption**: Custom security implementation without copying Signal Protocol usage
- **Nebusis® Infrastructure**: Self-hosted on company-owned systems

### Feature Differentiation
- **Enhanced 12-option menu** instead of WhatsApp's 4-option layout
- **Device linking with QR codes** using original implementation
- **Group creation** with WizSpeek®-specific workflow
- **Progressive Web App** capabilities for cross-platform deployment

## Changelog

Changelog:
- July 06, 2025: Initial setup with original architecture
- July 06, 2025: Created custom WizSpeek® SVG icon with brand colors and security elements
- July 06, 2025: Implemented Progressive Web App (PWA) functionality with WizSpeek® branding
- July 07, 2025: Enhanced three-dot menu with 12 professional messaging options (legally distinct from competitors)
- July 07, 2025: Added group creation and device linking features with original UI design
- July 07, 2025: Documented compliance measures for IP independence and legal safety
- July 07, 2025: Implemented comprehensive mobile app features with WizSpeek®-specific enhancements:
  * Advanced Avatar Creator with photo upload, selfie capture, and AI-generated avatars
  * People & Groups Manager with SecureGroup™ creation and privacy controls
  * WizSpeek® Theme Studio with 6 original themes and custom wallpapers
  * Storage & Data Management with 15GB cloud storage and auto-backup
  * Enhanced Accessibility features (high contrast, voice enhancement, screen reader support)
  * Multi-language support (12 languages) with auto-translation capabilities
  * Comprehensive Help & Support system with tutorials and compliance documentation
  * Integrated logout functionality in enhanced 13-option menu
- July 12, 2025: Implemented comprehensive ISO 9001/27001 compliance features:
  * Message classification system with 6 categories (Policy Notification, Audit Notice, Corrective Action, Security Alert, Compliance Requirement, General)
  * Role-based access control (User, Admin, Compliance Officer, Auditor)
  * Message acknowledgment tracking with timestamped logs
  * Immutable audit trail with cryptographic hash validation
  * Customizable retention policies with automated expiration notifications
  * Comprehensive access logging for all user interactions
  * Compliance dashboard with policy management and reporting
  * Enhanced message composer with priority levels and acknowledgment requirements
  * Tamper-proof message integrity verification using SHA-256 hashing
  * Secure export functionality for compliance documentation

## User Preferences

Preferred communication style: Simple, everyday language.