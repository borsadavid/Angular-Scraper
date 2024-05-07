// Import the necessary modules and dependencies
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    this.socket$ = webSocket('ws://127.0.0.1:9001');
  }

  connect(): WebSocketSubject<any> {
    return this.socket$;
  }

  sendMessage(message: string): void {
    this.socket$.next(message);
  }

  close(): void {
    this.socket$.complete();
  }
}
