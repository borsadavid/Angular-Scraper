import { Component, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../websocket-service/websocket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

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
  branches: { [key: string]: { messages: string[], expanded: boolean } } = {};
  private socketSubscription: Subscription | undefined;
  searchQuery: string = '';
  filteredBranches: { key: string, value: { messages: string[], expanded: boolean } }[] = [];
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport | undefined;

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
      let domain = '';
      try {
        const url = new URL(message);
        domain = url.hostname;
      } catch (error) {
        console.error('Invalid URL:', error);
      }

      if (!this.branches[domain]) {
        this.branches[domain] = { messages: [message], expanded: false };
      } else {
        if (!this.branches[domain].messages.includes(message)) {
          this.branches[domain].messages.push(message);
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

  toggleBranch(branch: { key: string, value: { messages: string[], expanded: boolean } }): void {
    branch.value.expanded = !branch.value.expanded;
  }

}
