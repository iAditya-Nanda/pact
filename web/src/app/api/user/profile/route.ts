import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2), "utf-8");
  }
}

function readUsers(): Record<string, any> {
  ensureStorage();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeUsers(data: Record<string, any>) {
  ensureStorage();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    const users = readUsers();

    if (id && users[id]) {
      return NextResponse.json({ success: true, user: users[id] });
    }

    if (email) {
      const found = Object.values(users).find((u: any) => u.email === email);
      if (found) {
        return NextResponse.json({ success: true, user: found });
      }
    }

    // Default primary developer account fallback from backend users
    const firstUser = Object.values(users)[0];
    if (firstUser) {
      return NextResponse.json({ success: true, user: firstUser });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: "usr_adityananda_dev",
        email: "adityananda.dev@gmail.com",
        fullName: "Aditya Nanda",
        avatarUrl: "",
        role: "Lead Architect",
        age: 24,
        schedulePreference: "Avoid meetings before 10:00 AM",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, fullName, avatarUrl, role, age, schedulePreference, googleAccessToken } = body;

    const userId = id || `usr_${Date.now()}`;
    const users = readUsers();

    const updatedUser = {
      id: userId,
      email: email || "adityananda.dev@gmail.com",
      fullName: fullName || "Aditya Nanda",
      avatarUrl: avatarUrl || "",
      role: role || "Lead Architect",
      age: age ? Number(age) : 24,
      schedulePreference: schedulePreference || "Avoid meetings before 10:00 AM",
      googleAccessToken: googleAccessToken || users[userId]?.googleAccessToken || "",
      updatedAt: new Date().toISOString(),
      createdAt: users[userId]?.createdAt || new Date().toISOString(),
    };

    users[userId] = updatedUser;
    writeUsers(users);

    return NextResponse.json({
      success: true,
      message: "User profile synchronized with backend database",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
