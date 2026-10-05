import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test auth service reachability
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Supabase!",
      hasSession: !!data.session,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "failed", error: errorMessage },
      { status: 500 }
    );
  }
}
