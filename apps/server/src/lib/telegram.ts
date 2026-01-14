import crypto from "crypto";

export type TelegramUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type InitDataResult = {
  user: TelegramUser;
  authDate: number;
};

export const verifyInitData = (
  initData: string,
  botToken: string
): InitDataResult | null => {
  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return null;
  }

  const dataCheck = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataCheck)
    .digest("hex");

  if (signature !== hash) {
    return null;
  }

  const userJson = params.get("user");
  if (!userJson) {
    return null;
  }

  const user = JSON.parse(userJson) as TelegramUser;
  const authDate = Number(params.get("auth_date") || "0");

  return { user: { ...user, id: String(user.id) }, authDate };
};
