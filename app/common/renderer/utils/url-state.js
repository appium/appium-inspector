import {SERVER_TYPES} from '../constants/session-builder.js';
import {isPlainObject} from './common.js';
import {areSessionCapsValid} from './sessionfile-parsing.js';

// Server types a link may select, and the fields it may set on each server slice. Cloud-vendor
// slices are excluded: a vendor falls back to credentials from environment variables, so a link
// that selected a vendor and chose its host could send those credentials to a server of its own.
const URL_SERVER_TYPES = [SERVER_TYPES.LOCAL, SERVER_TYPES.REMOTE];
const URL_SERVER_FIELDS = {
  [SERVER_TYPES.LOCAL]: {hostname: 'string', port: ['string', 'number'], path: 'string', ssl: 'boolean'},
  [SERVER_TYPES.REMOTE]: {hostname: 'string', port: ['string', 'number'], path: 'string', ssl: 'boolean'},
  [SERVER_TYPES.ADVANCED]: {allowUnauthorized: 'boolean', useProxy: 'boolean', proxy: 'string'},
};

const hasFieldType = (fields, field, value) => [fields[field]].flat().includes(typeof value);

/**
 * Reduce session builder state supplied through the `?state=` query parameter to the parts a
 * link may set: capabilities, a session id to attach to, and a local or remote server with its
 * advanced options. The result replaces the saved server state (see SET_STATE_FROM_URL), so a
 * session started from a link never uses saved cloud credentials.
 *
 * @param {unknown} state parsed `state` query parameter
 * @returns {{state: object, dropped: string[]}} the allowed state, and the paths of everything
 * that was removed
 */
export function sanitizeUrlState(state) {
  const allowed = {};
  const dropped = [];
  if (!isPlainObject(state)) {
    return {state: allowed, dropped: ['(state is not an object)']};
  }

  for (const [key, value] of Object.entries(state)) {
    if (key === 'caps' && areSessionCapsValid({caps: value})) {
      allowed.caps = value;
    } else if (key === 'attachSessId' && typeof value === 'string') {
      allowed.attachSessId = value;
    } else if (key === 'serverType' && URL_SERVER_TYPES.includes(value)) {
      allowed.serverType = value;
    } else if (key === 'server' && isPlainObject(value)) {
      for (const [serverType, config] of Object.entries(value)) {
        const fields = URL_SERVER_FIELDS[serverType];
        if (!fields || !isPlainObject(config)) {
          dropped.push(`server.${serverType}`);
          continue;
        }
        for (const [field, fieldValue] of Object.entries(config)) {
          if (field in fields && hasFieldType(fields, field, fieldValue)) {
            allowed.server ??= {};
            allowed.server[serverType] ??= {};
            allowed.server[serverType][field] = fieldValue;
          } else {
            dropped.push(`server.${serverType}.${field}`);
          }
        }
      }
    } else {
      dropped.push(key);
    }
  }

  return {state: allowed, dropped};
}
