
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase-admin/firestore';
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

// --- Helper Functions ---

async function fetchImageAsBuffer(imageUrl: string): Promise<{ buffer: Buffer, contentType: string }> {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to fetch image from ${imageUrl}: Status Code ${response.statusCode}`));
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


async function migrateImage(
  communityId: string, 
  imageUrl: string, 
  fieldToUpdate: 'communityProfileImage' | 'logo'
): Promise<string> {
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.");
    }
    const { buffer, contentType } = await fetchImageAsBuffer(imageUrl);

    const oldPath = parse(imageUrl).pathname || '';
    const oldFilename = oldPath.split('/').pop() || `${fieldToUpdate}-${Date.now()}`;
    const newFilePath = `community-assets/${communityId}/${oldFilename}`;

    const bucket = storage.bucket(bucketName); 
    const file = bucket.file(newFilePath);

    await file.save(buffer, {
        metadata: { contentType: contentType },
    });

    await file.makePublic();
    const newUrl = file.publicUrl();

    const communityRef = doc(firestore, 'communities', communityId);
    await updateDoc(communityRef, { [fieldToUpdate]: newUrl });

    return newUrl;
}

// --- API Route ---

export async function POST(request: Request) {
  const logs: string[] = [];
  let errorCount = 0;

  if (!bucketName) {
    const errorMessage = "FATAL ERROR: Firebase Storage bucket name not configured in environment variables.";
    logs.push(errorMessage);
    return NextResponse.json({ logs, errorCount: 1, error: errorMessage }, { status: 500 });
  }

  try {
    logs.push("Fetching all community documents from Firestore...");
    const communitiesRef = collection(firestore, 'communities');
    const snapshot = await getDocs(communitiesRef);
    logs.push(`Found ${snapshot.size} communities to process.`);

    const migrationPromises = snapshot.docs.map(async (communityDoc) => {
        const communityId = communityDoc.id;
        const communityData = communityDoc.data();
        logs.push(`\n[Processing] Community: ${communityData.name} (ID: ${communityId})`);
        
        const fieldsToMigrate: ('communityProfileImage' | 'logo')[] = ['communityProfileImage', 'logo'];
        
        for (const field of fieldsToMigrate) {
            const imageUrl = communityData[field];

            if (imageUrl && typeof imageUrl === 'string' && !imageUrl.includes('firebasestorage.googleapis.com')) {
                try {
                    logs.push(` -> Migrating ${field} from ${imageUrl}`);
                    const newUrl = await migrateImage(communityId, imageUrl, field);
                    logs.push(`    ✅ Success! New URL: ${newUrl}`);
                } catch (e: any) {
                    logs.push(`    ❌ FAILED to migrate ${field}. Reason: ${e.message}`);
                    errorCount++;
                }
            } else if (imageUrl) {
                 logs.push(` -> Skipping ${field}, already in new storage.`);
            } else {
                 logs.push(` -> Skipping ${field}, no image URL present.`);
            }
        }
    });

    await Promise.all(migrationPromises);

    logs.push("\nBulk migration process completed.");
    return NextResponse.json({ logs, errorCount });

  } catch (error: any) {
    logs.push(`A critical error occurred: ${error.message}`);
    errorCount++;
    return NextResponse.json({ logs, errorCount, error: error.message }, { status: 500 });
  }
}
