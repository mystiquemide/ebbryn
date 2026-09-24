import { IxsError, listVaults } from "@/lib/ixs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ vaults: await listVaults() });
  } catch (e) {
    const message = e instanceof IxsError ? e.message : "Could not reach IXS";
    return Response.json({ error: message }, { status: 502 });
  }
}
