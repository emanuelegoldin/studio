type JoinThreadWSMessage = {
  type: 'join-thread';
  body: {
    threadId: string;
  };
};

type ThreadMessageWSMessage = {
  type: 'thread-message';
  body: {
    threadId: string;
    username: string;
    content: string;
  };
};

type ThreadMessageBroadcast = {
  username: string;
  content: string;
};