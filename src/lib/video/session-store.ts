import { db } from "@/lib/db";

// Forward reference to the VideoViewSession Prisma model. The model is declared in
// prisma/schema.prisma, but the generated client can only be regenerated during
// deploy (CI runs `prisma generate`): locally the running Next dev server locks the
// Windows query engine, so the stale client is missing this delegate and `tsc`
// would fail. This narrow typed accessor keeps every call site type-safe and lets
// the build pass; at runtime the real, regenerated delegate backs `db`, so this is
// a pure compile-time passthrough with no behavioural change. Remove once the local
// client is regenerated with VideoViewSession and `db.videoViewSession` resolves.
type DeviceWhere = {
  userId?: string;
  deviceId?: string | { not: string };
  lastSeenAt?: { gte?: Date; lt?: Date };
};

type DeviceUnique = { userId_deviceId: { userId: string; deviceId: string } };

type VideoViewSessionRow = {
  id: string;
  userId: string;
  deviceId: string;
  masterClassId: string;
  lastSeenAt: Date;
  createdAt: Date;
};

type VideoViewSessionDelegate = {
  count(args: { where: DeviceWhere }): Promise<number>;
  deleteMany(args: { where: DeviceWhere }): Promise<{ count: number }>;
  findUnique(args: {
    where: DeviceUnique;
    select?: Partial<Record<keyof VideoViewSessionRow, boolean>>;
  }): Promise<Partial<VideoViewSessionRow> | null>;
  upsert(args: {
    where: DeviceUnique;
    create: { userId: string; deviceId: string; masterClassId: string };
    update: { masterClassId: string; lastSeenAt: Date };
  }): Promise<VideoViewSessionRow>;
  update(args: { where: DeviceUnique; data: { lastSeenAt: Date } }): Promise<VideoViewSessionRow>;
  delete(args: { where: DeviceUnique }): Promise<VideoViewSessionRow>;
};

export const videoViewSession = (db as unknown as { videoViewSession: VideoViewSessionDelegate })
  .videoViewSession;
