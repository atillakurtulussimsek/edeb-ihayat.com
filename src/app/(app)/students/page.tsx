import { UsersIcon } from "lucide-react";
import { requireTeacher } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { StudentDialog } from "@/components/students/student-dialog";
import { StudentRowActions } from "@/components/students/student-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata = { title: "Öğrenciler" };
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const teacher = await requireTeacher();
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", teacherId: teacher.id },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { lessons: true } } },
  });

  return (
    <>
      <PageHeader title="Öğrenciler" description="Öğrenci hesaplarını oluşturun, bilgilerini güncelleyin." actions={<StudentDialog />} />
      {students.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Henüz öğrenci yok" description="İlk öğrencinizi ekleyin; ardından ders planlayabilirsiniz." action={<StudentDialog />} />
      ) : (
        <div className="paper-card overflow-hidden rounded-2xl ring-1 ring-foreground/8">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Öğrenci</TableHead>
                <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                <TableHead className="hidden md:table-cell">Ders</TableHead>
                <TableHead className="hidden md:table-cell">Kayıt</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id} className={!s.active ? "opacity-60" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {s.name.split(" ").slice(0, 2).map((p) => p[0]?.toLocaleUpperCase("tr")).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 leading-tight">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{s.phone ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{s._count.lessons}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{fmtDate(s.createdAt)}</TableCell>
                  <TableCell>
                    {s.active ? <Badge className="bg-live/15 text-live">Aktif</Badge> : <Badge variant="secondary">Pasif</Badge>}
                  </TableCell>
                  <TableCell>
                    <StudentRowActions student={{ id: s.id, name: s.name, email: s.email, phone: s.phone, note: s.note, active: s.active }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
