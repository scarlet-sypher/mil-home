import { NextResponse } from "next/server";

// Wraps a route handler so any uncaught exception (a DB error, a bug, anything the
// handler itself doesn't already catch) always returns valid JSON instead of an empty
// 500 body -- an empty body is what crashes the client's own response.json() call with
// "Unexpected end of JSON input" rather than showing a real error message. The actual
// error is still logged server-side (captured into the packaged app's own launcher log
// on a real install), so it stays fully diagnosable -- it's just never exposed raw to
// the browser.
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[api-error]", error);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
