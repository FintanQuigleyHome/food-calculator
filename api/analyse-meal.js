const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    food_name: { type: "string" },
    estimated_carbs_g: { type: "number" },
    carb_low_g: { type: "number" },
    carb_high_g: { type: "number" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    uncertainty_note: { type: "string" },
    components: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { name: { type: "string" }, carbs_g: { type: "number" } },
        required: ["name", "carbs_g"]
      }
    }
  },
  required: ["food_name", "estimated_carbs_g", "carb_low_g", "carb_high_g", "confidence", "uncertainty_note", "components"]
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });

  const { image, weight_g } = req.body || {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "A meal image is required." });
  }
  if (image.length > 7_000_000) return res.status(413).json({ error: "Image is too large." });

  const weightText = Number.isFinite(Number(weight_g)) && Number(weight_g) > 0
    ? `The user reports the total plated food weighs ${Number(weight_g)} grams. Use this as an important portion-size constraint.`
    : "No reliable total food weight was supplied. Be conservative about portion-size certainty.";

  const prompt = `Estimate the digestible carbohydrate in the meal shown. ${weightText}
Identify the visible meal and give a practical carbohydrate estimate in grams, a plausible low/high range, and a short uncertainty note. Break the estimate into visible carbohydrate-containing components. Do not calculate insulin or give an insulin dose. Do not claim certainty from an image alone. If hidden ingredients, sauces, drinks, or unclear portions could materially change the estimate, say so briefly. Confidence is a qualitative model self-assessment, not a calibrated probability.`;

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        store: false,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image, detail: "high" }
          ]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "meal_carb_estimate",
            strict: true,
            schema: SCHEMA
          }
        }
      })
    });

    const raw = await r.json();
    if (!r.ok) {
      const msg = raw?.error?.message || `OpenAI request failed (${r.status}).`;
      return res.status(r.status).json({ error: msg });
    }
    const text = raw.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text;
    if (!text) return res.status(502).json({ error: "The AI returned no usable estimate." });
    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: "Meal analysis failed. Please enter carbohydrates manually." });
  }
}
