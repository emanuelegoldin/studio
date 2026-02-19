export interface WSMessage {
    type: 'thread-message';
    body?: Record<string, any>;
}