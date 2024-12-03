import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: Record<string, unknown>;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData: Record<string, unknown> = {};

  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    if (type !== "delete") {
      switch (table) {
        case "subject": {
          const subjectTeachers = await prisma.teacher.findMany({
            select: { id: true, name: true, surname: true },
          });
          relatedData = { teachers: subjectTeachers };
          break;
        }
        case "class": {
          const [classGrades, classTeachers] = await Promise.all([
            prisma.grade.findMany({
              select: { id: true, level: true },
            }),
            prisma.teacher.findMany({
              select: { id: true, name: true, surname: true },
            }),
          ]);
          relatedData = { grades: classGrades, teachers: classTeachers };
          break;
        }
        case "teacher": {
          const teacherSubjects = await prisma.subject.findMany({
            select: { id: true, name: true },
          });
          relatedData = { subjects: teacherSubjects };
          break;
        }
        case "student": {
          const [studentGrades, studentClasses] = await Promise.all([
            prisma.grade.findMany({
              select: { id: true, level: true },
            }),
            prisma.class.findMany({
              include: { _count: { select: { students: true } } },
            }),
          ]);
          relatedData = { grades: studentGrades, classes: studentClasses };
          break;
        }
        case "exam": {
          const examLessons = await prisma.lesson.findMany({
            where: role === "teacher" ? { teacherId: currentUserId! } : {},
            select: { id: true, name: true },
          });
          relatedData = { lessons: examLessons };
          break;
        }
        default:
          break;
      }
    }
  } catch (error) {
    console.error(`Error fetching related data for table: ${table}`, error);
    
  }

  return (
    <div>
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
