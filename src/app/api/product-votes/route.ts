import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, PRODUCT_VOTES_COLLECTION, ID, Query } from '@/lib/appwrite';

export async function POST(request: NextRequest) {
  try {
    const { productTitle, userId, userName, userEmail } = await request.json();

    if (!productTitle) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }

    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check if user already voted for this product
    if (userId) {
      const existing = await databases.listDocuments(databaseId, PRODUCT_VOTES_COLLECTION, [
        Query.equal('PRODUCTTITLE', productTitle),
        Query.equal('USERID', userId),
      ]);
      if (existing.documents.length > 0) {
        return NextResponse.json({ error: 'Ya votaste por este producto' }, { status: 400 });
      }
    }

    const vote = await databases.createDocument(
      databaseId,
      PRODUCT_VOTES_COLLECTION,
      ID.unique(),
      {
        PRODUCTTITLE: productTitle,
        USERID: userId || null,
        USERNAME: userName || 'Anónimo',
        USEREMAIL: userEmail || null,
        CREATEDAT: Date.now(),
        IPADDRESS: ipAddress,
      }
    );

    return NextResponse.json({ success: true, vote });
  } catch (error: unknown) {
    console.error('Error creating vote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const votes = await databases.listDocuments(databaseId, PRODUCT_VOTES_COLLECTION, [
      Query.orderDesc('CREATEDAT'),
      Query.limit(1000),
    ]);

    // Group by product title and count
    const voteCounts: Record<string, { count: number; voters: string[] }> = {};
    votes.documents.forEach((vote: any) => {
      const title = vote.PRODUCTTITLE;
      if (!voteCounts[title]) {
        voteCounts[title] = { count: 0, voters: [] };
      }
      voteCounts[title].count++;
      if (vote.USERNAME) {
        voteCounts[title].voters.push(vote.USERNAME);
      }
    });

    // Sort by count
    const sorted = Object.entries(voteCounts)
      .map(([title, data]) => ({ title, count: data.count, voters: data.voters }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ votes: sorted });
  } catch (error: unknown) {
    console.error('Error fetching votes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
