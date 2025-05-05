export enum AIMode {
  gpt4oMini = 'gpt-4o-mini',
  gpt4oMini20240718 = 'gpt-4o-mini-2024-07-18',
  gpt41 = 'gpt-4.1-nano-2025-04-14',
  IMAGE = 'image',
  CODE = 'code',
  DEFAULT = 'default',
}

export enum AIModelName {
  gpt4oMini = 'gpt-4o-mini',
  gpt4oLatest = 'chatgpt-4o-latest',
  gpt41 = 'gpt-4.1-nano-2025-04-14',
  IMAGE = 'image',
  CODE = 'code',
  DEFAULT = 'default',
}

export type AIModeType = (typeof AIMode)[keyof typeof AIMode];

export enum Role {
  user = 'user',
  assistant = 'assistant',
  system = 'system',
}

type RoleType = (typeof Role)[keyof typeof Role];

export interface Msg {
  role: RoleType;
  content: string;
}

interface MsgResponseType extends Msg {
  refusal: null;
  annotations: [];
}

export interface AIRequest {
  messages: Msg[];
  model: AIModeType;
}

export interface MsgContent {
  message: MsgResponseType;
}

export interface AIResponse {
  id: string;
  object: string;
  system_fingerprint: string;
  model: AIModeType;
  created: number;
  choices: MsgContent[];
}

export interface ResponseBase<T> {
  statusCode: number;
  data: T | null;
  msg: string;
}
