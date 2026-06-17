import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 從 .env 讀取允許呼叫後端的前端網址
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// 簡易登入狀態，先存在後端記憶體
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 120; // 2 小時

app.use(cors({
  origin(origin, callback) {
    // 直接用瀏覽器開 /api/health 時，沒有 origin，允許
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
}));

app.use(express.json());

function createSession() {
  const token = crypto.randomUUID();

  sessions.set(token, {
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return token;
}

function requireLogin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token || !sessions.has(token)) {
    res.status(401).json({
      ok: false,
      message: "Unauthorized",
    });
    return;
  }

  const session = sessions.get(token);

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);

    res.status(401).json({
      ok: false,
      message: "Session expired",
    });
    return;
  }

  next();
}

function parseGasResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      raw: text,
    };
  }
}

function isUnauthorizedFromGas(data) {
  return data?.message === "Unauthorized." || data?.raw === "Unauthorized.";
}

async function callAppsScriptGet(params = {}) {
  if (!process.env.GAS_URL || !process.env.GAS_TOKEN) {
    throw new Error("GAS_URL 或 GAS_TOKEN 尚未設定");
  }

  const url = new URL(process.env.GAS_URL);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // token 只由後端加上，前端不知道
  url.searchParams.set("token", process.env.GAS_TOKEN);

  const response = await fetch(url);
  const text = await response.text();
  const data = parseGasResponse(text);

  if (!response.ok || isUnauthorizedFromGas(data) || data.ok === false) {
    throw new Error(data.message || "Apps Script GET request failed");
  }

  return data;
}

async function callAppsScriptPost(payload = {}) {
  if (!process.env.GAS_URL || !process.env.GAS_TOKEN) {
    throw new Error("GAS_URL 或 GAS_TOKEN 尚未設定");
  }

  const response = await fetch(process.env.GAS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      // token 只由後端加上，前端不知道
      token: process.env.GAS_TOKEN,
    }),
  });

  const text = await response.text();
  const data = parseGasResponse(text);

  if (!response.ok || isUnauthorizedFromGas(data) || data.ok === false) {
    throw new Error(data.message || "Apps Script POST request failed");
  }

  return data;
}

// 測試後端是否正常
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
  });
});

// 登入 API：前端送密碼，後端跟 .env 裡的 ADMIN_PASSWORD 比對
app.post("/api/login", (req, res) => {
  const password = String(req.body.password || "").trim();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({
      ok: false,
      message: "登入失敗",
    });
    return;
  }

  const accessToken = createSession();

  res.json({
    ok: true,
    accessToken,
  });
});

// 讀取志工名單
app.get("/api/volunteers", requireLogin, async (req, res) => {
  try {
    const data = await callAppsScriptGet({
      action: "listVolunteers",
    });

    res.json({
      ok: true,
      volunteers: Array.isArray(data.volunteers) ? data.volunteers : [],
    });
  } catch (err) {
    console.error("讀取志工名單失敗：", err.message);

    res.status(500).json({
      ok: false,
      message: "讀取志工名單失敗",
    });
  }
});
// 讀取某位志工的預設服務項目
app.get("/api/volunteers/:id/services", requireLogin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim().toUpperCase();

    if (!id) {
      res.status(400).json({
        ok: false,
        message: "缺少志工 ID",
      });
      return;
    }

    const data = await callAppsScriptGet({
      action: "listVolunteerServices",
      volunteerId: id,
    });

    res.json({
      ok: true,
      services: Array.isArray(data.services) ? data.services : [],
    });
  } catch (err) {
    console.error("讀取志工服務項目失敗：", err.message);

    res.status(500).json({
      ok: false,
      message: "讀取志工服務項目失敗",
    });
  }
});
// 儲存某位志工的預設服務項目
app.post("/api/volunteers/:id/services", requireLogin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim().toUpperCase();
    const services = Array.isArray(req.body.services) ? req.body.services : [];

    if (!id) {
      res.status(400).json({
        ok: false,
        message: "缺少志工 ID",
      });
      return;
    }

    const normalizedServices = services.map((service, index) => ({
      serviceItemCode: String(service.serviceItemCode || "").trim(),
      serviceContentCode: String(service.serviceContentCode || "").trim(),
      sortOrder: Number(service.sortOrder || index + 1),
    }));

    await callAppsScriptPost({
      action: "saveVolunteerServices",
      volunteerId: id,
      services: normalizedServices,
    });

    res.json({
      ok: true,
      count: normalizedServices.length,
    });
  } catch (err) {
    console.error("儲存志工服務項目失敗：", err.message);

    res.status(500).json({
      ok: false,
      message: "儲存志工服務項目失敗",
    });
  }
});
// 新增或更新志工
app.post("/api/volunteers", requireLogin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const id = String(req.body.id || "").trim().toUpperCase();

    if (!name || !id) {
      res.status(400).json({
        ok: false,
        message: "缺少志工姓名或身分證字號",
      });
      return;
    }

    await callAppsScriptPost({
      action: "upsert",
      name,
      id,
    });

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error("新增或更新志工失敗：", err.message);

    res.status(500).json({
      ok: false,
      message: "新增或更新志工失敗",
    });
  }
});

// 刪除志工
app.delete("/api/volunteers/:id", requireLogin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim().toUpperCase();

    if (!id) {
      res.status(400).json({
        ok: false,
        message: "缺少志工 ID",
      });
      return;
    }

    await callAppsScriptPost({
      action: "delete",
      id,
    });

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error("刪除志工失敗：", err.message);

    res.status(500).json({
      ok: false,
      message: "刪除志工失敗",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});