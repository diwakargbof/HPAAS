import { sendApprovedCampaign } from "@hpas/channels";
import { listCampaigns, listTenants } from "@hpas/db";

/**
 * Safety net: the API sends immediately on "Approve & Send", but any
 * campaign left in approved (API crash, manual DB approval) is picked up
 * here.
 */
export async function sendCampaignsJob(): Promise<void> {
  for (const tenant of await listTenants()) {
    const approved = await listCampaigns(tenant.id, ["approved"]);
    for (const campaign of approved) {
      const result = await sendApprovedCampaign(tenant, campaign.id);
      console.log(
        `[send] ${tenant.name} campaign ${campaign.id.slice(0, 8)}: ` +
          `sent=${result.sent} callList=${result.callList} failed=${result.failed} control=${result.control}` +
          (result.callListFile ? ` (call list: ${result.callListFile})` : "")
      );
    }
  }
}
