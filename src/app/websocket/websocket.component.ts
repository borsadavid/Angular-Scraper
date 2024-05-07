import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../websocket-service/websocket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-websocket',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './websocket.component.html',
  styleUrls: ['./websocket.component.scss']
})
export class WebsocketComponent implements OnDestroy {
  message: string = '';
  receivedMessages: string[] = [];
  branches: { [key: string]: string[] } = {};
  private socketSubscription: Subscription | undefined;
  searchQuery: string = '';
  filteredBranches: { key: string, value: string[] }[] = [];

  constructor(private websocketService: WebsocketService, private cdr: ChangeDetectorRef) {
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  connectWebSocket(): void {
    this.socketSubscription = this.websocketService.connect().subscribe(
      (message: any) => {
        console.log(message);
        this.receivedMessages.push(message.childLink);
        this.createBranches(this.receivedMessages);
        this.filterBranches();
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.error('WebSocket error:', error);
        this.disconnectWebSocket();
        this.connectWebSocket();
      }
    );
  }

  createBranches(receivedMessages: string[]): void {
    for (const message of receivedMessages) {
      let path = message;

      try {
        const url = new URL(message);
        path = url.pathname;
      } catch (error) {
        console.error('Invalid URL:', error);
      }

      const segments = path.split('/').filter(Boolean);
      let currentPath = '';

      for (const segment of segments) {
        currentPath += `/${segment}`;

        if (!this.branches[currentPath]) {
          this.branches[currentPath] = [message];
        } else {
          if (!this.branches[currentPath].includes(message)) {
            this.branches[currentPath].push(message);
          }
        }
      }
    }
  }

  filterBranches() {
    this.filteredBranches = Object.keys(this.branches)
      .filter(key => key.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .map(key => ({ key: key, value: this.branches[key] }));
  }

  disconnectWebSocket(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.websocketService.close();
  }

  sendMessage(): void {
    this.websocketService.sendMessage(this.message);
  }
}
