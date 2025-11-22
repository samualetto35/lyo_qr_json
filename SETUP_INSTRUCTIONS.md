# QR Attendance Platform - Setup & Run Instructions

## 🎉 Project Complete!

The QR Attendance Platform has been fully implemented according to the JSON specification. All three phases are complete:

- ✅ **Phase 1**: Database Schema (Prisma)
- ✅ **Phase 2**: Backend API (NestJS) with Auth, Anti-Fraud, CSV Import
- ✅ **Phase 3**: Frontend UI (Next.js) with Admin, Teacher, and Public QR pages

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and **npm** or **yarn**
- **PostgreSQL** 14+
- **Git**

---

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb qr_attendance

# Or using psql
psql -U postgres
CREATE DATABASE qr_attendance;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (your PostgreSQL connection string)
# - JWT_ACCESS_SECRET (generate a strong secret)
# - JWT_REFRESH_SECRET (generate another strong secret)
nano .env

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run prisma:seed

# Start the backend server
npm run start:dev
```

**Backend will run on:** `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local (defaults should work for local development)
nano .env.local

# Start the frontend server
npm run dev
```

**Frontend will run on:** `http://localhost:3000`

---

## 🔐 Default Login Credentials

After seeding the database, use these credentials:

### Admin Account
- **Email:** `admin@qrattendance.com`
- **Password:** `admin123`
- **URL:** `http://localhost:3000/login/admin`

### Teacher Account
- **Email:** `teacher@qrattendance.com`
- **Password:** `teacher123`
- **URL:** `http://localhost:3000/login/teacher`

---

## 📊 Database Schema

The platform includes the following tables:

- **admins** - Admin user accounts
- **teachers** - Teacher user accounts
- **courses** - Courses taught by teachers
- **students** - Global student roster
- **course_enrollments** - Student enrollment in courses
- **attendance_sessions** - QR attendance sessions
- **attendance_records** - Individual attendance submissions
- **student_import_batches** & **student_import_rows** - CSV import workflow
- **fraud_signals** - Suspicious activity logs
- **system_settings** - Global configuration
- **audit_logs** - Change tracking

---

## 🛠️ Key Features Implemented

### Admin Portal (`/admin/*`)
- ✅ Manage teachers (create, update, deactivate)
- ✅ Manage courses (create, assign teachers)
- ✅ CSV/Excel student import with 3 merge modes:
  - `add_only` - Only create new students
  - `add_or_update` - Create or update existing
  - `sync_with_deactivation` - Full sync (remove missing)
- ✅ View attendance across all courses
- ✅ Fraud signals dashboard
- ✅ System settings (session duration, device limits, geofencing)
- ✅ Manually adjust attendance records

### Teacher Portal (`/teacher/*`)
- ✅ View own courses
- ✅ Create new courses
- ✅ Start QR attendance sessions with configurable duration
- ✅ Display QR code for students
- ✅ View real-time attendance submissions
- ✅ Manually adjust attendance
- ✅ Export attendance data (CSV)

### Public QR Attendance Page (`/attendance/qr`)
- ✅ Session validation
- ✅ Student ID input
- ✅ Device fingerprinting (prevents buddy punching)
- ✅ Geolocation support (optional campus geofencing)
- ✅ Clear success/error messages
- ✅ Offline detection with retry logic
- ✅ Idempotent submissions (safe to retry)

### Anti-Fraud System
- ✅ **Device Limits**: Max 1 Student ID per device per session (configurable)
- ✅ **IP Rate Limiting**: Max 200 submissions per IP per session
- ✅ **Geofencing**: Optional GPS radius check
- ✅ **Session Auto-Close**: Hard expiration enforced via cron job
- ✅ **Fraud Signals Logging**: All suspicious activity tracked
- ✅ **Audit Logs**: All critical changes logged

---

## 🔥 Testing the Platform

### Test Flow 1: Admin Creates Teacher & Course

1. Login as **Admin** (`admin@qrattendance.com` / `admin123`)
2. Go to **Teachers** → **Add Teacher**
3. Create a teacher account
4. Go to **Courses** → **Add Course**
5. Assign the course to the new teacher
6. Go to **Student Imports** → **Upload CSV**
7. Import a CSV file with student data
8. Preview and commit the import

### Test Flow 2: Teacher Starts Attendance Session

1. Login as **Teacher** (`teacher@qrattendance.com` / `teacher123`)
2. Go to **My Courses**
3. Select a course
4. Click **Start Attendance Session**
5. Set session name and duration (optional)
6. Display the generated QR code

### Test Flow 3: Student Submits Attendance

1. Scan the QR code (or manually visit the QR URL)
2. Enter Student ID (e.g., `S2024001`)
3. Click **Submit Attendance**
4. System will:
   - Validate session is still open
   - Check device fingerprint
   - Request geolocation (if enabled)
   - Verify student is enrolled
   - Record attendance or reject if fraud detected

### Test Flow 4: View Fraud Signals

1. Try to submit attendance twice from the same device with different Student IDs
2. Login as **Admin**
3. Go to **Fraud Signals**
4. See the logged `multiple_ids_same_device` signal

---

## 🧪 Development Commands

### Backend

```bash
# Development mode (watch)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test

# Prisma Studio (database GUI)
npm run prisma:studio

# Create new migration
npm run prisma:migrate
```

### Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📁 Project Structure

```
lyo_qr_json/
├── backend/                  # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data seeder
│   ├── src/
│   │   ├── admin/           # Admin module
│   │   ├── teacher/         # Teacher module
│   │   ├── attendance/      # Attendance & anti-fraud
│   │   ├── auth/            # JWT authentication
│   │   └── main.ts
│   └── package.json
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Admin portal pages
│   │   │   ├── teacher/     # Teacher portal pages
│   │   │   ├── attendance/  # Public QR page
│   │   │   └── login/       # Login pages
│   │   ├── components/      # Reusable UI components
│   │   └── lib/             # Utilities (API, auth, etc.)
│   └── package.json
└── README.md
```

---

## 🔒 Security Notes

1. **Change Default Secrets**: Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`
2. **Change Default Passwords**: Update the admin and teacher passwords after first login
3. **HTTPS in Production**: Always use HTTPS in production environments
4. **Environment Variables**: Never commit `.env` files to version control
5. **Database Security**: Use strong PostgreSQL passwords and restrict access

---

## 🌍 Deployment

### Backend (NestJS)

Deploy to platforms like:
- **Heroku** (with PostgreSQL addon)
- **Railway**
- **DigitalOcean App Platform**
- **AWS EC2** + **RDS**

### Frontend (Next.js)

Deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**

### Database

- **Heroku Postgres**
- **Railway Postgres**
- **AWS RDS**
- **DigitalOcean Managed Postgres**

---

## 📖 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Public Endpoints
- `GET /attendance/session/validate-public` - Validate QR session
- `POST /attendance/submit` - Submit attendance

### Auth Endpoints
- `POST /auth/admin/login` - Admin login
- `POST /auth/teacher/login` - Teacher login
- `POST /auth/refresh` - Refresh access token

### Admin Endpoints (require JWT with `admin` role)
- `GET /admin/teachers` - List all teachers
- `POST /admin/teachers` - Create teacher
- `GET /admin/courses` - List all courses
- `POST /admin/import/students/upload` - Upload CSV
- `GET /admin/fraud-signals` - View fraud signals
- `PATCH /admin/system-settings` - Update settings

### Teacher Endpoints (require JWT with `teacher` role)
- `GET /teacher/courses` - List own courses
- `POST /teacher/courses/:id/attendance-sessions` - Start session
- `GET /teacher/attendance-sessions/:id` - View session details
- `POST /teacher/attendance-sessions/:id/close` - Close session

Refer to `main.json` for complete API specification.

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql -U postgres -c "\l"`
- Verify DATABASE_URL in `.env`
- Run `npm run prisma:generate` again

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in `backend/src/main.ts`

### Database migration errors
- Drop and recreate database: `dropdb qr_attendance && createdb qr_attendance`
- Re-run migrations: `npm run prisma:migrate`
- Re-seed: `npm run prisma:seed`

### "Session expired" error on QR page
- This is expected behavior - sessions auto-close after `hard_expires_at`
- Adjust `max_session_duration_minutes` in System Settings

---

## 📞 Support

For issues or questions:
1. Check the JSON specification file (`main.json`)
2. Review the code comments
3. Check the audit logs and fraud signals for debugging

---

## 🎓 Sample CSV Format for Student Import

```csv
student_id,first_name,last_name,gender,program
S2024001,Ali,Yıldız,M,Computer Science
S2024002,Ayşe,Demir,F,Computer Science
S2024003,Mehmet,Kaya,M,Engineering
```

---

## ✅ Implementation Checklist

- [x] Prisma schema with all 13 tables
- [x] JWT authentication (Admin & Teacher)
- [x] Admin CRUD for teachers and courses
- [x] CSV import with 3 merge modes
- [x] Teacher course management
- [x] QR attendance session creation
- [x] Public QR attendance page
- [x] Device fingerprinting
- [x] Geolocation support
- [x] IP rate limiting
- [x] Per-device buddy-punch prevention
- [x] Session auto-close cron job
- [x] Fraud signals logging
- [x] Audit logs
- [x] System settings management
- [x] Manual attendance adjustment
- [x] Offline retry handling

---

## 🚀 You're Ready!

The platform is fully functional and production-ready. Follow the setup instructions above to get started. Happy coding! 🎉

