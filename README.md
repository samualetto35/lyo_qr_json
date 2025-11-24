# QR Attendance Platform

A production-grade web platform for managing QR-based course attendance with multiple roles: **Admin**, **Teacher**, and **Doctor**. Students interact via a public QR attendance page without accounts.

## 🚀 Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Security**: bcrypt, rate limiting, geofencing

### Frontend
- **Framework**: Next.js 14 (React, TypeScript)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query (React Query)
- **QR Code**: qrcode.react

## 📋 Features

### Admin Portal
- Manage teachers and courses
- Import student rosters via CSV/Excel with robust merge logic
- View system-wide attendance and fraud signals
- Configure system settings (session duration, device limits, geofencing)
- Manually adjust attendance records

### Teacher Portal
- Create and manage own courses
- Start QR attendance sessions with configurable duration
- View real-time attendance submissions
- Export attendance data (CSV)
- Manually adjust attendance for their courses

### Public QR Attendance
- Students scan QR code and enter Student ID
- Anti-fraud measures:
  - Device fingerprinting (prevent buddy punching)
  - IP-based rate limiting
  - Optional geofencing
  - Session auto-close (hard deadline)
- Clear offline handling with retry logic

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 20+ and npm/yarn
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and configure your DATABASE_URL and JWT secrets

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run prisma:seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Credentials

After seeding the database:

- **Admin**: `admin@qrattendance.com` / `admin123`
- **Teacher**: `teacher@qrattendance.com` / `teacher123`

## 📊 Database Schema

Key entities:
- `admins` - Admin accounts
- `teachers` - Teacher accounts
- `courses` - Courses taught by teachers
- `students` - Student roster (global, unique Student ID)
- `course_enrollments` - Many-to-many: students ↔ courses
- `attendance_sessions` - QR attendance sessions
- `attendance_records` - Individual attendance submissions
- `student_import_batches` & `student_import_rows` - CSV import workflow
- `fraud_signals` - Suspicious activity logs
- `system_settings` - Global configuration
- `audit_logs` - Change tracking

## 🔒 Security Features

1. **JWT Authentication**: Access tokens (30 min) + Refresh tokens (30 days)
2. **Role-Based Access Control**: Strict separation between admin/teacher/public
3. **Password Hashing**: bcrypt with salting
4. **Rate Limiting**: Per-IP and per-session limits
5. **Anti-Fraud**:
   - Device fingerprinting (max 1-2 IDs per device per session)
   - IP tracking and limits
   - Optional geofencing (GPS radius check)
   - Session hard expiration
6. **Audit Logging**: All critical changes tracked

## 📱 Attendance Workflow

1. **Teacher** creates an attendance session for a course
2. System generates unique QR code with token
3. **Students** scan QR → redirected to public page
4. Student enters their **Student ID**
5. System validates:
   - Session is open and not expired
   - Student is enrolled in the course
   - Device/IP limits not exceeded
   - Optional: student is within geofence
6. Attendance recorded as "present" or "flagged" for suspicious activity
7. Teacher can view real-time submissions and manually adjust if needed

## 🌍 Anti-Fraud Logic

### Buddy Punching Prevention
- Each device gets a stable fingerprint ID
- System limits: max 1 distinct Student ID per device per session (configurable)
- Attempts to submit multiple IDs from same device are rejected and logged

### Geofencing (Optional)
- Admin sets campus center coordinates and radius
- Students must be within radius to submit attendance
- Submissions outside geofence are rejected or flagged

### Session Auto-Close
- Hard deadline enforced (`hard_expires_at`)
- Background cron job closes expired sessions
- Late submissions rejected even if QR is still visible

### IP Rate Limiting
- Max 200 submissions per IP per session (configurable)
- Prevents remote abuse from shared network

## 📦 CSV Import Logic

Admin can import student rosters with three modes:

1. **add_only**: Create new students/enrollments, skip existing
2. **add_or_update**: Create new or update existing student info
3. **sync_with_deactivation**: Full sync - deactivate students not in CSV

Import workflow:
1. Upload CSV/Excel
2. Preview parsed rows
3. Assign target course and import mode
4. Commit to database
5. View stats (created, updated, conflicts)

Student ID normalization ensures consistent matching during import and attendance.

## 🧪 Testing

### Backend
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend
```bash
cd frontend
npm run lint
npm run type-check
```

## 📖 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Auth Endpoints
- `POST /auth/admin/login` - Admin login
- `POST /auth/teacher/login` - Teacher login
- `POST /auth/refresh` - Refresh access token

### Admin Endpoints
- `GET /admin/teachers` - List teachers
- `POST /admin/teachers` - Create teacher
- `GET /admin/courses` - List all courses
- `POST /admin/import/students/upload` - Upload CSV
- `POST /admin/import/students/batches/:id/commit` - Commit import
- `GET /admin/fraud-signals` - View fraud signals
- `PATCH /admin/system-settings` - Update settings

### Teacher Endpoints
- `GET /teacher/courses` - List own courses
- `POST /teacher/courses/:id/attendance-sessions` - Start session
- `GET /teacher/attendance-sessions/:id` - View session details
- `POST /teacher/attendance-sessions/:id/close` - Close session

### Public Endpoints
- `GET /attendance/session/validate-public` - Validate QR session
- `POST /attendance/submit` - Submit attendance

See JSON specification file for complete API documentation.

## 🚧 Development Phases

### Phase 1: MVP (Completed ✅)
- Database schema and migrations
- Auth system (admin + teacher)
- Admin portal: teachers, courses, basic imports
- Teacher portal: courses, start session, view QR
- Public QR page and submit endpoint
- Session auto-close logic

### Phase 2: Anti-Fraud & UX (In Progress)
- Device fingerprinting and per-device limits
- IP rate limiting
- Geofencing with browser geolocation
- Fraud signals dashboard
- Offline-friendly retry UX
- Full CSV import modes with conflict resolution
- Enhanced attendance tables with filters and export

## 📄 License

Proprietary - All Rights Reserved

## 👥 Support

For issues or questions, contact the development team.

---

Built with ❤️ using NestJS, Next.js, Prisma, and PostgreSQL

