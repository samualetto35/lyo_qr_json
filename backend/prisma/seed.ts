import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default system settings
  const systemSettings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      maxSessionDurationMinutes: 240,
      minSessionDurationMinutes: 1,
      maxSubmissionsPerDevicePerSession: 1,
      maxSubmissionsPerIpPerSession: 200,
      geofenceEnabled: false,
      geofenceCenterLat: null,
      geofenceCenterLng: null,
      geofenceRadiusMeters: 300,
      geoRequired: false,
      offlineRetriesAllowed: 3,
    },
  });

  console.log('✅ System settings created:', systemSettings);

  // Create a default admin account
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@qrattendance.com' },
    update: {},
    create: {
      email: 'admin@qrattendance.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });

  console.log('✅ Default admin created:', {
    email: admin.email,
    password: 'admin123',
  });

  // Create a demo teacher account
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@qrattendance.com' },
    update: {},
    create: {
      email: 'teacher@qrattendance.com',
      passwordHash: teacherPasswordHash,
      firstName: 'Demo',
      lastName: 'Teacher',
      isActive: true,
    },
  });

  console.log('✅ Demo teacher created:', {
    email: teacher.email,
    password: 'teacher123',
  });

  // Create a demo course
  const course = await prisma.course.upsert({
    where: { id: 'demo-course-id' },
    update: {},
    create: {
      id: 'demo-course-id',
      name: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'A foundational course in computer science principles',
      teacherId: teacher.id,
      isActive: true,
    },
  });

  console.log('✅ Demo course created:', course);

  // Create some demo students
  const students = await Promise.all([
    prisma.student.upsert({
      where: { studentId: 'S2024001' },
      update: {},
      create: {
        studentId: 'S2024001',
        firstName: 'Ali',
        lastName: 'Yıldız',
        gender: 'M',
        program: 'Computer Science',
        isActive: true,
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'S2024002' },
      update: {},
      create: {
        studentId: 'S2024002',
        firstName: 'Ayşe',
        lastName: 'Demir',
        gender: 'F',
        program: 'Computer Science',
        isActive: true,
      },
    }),
    prisma.student.upsert({
      where: { studentId: 'S2024003' },
      update: {},
      create: {
        studentId: 'S2024003',
        firstName: 'Mehmet',
        lastName: 'Kaya',
        gender: 'M',
        program: 'Engineering',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${students.length} demo students created`);

  // Enroll students in the demo course
  for (const student of students) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        studentId: student.id,
      },
    });
  }

  console.log('✅ Students enrolled in demo course');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@qrattendance.com / admin123');
  console.log('Teacher: teacher@qrattendance.com / teacher123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

