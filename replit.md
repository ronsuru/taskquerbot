# Overview

This is a social media marketing platform that enables users to create and participate in marketing campaigns across multiple social platforms (Twitter, TikTok, Facebook, Telegram). The application facilitates task-based marketing where campaign creators can post tasks, users can complete them for rewards, and the system handles payments through TON blockchain integration. It features a modern React frontend with shadcn/ui components, an Express.js backend, PostgreSQL database with Drizzle ORM, and integrated file storage capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **File Uploads**: Uppy with AWS S3 integration for object storage

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Build System**: esbuild for production builds
- **Development**: tsx for TypeScript execution in development

## Database Schema
- **Users**: Stores Telegram ID, wallet address, balance, and rewards
- **Campaigns**: Marketing tasks with platform targeting, slots, and reward amounts
- **Transactions**: Financial records for deposits, withdrawals, and rewards
- **Task Submissions**: User submissions for campaign tasks with proof and status tracking
- **Withdrawals**: Withdrawal requests with status and transaction hashes

## Authentication & User Management
- Telegram-based user identification using Telegram IDs
- No traditional password authentication - relies on Telegram integration
- User balance and reward tracking through the database

## Payment System
- **Blockchain**: TON (The Open Network) integration
- **Wallet**: TON wallet integration for deposits and withdrawals
- **Escrow**: Smart contract escrow system for campaign funding
- **Transaction Verification**: TonAPI integration for blockchain transaction verification

## File Storage
- **Provider**: Google Cloud Storage integration
- **Access Control**: Custom ACL (Access Control List) system for object permissions
- **Upload Flow**: Presigned URL generation for direct client uploads
- **Security**: Object-level permissions with group-based access control

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling for serverless environments

## Blockchain Services
- **TON Network**: Cryptocurrency transactions and smart contracts
- **TonAPI**: Blockchain data and transaction verification
- **TON Center**: RPC endpoint for blockchain interactions

## Cloud Storage
- **Google Cloud Storage**: Object storage with ACL support
- **Replit Integration**: Service account authentication through Replit's sidecar system

## Development Tools
- **Replit**: Development environment with integrated tooling
- **Vite Plugins**: Runtime error overlay and development cartographer for Replit
- **Drizzle Kit**: Database migrations and schema management

## UI & Styling
- **Font Awesome**: Icon library for social media platform icons
- **Google Fonts**: Typography (Inter, Geist Mono, DM Sans, Architects Daughter, Fira Code)
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload interface with dashboard modal

## Utility Libraries
- **bcryptjs**: Password hashing (though not actively used in current auth flow)
- **Zod**: Runtime type validation and schema parsing
- **nanoid**: Unique ID generation
- **clsx & tailwind-merge**: CSS class manipulation utilities