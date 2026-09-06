import type { FastifyInstance } from "fastify";
import type { ExtractedEntities, Unit, VoiceInteractResponse } from "@agrivision/shared-types";
import { callProcess, callSpeak } from "../../lib/pythonServiceClient.js";
import { renderTemplate } from "../../lib/replyTemplates.js";
import { getLatestPriceByCropSlug } from "../../lib/priceQueries.js";
import { localizeCropName, localizeUnit } from "../../lib/localization.js";
import { LANGUAGE_TO_SARVAM_CODE } from "@agrivision/shared-types";

const UNIT_MAP: Record<string, Unit> = { kg: "KG", quintal: "QUINTAL", ton: "TON" };

export default async function voiceRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.post(
    "/voice/interact",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No audio file provided" });
      }

      const audioBuffer = await file.toBuffer();
      const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
      if (!user) {
        return reply.code(401).send({ error: "User not found" });
      }

      const preferredSarvamCode = LANGUAGE_TO_SARVAM_CODE[user.preferredLanguage];

      const processed = await callProcess({
        audioBuffer,
        filename: file.filename,
        mimeType: file.mimetype,
        role: user.role.toLowerCase(),
        preferredLanguage: preferredSarvamCode,
        mandiId: user.mandiId,
      });

      const lang = processed.detected_language || preferredSarvamCode;
      const entities: ExtractedEntities = processed.entities;

      let replyText: string;
      let listingResult: VoiceInteractResponse["listing"];
      let priceResult: VoiceInteractResponse["price"];

      switch (processed.intent) {
        case "price_query": {
          const targetMandiId = entities.mandi_id ?? user.mandiId;
          if (!targetMandiId) {
            replyText = renderTemplate("price_query_no_mandi", lang);
            break;
          }
          if (!entities.crop) {
            replyText = renderTemplate("price_query_not_found", lang, { cropName: "" });
            break;
          }
          const price = await getLatestPriceByCropSlug(prisma, targetMandiId, entities.crop);
          if (!price) {
            const crop = await prisma.crop.findUnique({ where: { slug: entities.crop } });
            replyText = renderTemplate("price_query_not_found", lang, {
              cropName: crop ? localizeCropName(crop.localNames, lang, entities.crop) : entities.crop,
            });
          } else {
            replyText = renderTemplate("price_query_reply", lang, {
              cropName: localizeCropName(price.crop.localNames, lang, entities.crop),
              price: Number(price.pricePerUnit),
              unit: localizeUnit(price.unit, lang),
              mandiName: price.mandi.name,
            });
            priceResult = {
              id: price.id,
              cropSlug: price.crop.slug,
              pricePerUnit: Number(price.pricePerUnit),
              unit: price.unit,
            };
          }
          break;
        }

        case "sell_offer": {
          const unit = entities.unit ? UNIT_MAP[entities.unit] : undefined;
          if (!entities.crop || !entities.quantity || !unit) {
            replyText = renderTemplate("sell_offer_invalid", lang);
            break;
          }
          const crop = await prisma.crop.findUnique({ where: { slug: entities.crop } });
          if (!crop) {
            replyText = renderTemplate("sell_offer_invalid", lang);
            break;
          }
          const listing = await prisma.listing.create({
            data: {
              farmerId: user.id,
              cropId: crop.id,
              quantity: entities.quantity,
              unit,
              askingPricePerUnit: entities.price ?? undefined,
              mandiId: entities.mandi_id ?? user.mandiId,
            },
          });
          replyText = renderTemplate("sell_offer_confirmed", lang, {
            cropName: localizeCropName(crop.localNames, lang, entities.crop),
            quantity: entities.quantity,
            unit: localizeUnit(unit, lang),
          });
          listingResult = {
            id: listing.id,
            cropSlug: crop.slug,
            quantity: Number(listing.quantity),
            unit: listing.unit,
          };
          break;
        }

        case "price_update": {
          if (user.role !== "MANDI_HEAD" || !user.mandiId) {
            replyText = renderTemplate("not_authorized", lang);
            break;
          }
          const unit = entities.unit ? UNIT_MAP[entities.unit] : undefined;
          if (!entities.crop || !entities.price || !unit) {
            replyText = renderTemplate("price_update_invalid", lang);
            break;
          }
          const crop = await prisma.crop.findUnique({ where: { slug: entities.crop } });
          if (!crop) {
            replyText = renderTemplate("price_update_invalid", lang);
            break;
          }
          const price = await prisma.mandiPrice.create({
            data: {
              mandiId: user.mandiId,
              cropId: crop.id,
              pricePerUnit: entities.price,
              unit,
              updatedById: user.id,
            },
          });
          replyText = renderTemplate("price_update_confirmed", lang, {
            cropName: localizeCropName(crop.localNames, lang, entities.crop),
            price: entities.price,
            unit: localizeUnit(unit, lang),
          });
          priceResult = {
            id: price.id,
            cropSlug: crop.slug,
            pricePerUnit: Number(price.pricePerUnit),
            unit: price.unit,
          };
          break;
        }

        default:
          replyText = processed.draft_reply_text ?? renderTemplate("fallback_unrecognized", lang);
      }

      await prisma.voiceInteractionLog.create({
        data: {
          userId: user.id,
          transcript: processed.transcript,
          detectedLanguage: lang,
          intent: processed.intent,
          entities: entities as never,
          finalReplyText: replyText,
        },
      });

      const spoken = await callSpeak({ text: replyText, languageCode: lang });

      const responseBody: VoiceInteractResponse = {
        transcript: processed.transcript,
        detectedLanguage: lang,
        intent: processed.intent,
        entities,
        replyText,
        listing: listingResult,
        price: priceResult,
        audio: {
          mimeType: spoken.mimeType,
          base64: spoken.buffer.toString("base64"),
        },
      };

      return reply.send(responseBody);
    }
  );
}
