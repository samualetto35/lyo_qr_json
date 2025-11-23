-- Drop existing foreign key constraint
ALTER TABLE "medical_reports" DROP CONSTRAINT IF EXISTS "medical_reports_student_id_fk_fkey";

-- Note: If there are existing medical reports linked to health_system_students,
-- you may need to migrate the data first by matching student_id values
-- between health_system_students and students tables.

-- Add new foreign key constraint to students table
ALTER TABLE "medical_reports" 
  ADD CONSTRAINT "medical_reports_student_id_fk_fkey" 
  FOREIGN KEY ("student_id_fk") 
  REFERENCES "students"("id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

