import { notFound } from "next/navigation";
import { requireTeacher } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toInputDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { LessonForm } from "@/components/lessons/lesson-form";

export const metadata = { title: "Dersi düzenle" };

export default async function EditLessonPage({ params }: PageProps<"/lessons/[id]/edit">) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const [lesson, students] = await Promise.all([
    prisma.lesson.findFirst({ where: { id, teacherId: teacher.id }, include: { students: true } }),
    prisma.user.findMany({ where: { role: "STUDENT", active: true, teacherId: teacher.id }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lesson) notFound();

  return (
    <>
      <PageHeader eyebrow="Düzenle" title={lesson.title} />
      <LessonForm
        students={students}
        initial={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          type: lesson.type,
          startsAt: toInputDateTime(lesson.startsAt),
          durationMin: lesson.durationMin,
          studentIds: lesson.students.map((s) => s.studentId),
        }}
      />
    </>
  );
}
