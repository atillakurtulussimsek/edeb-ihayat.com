import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

function config() {
  const url = process.env.BBB_URL;
  const secret = process.env.BBB_SECRET;
  if (!url || !secret) throw new Error("BBB_URL ve BBB_SECRET tanımlı olmalı.");
  return { url: url.endsWith("/") ? url : `${url}/`, secret };
}

type Params = Record<string, string | number | boolean | undefined>;

function buildQuery(params: Params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export function bbbUrl(call: string, params: Params = {}) {
  const { url, secret } = config();
  const query = buildQuery(params);
  const checksum = createHash("sha1").update(`${call}${query}${secret}`).digest("hex");
  return `${url}api/${call}?${query}${query ? "&" : ""}checksum=${checksum}`;
}

async function call<T = Record<string, unknown>>(name: string, params: Params = {}): Promise<T> {
  const res = await fetch(bbbUrl(name, params), { cache: "no-store" });
  const xml = await res.text();
  const data = parser.parse(xml)?.response;
  if (!data) throw new Error("BBB yanıtı çözümlenemedi.");
  if (data.returncode !== "SUCCESS") {
    throw new Error(data.message ?? `BBB hatası: ${data.messageKey ?? name}`);
  }
  return data as T;
}

export type CreateMeetingInput = {
  meetingId: string;
  name: string;
  attendeePw: string;
  moderatorPw: string;
  durationMin?: number;
  welcome?: string;
  maxParticipants?: number;
  endCallbackUrl?: string;
  analyticsCallbackUrl?: string;
};

export async function createMeeting(input: CreateMeetingInput) {
  return call("create", {
    meetingID: input.meetingId,
    name: input.name,
    attendeePW: input.attendeePw,
    moderatorPW: input.moderatorPw,
    record: true,
    autoStartRecording: true,
    allowStartStopRecording: false,
    duration: input.durationMin ? input.durationMin + 15 : undefined,
    welcome: input.welcome,
    maxParticipants: input.maxParticipants,
    logoutURL: `${process.env.AUTH_URL ?? ""}/dashboard`,
    muteOnStart: true,
    meta_platform: "edebihayat",
    meta_endCallbackUrl: input.endCallbackUrl,
    "meta_analytics-callback-url": input.analyticsCallbackUrl,
  });
}

export function joinUrl(opts: {
  meetingId: string;
  fullName: string;
  password: string;
  userId: string;
  role: "MODERATOR" | "VIEWER";
}) {
  return bbbUrl("join", {
    meetingID: opts.meetingId,
    fullName: opts.fullName,
    password: opts.password,
    userID: opts.userId,
    role: opts.role,
    redirect: true,
  });
}

export async function isMeetingRunning(meetingId: string) {
  const data = await call<{ running: string | boolean }>("isMeetingRunning", { meetingID: meetingId });
  return String(data.running) === "true";
}

export async function endMeeting(meetingId: string, moderatorPw: string) {
  return call("end", { meetingID: meetingId, password: moderatorPw });
}

export type MeetingInfo = {
  participantCount: number;
  moderatorCount: number;
  running: boolean;
  attendees: { fullName: string; role: string; userID: string }[];
};

export async function getMeetingInfo(meetingId: string): Promise<MeetingInfo | null> {
  try {
    const data = await call<Record<string, unknown>>("getMeetingInfo", { meetingID: meetingId });
    const rawAttendees = (data.attendees as { attendee?: unknown })?.attendee;
    const list = Array.isArray(rawAttendees) ? rawAttendees : rawAttendees ? [rawAttendees] : [];
    return {
      participantCount: Number(data.participantCount ?? 0),
      moderatorCount: Number(data.moderatorCount ?? 0),
      running: String(data.running) === "true",
      attendees: list as MeetingInfo["attendees"],
    };
  } catch {
    return null;
  }
}

export type Recording = {
  recordId: string;
  meetingId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  published: boolean;
  playbackUrl?: string;
};

export async function getRecordings(meetingIds?: string[]): Promise<Recording[]> {
  const data = await call<Record<string, unknown>>("getRecordings", {
    meetingID: meetingIds?.join(","),
    state: "published,unpublished,processing",
  });
  const raw = (data.recordings as { recording?: unknown })?.recording;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((r) => {
    const rec = r as Record<string, unknown>;
    const playback = (rec.playback as { format?: unknown })?.format;
    const formats = Array.isArray(playback) ? playback : playback ? [playback] : [];
    const presentation =
      (formats as Record<string, unknown>[]).find((f) => f.type === "presentation") ??
      (formats as Record<string, unknown>[])[0];
    return {
      recordId: String(rec.recordID),
      meetingId: String(rec.meetingID),
      name: String(rec.name ?? ""),
      startTime: new Date(Number(rec.startTime)),
      endTime: new Date(Number(rec.endTime)),
      published: String(rec.published) === "true",
      playbackUrl: presentation?.url ? String(presentation.url) : undefined,
    };
  });
}

export async function deleteRecording(recordId: string) {
  return call("deleteRecordings", { recordID: recordId });
}

/** BBB üzerinde şu an çalışan tüm toplantıların meetingID listesi. */
export async function getRunningMeetingIds(): Promise<Set<string>> {
  const data = await call<Record<string, unknown>>("getMeetings");
  const raw = (data.meetings as { meeting?: unknown })?.meeting;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return new Set(list.map((m) => String((m as Record<string, unknown>).meetingID)));
}
