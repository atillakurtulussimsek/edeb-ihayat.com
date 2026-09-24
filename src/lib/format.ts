import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { tr } from "date-fns/locale";

export function fmtDate(d: Date) {
  return format(d, "d MMMM yyyy", { locale: tr });
}

export function fmtTime(d: Date) {
  return format(d, "HH:mm", { locale: tr });
}

export function fmtDateTime(d: Date) {
  return format(d, "d MMM yyyy, HH:mm", { locale: tr });
}

export function fmtDayLabel(d: Date) {
  if (isToday(d)) return "Bugün";
  if (isTomorrow(d)) return "Yarın";
  return format(d, "d MMMM, EEEE", { locale: tr });
}

export function fmtRelative(d: Date) {
  return formatDistanceToNow(d, { locale: tr, addSuffix: true });
}

export function toInputDateTime(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
