import api from "./api";

export const setup2FA = async () => {
  const response = await api.post("/v1/2fa/setup");
  return response.data;
};

export const verifySetup2FA = async (code) => {
  const response = await api.post("/v1/2fa/verify-setup", { code });
  return response.data;
};

export const disable2FA = async (password) => {
  const response = await api.post("/v1/2fa/disable", { password });
  return response.data;
};

export const verify2FALogin = async (code, isBackupCode = false) => {
  const response = await api.post("/v1/auth/verify-2fa", {
    code,
    isBackupCode,
  });
  return response.data;
};

export const regenerateBackupCodes = async (password) => {
  const response = await api.post("/v1/2fa/backup-codes/regenerate", {
    password,
  });
  return response.data;
};

export const get2FAStatus = async () => {
  const response = await api.get("/v1/2fa/status");
  return response.data;
};
