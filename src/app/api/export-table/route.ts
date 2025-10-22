// This file is no longer used for exporting tables.
// The logic has been broken down into smaller, sequential API routes
// in the /api/export-helpers directory to allow for client-side progress tracking.

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'This endpoint is deprecated. Please use the new export flow.' }, { status: 404 });
}
