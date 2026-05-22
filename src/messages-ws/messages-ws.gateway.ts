import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // decorator
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService
  ) { }

  handleDisconnect(client: Socket) {
    // console.log('client connected: ', client.id);
    this.messagesWsService.removeClient(client.id);

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleConnection(client: Socket) {
    // console.log('client desconnected: ', client.id);

    this.messagesWsService.registerClient(client);

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }
}
