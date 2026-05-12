import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor() {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected — socketId: ${client.id}}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected — socketId: ${client.id}`);
  }

  emit(rooms: string | string[], event: string, data: any) {
    if (rooms === '*') {
      this.server.emit(event, data);
      this.logger.debug(
        `Emitted event '${event}' to all clients with data: ${JSON.stringify(data)}`,
      );
    } else if (typeof rooms === 'string') {
      this.server.to(rooms).emit(event, data);
      this.logger.debug(
        `Emitted event '${event}' to room '${rooms}' with data: ${JSON.stringify(data)}`,
      );
    } else {
      rooms.forEach((room, idx) => {
        this.server.to(room).emit(event, data);
        this.logger.debug(
          `Emitted event '${event}' to room '${room}' with data: ${JSON.stringify(data)} (index ${idx})`,
        );
      });
    }
  }
}
