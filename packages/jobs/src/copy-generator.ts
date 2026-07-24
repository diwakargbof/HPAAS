// Composes @hpas/core (trigger engine) with @hpas/ai (copy generation).
// This is the only wiring point between deterministic logic and the LLM:
// one generateCampaignCopy call per campaign, cached on the campaign row.

import { defaultProvider, generateCampaignCopy, type CopyRequest } from "@hpas/ai";
import type { CopyGenerationContext, CopyGenerator } from "@hpas/core";
import { activeFestivalWindow, TEMPLATE_VARIABLES } from "@hpas/core";
import { renderTemplate, variablesForProfile } from "@hpas/core";
import { getTenantApiKey, recentMenuItems } from "@hpas/db";
import { aiAssistConfig, type GeneratedCopy } from "@hpas/types";
import dayjs from "dayjs";

export function makeCopyGenerator(): CopyGenerator {
  return async (ctx: CopyGenerationContext): Promise<GeneratedCopy> => {
    const { tenant, segment, sample } = ctx;

    const festival =
      segment.campaignType === "festival_preorder" ? upcomingFestival(ctx) : undefined;

    // New-item alerts get real, recently-added menu items to talk about.
    const newItems =
      segment.campaignType === "new_item_alert"
        ? (await recentMenuItems(tenant.id, 30)).map((m) => ({
            name: m.name,
            category: m.category,
            price: m.price,
          }))
        : undefined;

    const request: CopyRequest = {
      shopName: tenant.config.branding.shopName,
      brandVoice: tenant.config.brandVoice,
      campaignType: segment.campaignType,
      segmentName: segment.name,
      segmentRule: segment.rule,
      availableVariables: TEMPLATE_VARIABLES,
      sampleCustomers: sample.map(({ profile, features }) => ({
        firstName:
          typeof profile.traits.name === "string"
            ? profile.traits.name.split(" ")[0]
            : null,
        favoriteItem: features.favoriteItem,
        categoryAffinity: features.categoryAffinity,
        daysSinceLastVisit: features.recencyDays,
      })),
      festival,
      newItems,
    };

    const assist = aiAssistConfig(tenant.config);
    const secret = assist.personalization ? await getTenantApiKey(tenant.id) : null;
    const provider = defaultProvider({
      aiAssistEnabled: assist.personalization,
      provider: secret?.provider,
      apiKey: secret?.apiKey,
      model: secret?.model,
    });
    const copy = await generateCampaignCopy(request, provider);

    // Pre-render a few examples for the approval queue UI.
    const samples = sample.slice(0, 3).map(({ profile, features }) => ({
      profileId: profile.id,
      rendered: renderTemplate(
        copy.template,
        variablesForProfile(profile, features, {
          shop_name: tenant.config.branding.shopName,
          redemption_code: `${tenant.config.slug.slice(0, 4).toUpperCase()}-SAMPLE`,
          festival_name: festival?.name ?? "",
        })
      ),
    }));

    return {
      template: copy.template,
      variables: copy.variables,
      samples,
      provider: copy.provider,
      model: copy.model,
      generatedAt: new Date().toISOString(),
    };
  };
}

function upcomingFestival(ctx: CopyGenerationContext) {
  const { tenant } = ctx;
  const active = activeFestivalWindow(tenant, new Date());
  const entry = active
    ? tenant.config.festivals.find((f) => f.name === active.name && f.date === active.date)
    : // demo path (window bypassed): nearest future festival, else latest past one
      [...tenant.config.festivals].sort((a, b) => a.date.localeCompare(b.date)).find((f) =>
        dayjs(f.date).isAfter(dayjs())
      ) ?? tenant.config.festivals[tenant.config.festivals.length - 1];
  return entry
    ? { name: entry.name, date: entry.date, categories: entry.categories }
    : undefined;
}
