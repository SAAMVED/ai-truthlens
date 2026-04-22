import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Create directory if it doesn't exist
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error("Read DB Error:", error);
    return [];
  }
}

// Helper to write to database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Write DB Error:", error);
    return false;
  }
}

// GET request to fetch all saved session data
export async function GET() {
  try {
    const data = readDB();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database" }, { status: 500 });
  }
}

// POST request to save new session data
export async function POST(request) {
  try {
    const newEntry = await request.json();
    const data = readDB();

    // Add ID and Timestamp
    const recordToSave = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...newEntry
    };

    data.push(recordToSave);
    const success = writeDB(data);

    if (!success) throw new Error("File write failed");

    return NextResponse.json({ success: true, record: recordToSave });

  } catch (error) {
    console.error("POST History Error:", error);
    return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
  }
}
