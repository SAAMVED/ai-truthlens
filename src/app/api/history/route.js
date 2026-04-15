import { NextResponse } from 'next/server';

// In-memory store – data persists within a single serverless instance
// but resets on cold starts. For a production app you'd use a database.
let dataStore = [];

// GET request to fetch all saved session data
export async function GET() {
  try {
    return NextResponse.json(dataStore);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database" }, { status: 500 });
  }
}

// POST request to save new session data
export async function POST(request) {
  try {
    const newEntry = await request.json();

    // Add ID and Timestamp
    const recordToSave = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...newEntry
    };

    // Push to in-memory store
    dataStore.push(recordToSave);

    return NextResponse.json({ success: true, record: recordToSave });

  } catch (error) {
    return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
  }
}
