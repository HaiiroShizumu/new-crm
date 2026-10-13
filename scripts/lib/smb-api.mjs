import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Общие помощники CLI форка: чтение .env сервера и вызовы мета-API Twenty.
// Мета-API (установка/удаление App, права APPLICATIONS) живёт на /metadata,
// корневой /graphql его не отдаёт — проверено интроспекцией с работающего API.
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

const SERVER_ENV_FILE = path.join(REPO_ROOT, 'packages/twenty-server/.env');

export const readServerEnv = () => {
  if (!existsSync(SERVER_ENV_FILE)) {
    return {};
  }

  const env = {};

  for (const line of readFileSync(SERVER_ENV_FILE, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);

    if (match) {
      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }

  return env;
};

export const getApiUrl = () =>
  process.env.SMB_API_URL || 'http://localhost:3000';

// Бросает Error — вызывающая CLI сама решает, как сообщить об ошибке.
export const runMetadataGraphql = async ({ query, variables }) => {
  const apiUrl = getApiUrl();
  const token = process.env.SMB_API_TOKEN;

  if (!token) {
    throw new Error(
      `нет SMB_API_TOKEN: ${apiUrl}/metadata требует токен с правом APPLICATIONS`,
    );
  }

  const response = await fetch(`${apiUrl}/metadata`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.errors) {
    throw new Error(
      `API ${apiUrl}/metadata ответил ${response.status}: ${JSON.stringify(
        payload.errors ?? payload,
      )}`,
    );
  }

  return payload.data;
};
