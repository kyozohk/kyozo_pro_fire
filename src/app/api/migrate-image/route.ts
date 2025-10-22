
import { getFirestore, doc, updateDoc } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { parse } from 'url';
import https from 'https';

// Initialize Firebase Admin SDK
const adminApp = getFirebaseAdminApp();
const firestore = getFirestore(adminApp);
const storage = getStorage(adminApp);
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;


async function fetchImageAsBuffer(imageUrl: string): Promise<{ buffer: Buffer, contentType: string }> {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: Status Code ${response.statusCode}`));
                return;
            }

            const contentType = response.headers['content-type'] || 'application/octet-stream';
            const chunks: Buffer[] = [];
            
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({ buffer, contentType });
            });

        }).on('error', (err) => {
            reject(new Error(`Failed to fetch image: ${err.message}`));
        });
    });
}

export async function POST(request: Request) {
  const { communityId, imageUrl, fieldToUpdate } = await request.json();

  if (!communityId || !imageUrl || !fieldToUpdate) {
    return NextResponse.json({ error: 'Missing communityId, imageUrl, or fieldToUpdate.' }, { status: 400 });
  }

  if (!bucketName) {
     return NextResponse.json({ error: 'Firebase Storage bucket name is not configured.' }, { status: 500 });
  }

  try {
    // 1. Fetch the image from the old URL
    const { buffer, contentType } = await fetchImageAsBuffer(imageUrl);

    // 2. Determine a new filename
    const oldPath = parse(imageUrl).pathname || '';
    const oldFilename = oldPath.split('/').pop() || `${fieldToUpdate}-${Date.now()}`;
    const newFilePath = `community-assets/${communityId}/${oldFilename}`;

    // 3. Upload the image to the new Firebase Storage bucket
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(newFilePath);

    await file.save(buffer, {
        metadata: {
            contentType: contentType,
        },
    });

    // 4. Make the file public and get the new URL
    await file.makePublic();
    const newUrl = file.publicUrl();

    // 5. Update the Firestore document with the new URL
    const communityRef = doc(firestore, 'communities', communityId);
    await updateDoc(communityRef, {
        [fieldToUpdate]: newUrl
    });

    return NextResponse.json({ newUrl });

  } catch (error: any) {
    console.error("Failed to migrate image:", error);
    return NextResponse.json({ error: `Failed to migrate image: ${error.message}` }, { status: 500 });
  }
}
