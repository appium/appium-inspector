export const EMBEDDED_PROTOCOL_CHANNEL = 'appium-inspector:embedded';
export const EMBEDDED_PROTOCOL_VERSION = 3;

export const EMBEDDED_MESSAGE_TYPES = {
  CONNECT: 'appium-inspector:connect',
  READY: 'appium-inspector:ready',
  CONNECTED: 'appium-inspector:connected',
  ERROR: 'appium-inspector:error',
  ELEMENT_USED: 'appium-inspector:element-used',
  ANALYZE_ELEMENTS: 'appium-inspector:analyze-elements',
  CANCEL_ELEMENT_ANALYSIS: 'appium-inspector:cancel-element-analysis',
} as const;

export type EmbeddedCapabilities = Record<string, unknown>;

export const EMBEDDED_CANDIDATE_STABILITIES = ['stable', 'contextual', 'structural', 'manual'] as const;

export interface EmbeddedVerifiedLocatorCandidate {
  candidateId: string;
  strategy: string;
  selector: string;
  priority: number;
  stability: (typeof EMBEDDED_CANDIDATE_STABILITIES)[number];
  sourceReason: string;
  matchCount: 1;
  sameElement: true;
}

export interface EmbeddedConnectPayload {
  serverUrl: string;
  sessionId: string;
  capabilities: EmbeddedCapabilities;
  platform: string;
}

export interface EmbeddedElementUsedPayload {
  strategy: string;
  selector: string;
  elementId?: string;
  tag?: string;
  attributes: Record<string, string>;
  candidates: EmbeddedVerifiedLocatorCandidate[];
  screenshot?: string;
  source?: string;
}

export interface EmbeddedMessage<TType extends string, TPayload = undefined> {
  channel: typeof EMBEDDED_PROTOCOL_CHANNEL;
  version: typeof EMBEDDED_PROTOCOL_VERSION;
  type: TType;
  payload?: TPayload;
}

export class EmbeddedProtocolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'EmbeddedProtocolError';
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}' must be a non-empty string`);
  }
  return value;
};

const optionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}' must be a string`);
  }
  return value;
};

const CANDIDATE_FIELDS = new Set([
  'candidateId',
  'strategy',
  'selector',
  'priority',
  'stability',
  'sourceReason',
  'matchCount',
  'sameElement',
]);

function validateLocatorCandidate(data: unknown, index: number): EmbeddedVerifiedLocatorCandidate {
  const field = `candidates[${index}]`;
  if (!isPlainObject(data) || Object.keys(data).some((key) => !CANDIDATE_FIELDS.has(key))) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}' must use the strict verified candidate shape`);
  }
  if (!Number.isInteger(data.priority) || (data.priority as number) < 0) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}.priority' must be a non-negative integer`);
  }
  if (
    typeof data.stability !== 'string' ||
    !EMBEDDED_CANDIDATE_STABILITIES.includes(data.stability as EmbeddedVerifiedLocatorCandidate['stability'])
  ) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}.stability' is unsupported`);
  }
  if (data.matchCount !== 1 || data.sameElement !== true) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', `'${field}' must prove one exact same-element match`);
  }
  return {
    candidateId: requireNonEmptyString(data.candidateId, `${field}.candidateId`),
    strategy: requireNonEmptyString(data.strategy, `${field}.strategy`),
    selector: requireNonEmptyString(data.selector, `${field}.selector`),
    priority: data.priority as number,
    stability: data.stability as EmbeddedVerifiedLocatorCandidate['stability'],
    sourceReason: requireNonEmptyString(data.sourceReason, `${field}.sourceReason`),
    matchCount: 1,
    sameElement: true,
  };
}

export function validateElementUsedPayload(data: unknown): EmbeddedElementUsedPayload {
  if (!isPlainObject(data) || !isPlainObject(data.attributes)) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "Element-used payload and 'attributes' must be objects");
  }
  if (Object.values(data.attributes).some((value) => typeof value !== 'string')) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'attributes' values must be strings");
  }
  if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'candidates' must be a non-empty array");
  }
  const candidates = data.candidates.map(validateLocatorCandidate);
  const strategy = requireNonEmptyString(data.strategy, 'strategy');
  const selector = requireNonEmptyString(data.selector, 'selector');
  if (candidates[0].strategy !== strategy || candidates[0].selector !== selector) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', 'The first candidate must be the visible primary locator');
  }
  const identities = candidates.map(
    (candidate) => `${candidate.strategy.trim().toLowerCase()}\0${candidate.selector.trim()}`,
  );
  if (
    new Set(identities).size !== identities.length ||
    new Set(candidates.map(({candidateId}) => candidateId)).size !== candidates.length
  ) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'candidates' must contain unique locators and candidate IDs");
  }

  return {
    strategy,
    selector,
    ...optionalPayloadField('elementId', optionalString(data.elementId, 'elementId')),
    ...optionalPayloadField('tag', optionalString(data.tag, 'tag')),
    attributes: data.attributes as Record<string, string>,
    candidates,
    ...optionalPayloadField('screenshot', optionalString(data.screenshot, 'screenshot')),
    ...optionalPayloadField('source', optionalString(data.source, 'source')),
  };
}

function optionalPayloadField<T>(field: string, value: T | undefined): Record<string, T> {
  return value === undefined ? {} : {[field]: value};
}

export function validateConnectMessage(data: unknown): EmbeddedConnectPayload {
  if (!isPlainObject(data)) {
    throw new EmbeddedProtocolError('INVALID_MESSAGE', 'Message must be an object');
  }
  if (data.channel !== EMBEDDED_PROTOCOL_CHANNEL || data.version !== EMBEDDED_PROTOCOL_VERSION) {
    throw new EmbeddedProtocolError('UNSUPPORTED_PROTOCOL', 'Unsupported embedded protocol channel or version');
  }
  if (data.type !== EMBEDDED_MESSAGE_TYPES.CONNECT) {
    throw new EmbeddedProtocolError('INVALID_MESSAGE_TYPE', `Unsupported message type '${String(data.type)}'`);
  }
  if (!isPlainObject(data.payload)) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'payload' must be an object");
  }

  const serverUrl = requireNonEmptyString(data.payload.serverUrl, 'serverUrl');
  let parsedServerUrl: URL;
  try {
    parsedServerUrl = new URL(serverUrl);
  } catch {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'serverUrl' must be a valid URL");
  }
  if (!['http:', 'https:'].includes(parsedServerUrl.protocol)) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'serverUrl' must use HTTP or HTTPS");
  }
  if (!isPlainObject(data.payload.capabilities)) {
    throw new EmbeddedProtocolError('INVALID_PAYLOAD', "'capabilities' must be an object");
  }

  return {
    serverUrl: parsedServerUrl.toString().replace(/\/$/, ''),
    sessionId: requireNonEmptyString(data.payload.sessionId, 'sessionId'),
    capabilities: data.payload.capabilities,
    platform: requireNonEmptyString(data.payload.platform, 'platform'),
  };
}

export function resolveHostOrigin(locationUrl: string, configuredOrigin?: string): string {
  const url = new URL(locationUrl);
  if (!configuredOrigin) {
    if (url.origin === 'null') {
      throw new EmbeddedProtocolError(
        'HOST_ORIGIN_REQUIRED',
        "'hostOrigin' is required when the embedded bundle has an opaque origin",
      );
    }
    return url.origin;
  }

  let hostOrigin: URL;
  try {
    hostOrigin = new URL(configuredOrigin);
  } catch {
    throw new EmbeddedProtocolError('INVALID_HOST_ORIGIN', "'hostOrigin' must be an absolute origin");
  }
  if (
    !hostOrigin.hostname ||
    ['data:', 'file:', 'javascript:'].includes(hostOrigin.protocol) ||
    !['', '/'].includes(hostOrigin.pathname) ||
    hostOrigin.search ||
    hostOrigin.hash
  ) {
    throw new EmbeddedProtocolError('INVALID_HOST_ORIGIN', "'hostOrigin' must not include a path, query, or hash");
  }
  return `${hostOrigin.protocol}//${hostOrigin.host}`;
}

export function validateHostMessage(
  event: Pick<MessageEvent, 'source' | 'origin' | 'data'>,
  parentWindow: Window,
  hostOrigin: string,
): EmbeddedConnectPayload {
  if (event.source !== parentWindow) {
    throw new EmbeddedProtocolError('INVALID_SOURCE', 'Message did not come from the embedding window');
  }
  if (event.origin !== hostOrigin) {
    throw new EmbeddedProtocolError('INVALID_ORIGIN', `Message origin '${event.origin}' is not trusted`);
  }
  return validateConnectMessage(event.data);
}

type HostMessageType =
  | typeof EMBEDDED_MESSAGE_TYPES.READY
  | typeof EMBEDDED_MESSAGE_TYPES.CONNECTED
  | typeof EMBEDDED_MESSAGE_TYPES.ERROR
  | typeof EMBEDDED_MESSAGE_TYPES.ELEMENT_USED
  | typeof EMBEDDED_MESSAGE_TYPES.ANALYZE_ELEMENTS
  | typeof EMBEDDED_MESSAGE_TYPES.CANCEL_ELEMENT_ANALYSIS;

export interface EmbeddedBridge {
  post<TPayload>(type: HostMessageType, payload?: TPayload): void;
}

export function createEmbeddedBridge(parentWindow: Window, hostOrigin: string): EmbeddedBridge {
  return {
    post(type, payload) {
      parentWindow.postMessage(
        {
          channel: EMBEDDED_PROTOCOL_CHANNEL,
          version: EMBEDDED_PROTOCOL_VERSION,
          type,
          ...(payload === undefined ? {} : {payload}),
        },
        hostOrigin,
      );
    },
  };
}

let activeBridge: EmbeddedBridge | null = null;

export function setEmbeddedBridge(bridge: EmbeddedBridge | null): void {
  activeBridge = bridge;
}

export function emitElementUsed(payload: EmbeddedElementUsedPayload): void {
  if (!activeBridge) {
    throw new EmbeddedProtocolError('BRIDGE_NOT_READY', 'The embedded host connection is not ready');
  }
  activeBridge.post(EMBEDDED_MESSAGE_TYPES.ELEMENT_USED, validateElementUsedPayload(payload));
}
