import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import {
  createNotificationServer,
  notifyUnclaimedReward,
  type CreateNotificationInput,
} from '@/services/notificationService';

/** POST — crear notificación (server) o comprobar recompensas pendientes */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'check-rewards') {
      const { userId, email, welcomeGiftClaimed, welcomeCouponCode } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId requerido' }, { status: 400 });
      }

      const created: string[] = [];

      if (!welcomeGiftClaimed && !welcomeCouponCode) {
        await notifyUnclaimedReward(userId, 'welcome_gift');
        created.push('welcome_gift');
      }

      if (email) {
        try {
          const { databases } = getServices();
          const { databaseId } = getAppwriteConfig();
          const coupons = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
            Query.equal('assignedEmail', email),
            Query.equal('isUsed', false),
            Query.limit(3),
          ]);
          if (coupons.total > 0) {
            const code = (coupons.documents[0] as { code?: string }).code;
            await notifyUnclaimedReward(
              userId,
              'coupon',
              code ? `Tu cupón ${code} está listo para usar.` : undefined
            );
            created.push('coupon');
          }
        } catch {
          /* colección puede no tener assignedEmail */
        }
      }

      return NextResponse.json({ success: true, created });
    }

    const input = body as CreateNotificationInput;
    if (!input.title?.trim() || !input.message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'title y message son requeridos' },
        { status: 400 }
      );
    }

    const doc = await createNotificationServer(input);
    return NextResponse.json({ success: true, notification: doc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
