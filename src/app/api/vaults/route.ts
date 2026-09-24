import { IxsError, listVaults } from "@/lib/ixs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ vaults: await listVaults() });
  } catch (e) {
    console.error(e instanceof IxsError ? e.message : e);
    return Response.json({ error: "IXS didn't answer in time. Try again in a minute." }, { status: 502 });
  }
}
