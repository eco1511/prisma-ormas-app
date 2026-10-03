import { isValidObjectId } from "mongoose";
import { Member } from "@/models/Member";
import { Mutation } from "@/models/Mutation";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { NotificationState } from "@/models/NotificationState";
import { notificationActions, notificationItem } from "@/lib/notifications";
export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "superadmin"].includes(session.role)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    await connectMongoDB();
    const snapshot = new Date();
    const state = await NotificationState.findOne({ userId: session.userId });
    const readThrough = state?.readThrough || new Date(0);
    const filter = { action: { $in: notificationActions }, createdAt: { $gt: readThrough, $lte: snapshot }, _id: { $nin: state?.readIds || [] } };
    const [events, unread] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50).lean(),
      AuditLog.countDocuments(filter),
    ]);
    // Older audit entries lack member details; resolve them in batches.
    const legacyEvents = events.filter(event => !event.details?.position || !("branchType" in (event.details || {})));
    const mutationIds = legacyEvents.filter(event => event.action === "MUTATION_REQUEST" && isValidObjectId(event.entityId)).map(event => event.entityId);
    const mutations = mutationIds.length ? await Mutation.find({ _id: { $in: mutationIds } }).select("memberId").lean() : [];
    const mutationMembers = new Map(mutations.map(mutation => [String(mutation._id), String(mutation.memberId)]));
    const memberIds = [...new Set(legacyEvents.map(event => event.action === "MUTATION_REQUEST" ? mutationMembers.get(event.entityId) : event.entityId).filter(id => isValidObjectId(id)))];
    const members = memberIds.length ? await Member.find({ _id: { $in: memberIds } }).select("name position membershipType branchType province city").lean() : [];
    const memberDetails = new Map(members.map(member => [String(member._id), member]));
    const items = events.map(event => {
      const memberId = event.action === "MUTATION_REQUEST" ? mutationMembers.get(event.entityId) : event.entityId;
      return notificationItem(event as any, readThrough, memberId ? memberDetails.get(memberId) as any : undefined);
    });
    return NextResponse.json({ items, unread, snapshot: snapshot.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Gagal memuat notifikasi." }, { status: 500 }); }
}
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !["admin", "superadmin"].includes(session.role)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let snapshot: Date | undefined;
  let id: string | undefined;
  try { const body = await req.json(); if (body.id !== undefined) { if (typeof body.id !== "string" || !/^[a-f0-9]{24}$/i.test(body.id)) throw Error(); id = body.id; } else { snapshot = new Date(body.snapshot); if (typeof body.snapshot !== "string" || !Number.isFinite(snapshot.getTime()) || snapshot > new Date()) throw Error(); } }
  catch { return NextResponse.json({ message: "Waktu notifikasi tidak valid." }, { status: 400 }); }
  try {
    await connectMongoDB();
    if (id) {
      if (!await AuditLog.exists({ _id: id, action: { $in: notificationActions } })) return NextResponse.json({ message: "Notifikasi tidak ditemukan." }, { status: 404 });
      await NotificationState.updateOne({ userId: session.userId }, { $addToSet: { readIds: id } }, { upsert: true });
    } else {
      await NotificationState.updateOne({ userId: session.userId }, { $max: { readThrough: snapshot } }, { upsert: true });
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ message: "Gagal menandai notifikasi." }, { status: 500 }); }
}
