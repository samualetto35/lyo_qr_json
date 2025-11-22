import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeStudentId } from '../../common/utils/normalization.util';
import { AuditService } from './audit.service';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

@Injectable()
export class AdminImportService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    adminId: string,
    courseId?: string,
    importMode?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log('📁 File upload:', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Parse CSV or Excel
    const rows = await this.parseFile(file);

    console.log('📊 Parsed rows:', {
      count: rows.length,
      firstRow: rows[0],
      keys: rows[0] ? Object.keys(rows[0]) : [],
    });

    if (rows.length === 0) {
      throw new BadRequestException('File is empty or has no valid rows');
    }

    // Create batch
    const batch = await this.prisma.studentImportBatch.create({
      data: {
        adminId,
        courseId: courseId || null,
        originalFilename: file.originalname,
        status: 'uploaded',
        importMode: importMode || null,
      },
    });

    // Create rows
    await this.prisma.studentImportRow.createMany({
      data: rows.map((row, index) => ({
        batchId: batch.id,
        rowNumber: index + 1,
        rawStudentId: row.student_id || '',
        rawFirstName: row.first_name || '',
        rawLastName: row.last_name || '',
        rawGender: row.gender || '',
        rawProgram: row.program || '',
        parsed: true,
        parsedStudentId: normalizeStudentId(row.student_id || ''),
        parsedFirstName: row.first_name?.trim() || '',
        parsedLastName: row.last_name?.trim() || '',
        parsedGender: row.gender?.trim() || '',
        parsedProgram: row.program?.trim() || '',
      })),
    });

    return {
      batch_id: batch.id,
      rows_detected: rows.length,
    };
  }

  private async parseFile(file: Express.Multer.File): Promise<any[]> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv') {
        return this.parseCSV(file.buffer.toString());
      } else if (ext === 'xlsx' || ext === 'xls') {
        return this.parseExcel(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file format. Use CSV or Excel');
      }
    } catch (error) {
      console.error('❌ File parse error:', error.message);
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  private parseCSV(content: string): any[] {
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data as any[];
  }

  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json(firstSheet, {
      raw: false, // Convert everything to strings
      defval: '', // Default value for empty cells
    });
    
    console.log('📊 Excel parse result:', {
      sheetName: workbook.SheetNames[0],
      rowCount: parsed.length,
      firstRowKeys: parsed[0] ? Object.keys(parsed[0]) : [],
      firstRow: parsed[0],
    });
    
    return parsed;
  }

  async findAllBatches(filters: { status?: string; course_id?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.course_id) where.courseId = filters.course_id;

    const batches = await this.prisma.studentImportBatch.findMany({
      where,
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: { rows: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches.map((b) => ({
      id: b.id,
      original_filename: b.originalFilename,
      status: b.status,
      import_mode: b.importMode,
      course: b.course ? { name: b.course.name, code: b.course.code } : null,
      rows_count: b._count.rows,
      created_at: b.createdAt,
    }));
  }

  async getBatchPreview(batchId: string) {
    const batch = await this.prisma.studentImportBatch.findUnique({
      where: { id: batchId },
      include: {
        rows: {
          take: 100,
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      batch: {
        id: batch.id,
        status: batch.status,
        course_id: batch.courseId,
        import_mode: batch.importMode,
        original_filename: batch.originalFilename,
      },
      rows: batch.rows.map((r) => ({
        row_number: r.rowNumber,
        raw_student_id: r.rawStudentId,
        raw_first_name: r.rawFirstName,
        raw_last_name: r.rawLastName,
        raw_gender: r.rawGender,
        raw_program: r.rawProgram,
        parsed_student_id: r.parsedStudentId,
        parsed_first_name: r.parsedFirstName,
        parsed_last_name: r.parsedLastName,
      })),
    };
  }

  async assignCourse(batchId: string, courseId: string, adminId: string) {
    const batch = await this.prisma.studentImportBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.studentImportBatch.update({
      where: { id: batchId },
      data: {
        courseId,
        status: 'ready_to_commit',
      },
    });

    return { message: 'Course assigned successfully' };
  }

  async setImportMode(batchId: string, importMode: string, adminId: string) {
    const batch = await this.prisma.studentImportBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    await this.prisma.studentImportBatch.update({
      where: { id: batchId },
      data: { importMode },
    });

    return { message: 'Import mode set successfully' };
  }

  async commitBatch(batchId: string, adminId: string) {
    const batch = await this.prisma.studentImportBatch.findUnique({
      where: { id: batchId },
      include: { rows: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!batch.courseId) {
      throw new BadRequestException('Course must be assigned before commit');
    }

    if (!batch.importMode) {
      throw new BadRequestException('Import mode must be set before commit');
    }

    if (batch.status === 'committed') {
      throw new BadRequestException('Batch already committed');
    }

    const stats = {
      created_students: 0,
      updated_students: 0,
      created_enrollments: 0,
      reactivated_enrollments: 0,
      deactivated_enrollments: 0,
      skipped_rows: 0,
      errors: [] as string[],
    };

    // Process each row
    for (const row of batch.rows) {
      if (!row.parsedStudentId || !row.parsedFirstName || !row.parsedLastName) {
        stats.skipped_rows++;
        stats.errors.push(`Row ${row.rowNumber}: Missing required fields`);
        continue;
      }

      try {
        // Find or create student
        const existingStudent = await this.prisma.student.findUnique({
          where: { studentId: row.parsedStudentId },
        });

        let student;
        if (existingStudent) {
          if (batch.importMode === 'add_or_update' || batch.importMode === 'sync_with_deactivation') {
            // Update student info
            student = await this.prisma.student.update({
              where: { id: existingStudent.id },
              data: {
                firstName: row.parsedFirstName,
                lastName: row.parsedLastName,
                gender: row.parsedGender || existingStudent.gender,
                program: row.parsedProgram || existingStudent.program,
                isActive: true,
              },
            });
            stats.updated_students++;
          } else {
            student = existingStudent;
          }
        } else {
          // Create new student
          student = await this.prisma.student.create({
            data: {
              studentId: row.parsedStudentId,
              firstName: row.parsedFirstName,
              lastName: row.parsedLastName,
              gender: row.parsedGender,
              program: row.parsedProgram,
            },
          });
          stats.created_students++;
        }

        // Create or find enrollment
        const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: batch.courseId,
              studentId: student.id,
            },
          },
        });

        if (!existingEnrollment) {
          await this.prisma.courseEnrollment.create({
            data: {
              courseId: batch.courseId,
              studentId: student.id,
            },
          });
          stats.created_enrollments++;
        }
      } catch (error) {
        stats.skipped_rows++;
        stats.errors.push(`Row ${row.rowNumber}: ${error.message}`);
      }
    }

    // Mark batch as committed
    await this.prisma.studentImportBatch.update({
      where: { id: batchId },
      data: { status: 'committed' },
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'IMPORT_STUDENTS',
      entityType: 'student_import_batch',
      entityId: batchId,
      afterData: stats,
    });

    return stats;
  }
}

