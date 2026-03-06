/**
 * AI Chat 相关的数据模型和接口定义
 * 基于 GNS3 Copilot Chat API 设计文档
 */

/**
 * SSE 事件类型
 */
export type ChatEventType =
  | 'content'       // AI 文本内容（流式）
  | 'tool_call'     // LLM 决定调用工具（流式，参数逐步累积）
  | 'tool_start'    // 工具开始执行
  | 'tool_end'      // 工具执行完成
  | 'error'         // 错误消息
  | 'done'          // 流结束
  | 'heartbeat';    // 心跳保活

/**
 * 工具调用信息
 */
export interface ToolCall {
  id: string;       // 工具调用 ID
  type: 'function';
  function: {
    name: string;       // 工具名称
    arguments: string;  // 参数 JSON 字符串
    complete?: boolean; // 参数是否完整
  };
}

/**
 * SSE 聊天事件
 */
export interface ChatEvent {
  type: ChatEventType;
  content?: string;           // AI 文本内容
  tool_call?: ToolCall;       // 工具调用信息
  tool_name?: string;         // 工具名称
  tool_output?: string;       // 工具执行结果
  tool_call_id?: string;      // 工具调用 ID
  error?: string;             // 错误信息
  session_id?: string;        // 会话 ID
  message_id?: string;        // 消息 ID
}

/**
 * 聊天会话
 */
export interface ChatSession {
  id: number;                 // 数据库自增 ID
  thread_id: string;          // LangGraph thread_id（会话唯一标识）
  user_id: string;            // 用户 ID
  project_id: string;         // GNS3 项目 ID
  title: string;              // 会话标题
  message_count: number;      // 消息数量
  llm_calls_count: number;    // LLM 调用次数
  input_tokens: number;       // 输入 token 数
  output_tokens: number;      // 输出 token 数
  total_tokens: number;       // 总 token 数
  last_message_at: string;    // 最后消息时间
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  metadata?: string;          // 元数据 JSON 字符串
  stats?: string;             // 额外统计信息 JSON 字符串
  pinned: boolean;            // 是否置顶
}

/**
 * 聊天消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;                 // 消息唯一标识
  role: MessageRole;          // 消息角色
  content: string;            // 消息内容
  created_at: string;         // 创建时间 (ISO 8601)
  tool_calls?: ToolCall[];    // 工具调用列表（assistant 消息）
  tool_call_id?: string;      // 关联的工具调用 ID（tool 消息）
  name?: string;              // 工具消息名称（tool 消息）
  metadata?: any;             // 额外消息元数据
}

/**
 * 会话历史
 */
export interface ConversationHistory {
  thread_id: string;          // 会话 ID
  title: string;              // 会话标题
  messages: ChatMessage[];    // 消息列表
  created_at?: string;        // 创建时间
  updated_at?: string;        // 更新时间
  llm_calls: number;          // LLM 调用次数
}

/**
 * 聊天请求参数
 */
export interface ChatRequest {
  message: string;            // 用户消息内容
  session_id?: string;        // 会话 ID（可选，不提供则创建新会话）
  stream?: boolean;           // 是否启用流式响应（默认 true）
  temperature?: number;       // LLM temperature 参数（预留，暂未使用）
  mode?: 'text';              // 交互模式（目前仅支持 "text"）
}

/**
 * 会话列表响应
 */
export interface SessionsListResponse {
  sessions: ChatSession[];    // 会话列表
  total: number;              // 总数
}

/**
 * 重命名会话请求
 */
export interface RenameSessionRequest {
  title: string;              // 新标题（1-255 字符）
}

/**
 * 统计信息
 */
export interface ChatStatistics {
  message_count: number;      // 消息数量
  llm_calls_count: number;    // LLM 调用次数
  input_tokens: number;       // 输入 token 数
  output_tokens: number;      // 输出 token 数
  total_tokens: number;       // 总 token 数
}

/**
 * UI 状态相关接口
 */

/**
 * 聊天面板状态
 */
export interface ChatPanelState {
  isOpen: boolean;            // 面板是否打开
  width: number;              // 面板宽度
  height: number;             // 面板高度
  position?: {                // 面板位置
    top?: number;
    left?: number;
  };
}

/**
 * 会话 UI 状态
 */
export interface SessionUIState {
  isEditing: boolean;         // 是否正在编辑标题
  isExpanded: boolean;        // 是否展开
}

/**
 * 工具调用 UI 状态
 */
export interface ToolCallUIState extends ToolCall {
  isExecuting?: boolean;      // 是否正在执行
  isExpanded?: boolean;       // 是否展开详情
  error?: string;             // 错误信息
}

/**
 * 消息 UI 状态
 */
export interface MessageUIState extends ChatMessage {
  isStreaming?: boolean;      // 是否正在流式输出
  isComplete?: boolean;       // 是否已完成
  displayContent?: string;    // 显示内容（用于流式累积）
}

/**
 * 聊天错误类型
 */
export enum ChatErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // 网络错误
  PROJECT_NOT_OPENED = 'PROJECT_NOT_OPENED', // 项目未打开
  LLM_NOT_CONFIGURED = 'LLM_NOT_CONFIGURED', // LLM 未配置
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',   // 会话不存在
  UNAUTHORIZED = 'UNAUTHORIZED',             // 未授权
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // 未知错误
}

/**
 * 聊天错误信息
 */
export interface ChatError {
  type: ChatErrorType;
  message: string;
  details?: any;
}
