type JoinThreadWSMessage = {
  type: 'join-thread';
  body: {
    threadId: string;
  };
};

type ThreadRefreshMessage = {
  type: 'thread-refresh';
  body: {
    threadId: string;
  };
};

/**
 * Card-level real-time messages.
 * Room key = teamId — every viewer of any card in the team shares the room.
 */

type JoinCardRoomMessage = {
  type: 'join-card-room';
  body: {
    teamId: string;
  };
};

type CardRefreshMessage = {
  type: 'card-refresh';
  body: {
    teamId: string;
  };
};