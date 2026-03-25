/**
 * AI Chat data models and interface definitions
 * Based on GNS3 Copilot Chat API design document
 */

/**
 * SSE event types
 */
export type ChatEventType =
  | 'content'       // AI text content (streaming)
  | 'tool_call'    // LLM decides to call tool (streaming, parameters accumulate gradually)
  | 'tool_start'   // Tool starts executing
  | 'tool_end'     // Tool execution completed
  | 'error'        // Error message
  | 'done'         // Stream ended
  | 'heartbeat';   // Heartbeat keep-alive

/**
 * Tool call information
 */
export interface ToolCall {
  id: string;       // Tool call ID
  type: 'function';
  function: {
    name: string;       // Tool name
    arguments: string | Record<string, any>;  // Arguments JSON string or object
    complete?: boolean; // Whether arguments are complete
  };
}

/**
 * SSE chat event
 */
export interface ChatEvent {
  type: ChatEventType;
  content?: string;           // AI text content
  tool_call?: ToolCall;       // Tool call information
  tool_name?: string;         // Tool name
  tool_output?: string;       // Tool execution result
  tool_call_id?: string;      // Tool call ID
  error?: string;             // Error message
  session_id?: string;        // Session ID
  message_id?: string;        // Message ID
}

/**
 * Chat session
 */
export interface ChatSession {
  id: number;                 // Database auto-increment ID
  thread_id: string;          // LangGraph thread_id (session unique identifier)
  user_id: string;            // User ID
  project_id: string;         // GNS3 project ID
  title: string;              // Session title
  message_count: number;      // Message count
  llm_calls_count: number;   // LLM call count
  input_tokens: number;      // Input token count
  output_tokens: number;      // Output token count
  total_tokens: number;       // Total token count
  last_message_at: string;    // Last message time
  created_at: string;         // Creation time
  updated_at: string;         // Update time
  metadata?: string;          // Metadata JSON string
  stats?: string;             // Additional statistics JSON string
  pinned: boolean;            // Whether pinned
}

/**
 * Chat message role
 * Enhanced message types with support for tool calls and results
 */
export type MessageRole =
  | 'user'          // User message
  | 'assistant'     // AI assistant message
  | 'system'        // System message
  | 'tool'          // Tool execution result (legacy, kept for compatibility)
  | 'tool_call'     // Tool call request (contains function name and parameters)
  | 'tool_result';  // Tool execution result (contains output data)

/**
 * Chat message
 * Enhanced message interface with support for tool calls and results display
 */
/**
 * Tool result item (for assistant message)
 */
export interface ToolResult {
  toolName: string;
  toolOutput: string;
  tool_call_id?: string;
}

export interface ChatMessage {
  id: string;                 // Message unique identifier
  role: MessageRole;          // Message role
  content: string;            // Message content
  created_at: string;         // Creation time (ISO 8601)
  tool_calls?: ToolCall[];    // Tool call list (assistant message)
  tool_result?: ToolResult[]; // Tool result list (assistant message)
  tool_call_id?: string;      // Associated tool call ID (tool/tool_result message)
  name?: string;              // Tool message name (tool/tool_result message)
  metadata?: any;             // Additional message metadata

  // Legacy fields (for tool role message)
  toolCall?: ToolCall;        // Single tool call (tool_call message)
  toolName?: string;          // Tool name (tool_result message)
  toolOutput?: any;           // Tool output (tool_result message, can be JSON object or string)
}

/**
 * Conversation history
 */
export interface ConversationHistory {
  thread_id: string;          // Session ID
  title: string;              // Session title
  messages: ChatMessage[];    // Message list
  created_at?: string;        // Creation time
  updated_at?: string;        // Update time
  llm_calls: number;          // LLM call count
}

/**
 * Chat request parameters
 */
export interface ChatRequest {
  message: string;            // User message content
  session_id?: string;        // Session ID (optional, creates new session if not provided)
  stream?: boolean;           // Whether to enable streaming response (default true)
  temperature?: number;       // LLM temperature parameter (reserved, not yet used)
  mode?: 'text';              // Interaction mode (currently only supports "text")
}

/**
 * Session list response
 */
export interface SessionsListResponse {
  sessions: ChatSession[];    // Session list
  total: number;              // Total count
}

/**
 * Rename session request
 */
export interface RenameSessionRequest {
  title: string;              // New title (1-255 characters)
}

/**
 * Statistics information
 */
export interface ChatStatistics {
  message_count: number;      // Message count
  llm_calls_count: number;    // LLM call count
  input_tokens: number;       // Input token count
  output_tokens: number;      // Output token count
  total_tokens: number;        // Total token count
}

/**
 * UI state related interfaces
 */

/**
 * Chat panel state
 */
export interface ChatPanelState {
  isOpen: boolean;            // Whether panel is open
  width: number;              // Panel width
  height: number;             // Panel height
  isMaximized?: boolean;      // Whether maximized
  isMinimized?: boolean;      // Whether minimized
  position?: {                // Panel position
    top?: number;
    right?: number;
    left?: number;
  };
}

/**
 * Session UI state
 */
export interface SessionUIState {
  isEditing: boolean;         // Whether editing title
  isExpanded: boolean;         // Whether expanded
}

/**
 * Tool call UI state
 */
export interface ToolCallUIState extends ToolCall {
  isExecuting?: boolean;      // Whether executing
  isExpanded?: boolean;       // Whether expanded for details
  error?: string;             // Error message
}

/**
 * Message UI state
 */
export interface MessageUIState extends ChatMessage {
  isStreaming?: boolean;      // Whether streaming output
  isComplete?: boolean;       // Whether completed
  displayContent?: string;     // Display content (for streaming accumulation)
}

/**
 * Chat error types
 */
export enum ChatErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Network error
  PROJECT_NOT_OPENED = 'PROJECT_NOT_OPENED', // Project not opened
  LLM_NOT_CONFIGURED = 'LLM_NOT_CONFIGURED', // LLM not configured
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',   // Session not found
  UNAUTHORIZED = 'UNAUTHORIZED',             // Unauthorized
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // Unknown error
}

/**
 * Chat error information
 */
export interface ChatError {
  type: ChatErrorType;
  message: string;
  details?: any;
}
