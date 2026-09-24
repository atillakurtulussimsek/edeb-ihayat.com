import { addHours, setMinutes } from "date-fns";
import { requireTeacher } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toInputDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { LessonForm } from "@/components/lessons/lesson-form";

export const metadata = { title: "Yeni ders" };

export default async function NewLessonPage() {
  const teacher = await requireTeacher();
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", active: true, teacherId: teacher.id },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  const defaultStart = setMinutes(addHours(new Date(), 1), 0);

  return (
    <>
      <PageHeader eyebrow="Ders planla" title="Yeni ders" description="Ders türünü seçin, öğrencileri atayın. BigBlueButton odası ders başlatıldığında otomatik açılır." />
      <LessonForm
        students={students}
        initial={{ title: "", description: "", type: "INDIVIDUAL", startsAt: toInputDateTime(defaultStart), durationMin: 60, studentIds: [] }}
      />
    </>
  );
}
