# Associsse - Charity Management System

A comprehensive multi-tenant accounting and management software designed specifically for charities. Built with Next.js, TypeScript, and modern web technologies.

## Features

- **Multi-tenant Architecture**: Support for multiple charity organizations with complete data isolation
- **Donation Management**: Track donations, donor information, and payment methods
- **Project Tracking**: Create and manage fundraising projects with goal tracking
- **Expense Management**: Handle organization expenses with approval workflows
- **Financial Reporting**: Generate comprehensive financial reports
- **Team Management**: Role-based access control for team members
- **File Storage**: Secure file storage with Minio integration
- **Modern UI**: Beautiful interface built with Tailwind CSS and Shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multi-tenant support
- **File Storage**: Minio for object storage
- **Validation**: Zod for schema validation
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (for local development)
- Docker and Docker Compose (for containerized development)
- PostgreSQL database (or use Docker)
- Minio server (or use Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd associsse
   ```

2. **Set up environment variables**

   ```bash
   cp env.docker .env.local
   ```

3. **Start the development environment**

   ```bash
   # Using Makefile (recommended)
   make setup

   # Or using Docker Compose directly
   docker-compose up -d
   ```

4. **Access the application**
   - Application: [http://localhost:3000](http://localhost:3000)
   - Minio Console: [http://localhost:9001](http://localhost:9001) (minioadmin/minioadmin)

### Local Development Setup

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd associsse
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Update the following variables in `.env.local`:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/associsse?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # OAuth Providers (currently disabled)
   # GOOGLE_CLIENT_ID=""
   # GOOGLE_CLIENT_SECRET=""

   # Minio Configuration
   MINIO_ENDPOINT="localhost"
   MINIO_PORT="9000"
   MINIO_ACCESS_KEY="minioadmin"
   MINIO_SECRET_KEY="minioadmin"
   MINIO_BUCKET="associsse"
   MINIO_USE_SSL="false"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   pnpm prisma generate

   # Run database migrations
   pnpm prisma migrate dev
   ```

5. **Start Minio server** (if running locally)

   ```bash
   # Using Docker
   docker run -p 9000:9000 -p 9001:9001 \
     -e "MINIO_ROOT_USER=minioadmin" \
     -e "MINIO_ROOT_PASSWORD=minioadmin" \
     minio/minio server /data --console-address ":9001"
   ```

6. **Start the development server**

   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   ├── storage.ts        # Minio configuration
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Utility functions
└── prisma/               # Database schema and migrations
    └── schema.prisma     # Prisma schema
```

## Database Schema

The application uses a multi-tenant architecture with the following key models:

- **Organization**: Represents a charity organization (tenant)
- **User**: System users with authentication
- **OrganizationMembership**: Links users to organizations with roles
- **Project**: Fundraising projects
- **Donation**: Donation records
- **Expense**: Organization expenses
- **ChartOfAccount**: Accounting chart of accounts
- **Transaction**: Financial transactions
- **Category**: Expense categories
- **Report**: Generated reports

## Authentication

The application supports email/password authentication:

- **Credentials**: Email/password authentication with bcrypt hashing
- **Multi-tenant**: Users can belong to multiple organizations
- **Secure**: Passwords are hashed with bcrypt and stored securely

## File Storage

Files are stored using Minio with tenant isolation:

- Each organization has its own folder structure
- Secure file uploads with presigned URLs
- Support for receipts, documents, and images

## Docker Deployment

### Development Environment

The project includes a complete Docker setup for easy development:

```bash
# Quick setup
make setup

# Or manually
docker-compose up -d
```

This starts:

- PostgreSQL database on port 5432
- Minio object storage on ports 9000/9001
- Next.js application on port 3000

### Production Environment

For production deployment:

```bash
# Set up production environment variables
cp env.prod .env.production

# Start production environment
make prod
```

### Docker Services

- **postgres**: PostgreSQL 15 database
- **minio**: Minio object storage with web console
- **app**: Next.js application with hot reload

### Environment Files

- `env.docker` - Development environment variables
- `env.prod` - Production environment variables template
- `env.example` - Local development variables

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm prisma studio` - Open Prisma Studio
- `pnpm prisma migrate dev` - Run database migrations
- `pnpm prisma generate` - Generate Prisma client

### Docker Commands

- `make dev` - Start development environment with Docker
- `make prod` - Start production environment
- `make build` - Build Docker images
- `make clean` - Stop and remove all containers and volumes
- `make logs` - Show application logs
- `make shell` - Open shell in app container
- `make db-migrate` - Run database migrations
- `make db-reset` - Reset database (WARNING: destroys data)
- `make db-studio` - Open Prisma Studio

### Code Style

- TypeScript with strict mode
- ESLint configuration
- 80 character line limit
- Prefer functional components with hooks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
