type TemplateKey =
  | "price_query_reply"
  | "price_query_not_found"
  | "price_query_no_mandi"
  | "sell_offer_confirmed"
  | "sell_offer_invalid"
  | "price_update_confirmed"
  | "price_update_invalid"
  | "not_authorized"
  | "fallback_unrecognized";

const TEMPLATES: Record<TemplateKey, Record<string, string>> = {
  price_query_reply: {
    "hi-IN": "{mandiName} मंडी में {cropName} का भाव {price} रुपये प्रति {unit} है।",
    "mr-IN": "{mandiName} मंडईत {cropName} चा भाव {price} रुपये प्रति {unit} आहे.",
    "pa-IN": "{mandiName} ਮੰਡੀ ਵਿੱਚ {cropName} ਦਾ ਭਾਅ {price} ਰੁਪਏ ਪ੍ਰਤੀ {unit} ਹੈ।",
    "gu-IN": "{mandiName} મંડીમાં {cropName} નો ભાવ {price} રૂપિયા પ્રતિ {unit} છે.",
    "en-IN": "The price of {cropName} at {mandiName} mandi is {price} rupees per {unit}.",
  },
  price_query_not_found: {
    "hi-IN": "माफ़ कीजिए, {cropName} का भाव अभी उपलब्ध नहीं है।",
    "mr-IN": "माफ करा, {cropName} चा भाव सध्या उपलब्ध नाही.",
    "pa-IN": "ਮੁਆਫ਼ ਕਰਨਾ, {cropName} ਦਾ ਭਾਅ ਹੁਣੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।",
    "gu-IN": "માફ કરશો, {cropName} નો ભાવ હાલમાં ઉપલબ્ધ નથી.",
    "en-IN": "Sorry, the price for {cropName} is not available yet.",
  },
  price_query_no_mandi: {
    "hi-IN": "कृपया पहले अपनी पसंदीदा मंडी चुनें।",
    "mr-IN": "कृपया आधी तुमची आवडती मंडई निवडा.",
    "pa-IN": "ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਆਪਣੀ ਪਸੰਦੀਦਾ ਮੰਡੀ ਚੁਣੋ।",
    "gu-IN": "કૃપા કરીને પહેલા તમારી પસંદગીની મંડી પસંદ કરો.",
    "en-IN": "Please select your preferred mandi first.",
  },
  sell_offer_confirmed: {
    "hi-IN": "ठीक है, आपकी {quantity} {unit} {cropName} बेचने की सूची बना दी गई है।",
    "mr-IN": "ठीक आहे, तुमची {quantity} {unit} {cropName} विकण्याची यादी तयार केली आहे.",
    "pa-IN": "ਠੀਕ ਹੈ, ਤੁਹਾਡੀ {quantity} {unit} {cropName} ਵੇਚਣ ਦੀ ਸੂਚੀ ਬਣਾ ਦਿੱਤੀ ਗਈ ਹੈ।",
    "gu-IN": "બરાબર, તમારી {quantity} {unit} {cropName} વેચવાની યાદી બનાવી દેવામાં આવી છે.",
    "en-IN": "Done — a listing for {quantity} {unit} of {cropName} has been created.",
  },
  sell_offer_invalid: {
    "hi-IN": "माफ़ कीजिए, मुझे फसल और मात्रा साफ़ नहीं समझ आई। कृपया दोबारा बताएं।",
    "mr-IN": "माफ करा, मला पीक आणि प्रमाण नीट समजले नाही. कृपया पुन्हा सांगा.",
    "pa-IN": "ਮੁਆਫ਼ ਕਰਨਾ, ਮੈਨੂੰ ਫਸਲ ਅਤੇ ਮਾਤਰਾ ਸਮਝ ਨਹੀਂ ਆਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।",
    "gu-IN": "માફ કરશો, મને પાક અને જથ્થો સમજાયો નહીં. કૃપા કરીને ફરીથી કહો.",
    "en-IN": "Sorry, I couldn't understand the crop or quantity clearly. Please try again.",
  },
  price_update_confirmed: {
    "hi-IN": "ठीक है, {cropName} का भाव {price} रुपये प्रति {unit} अपडेट कर दिया गया है।",
    "mr-IN": "ठीक आहे, {cropName} चा भाव {price} रुपये प्रति {unit} अपडेट केला आहे.",
    "pa-IN": "ਠੀਕ ਹੈ, {cropName} ਦਾ ਭਾਅ {price} ਰੁਪਏ ਪ੍ਰਤੀ {unit} ਅਪਡੇਟ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ।",
    "gu-IN": "બરાબર, {cropName} નો ભાવ {price} રૂપિયા પ્રતિ {unit} અપડેટ કરી દેવામાં આવ્યો છે.",
    "en-IN": "Done — the price of {cropName} has been updated to {price} rupees per {unit}.",
  },
  price_update_invalid: {
    "hi-IN": "माफ़ कीजिए, मुझे फसल और भाव साफ़ नहीं समझ आया। कृपया दोबारा बताएं।",
    "mr-IN": "माफ करा, मला पीक आणि भाव नीट समजला नाही. कृपया पुन्हा सांगा.",
    "pa-IN": "ਮੁਆਫ਼ ਕਰਨਾ, ਮੈਨੂੰ ਫਸਲ ਅਤੇ ਭਾਅ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।",
    "gu-IN": "માફ કરશો, મને પાક અને ભાવ સમજાયો નહીં. કૃપા કરીને ફરીથી કહો.",
    "en-IN": "Sorry, I couldn't understand the crop or price clearly. Please try again.",
  },
  not_authorized: {
    "hi-IN": "माफ़ कीजिए, भाव अपडेट करने की अनुमति सिर्फ मंडी प्रमुख को है।",
    "mr-IN": "माफ करा, भाव अपडेट करण्याची परवानगी फक्त मंडई प्रमुखांना आहे.",
    "pa-IN": "ਮੁਆਫ਼ ਕਰਨਾ, ਭਾਅ ਅਪਡੇਟ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਸਿਰਫ਼ ਮੰਡੀ ਮੁਖੀ ਨੂੰ ਹੈ।",
    "gu-IN": "માફ કરશો, ભાવ અપડેટ કરવાની પરવાનગી ફક્ત મંડી વડાને છે.",
    "en-IN": "Sorry, only a mandi head can update prices.",
  },
  fallback_unrecognized: {
    "hi-IN": "माफ़ कीजिए, मुझे समझ नहीं आया। कृपया दोबारा बोलें।",
    "mr-IN": "माफ करा, मला समजले नाही. कृपया पुन्हा बोला.",
    "pa-IN": "ਮੁਆਫ਼ ਕਰਨਾ, ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।",
    "gu-IN": "માફ કરશો, મને સમજાયું નહીં. કૃપા કરીને ફરીથી બોલો.",
    "en-IN": "Sorry, I didn't understand. Please say that again.",
  },
};

export function renderTemplate(
  key: TemplateKey,
  languageCode: string,
  params: Record<string, string | number> = {}
): string {
  const byLanguage = TEMPLATES[key];
  const template = byLanguage[languageCode] ?? byLanguage["hi-IN"];
  return template.replace(/\{(\w+)\}/g, (_match, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}
