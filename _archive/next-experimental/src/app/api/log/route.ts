import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Diagnostic Report Received:", data);
    return NextResponse.json({
      status: "success",
      message: "Report received by Next.js API",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to process report" },
      { status: 500 },
    );
  }
}
