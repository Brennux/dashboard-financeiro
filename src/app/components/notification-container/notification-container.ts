import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../service/notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-notification-container',
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <div *ngFor="let notification of notifications" 
           [class]="getNotificationClasses(notification)"
           class="p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
        
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center">
            <i [class]="getIconClass(notification.type)" class="mr-2"></i>
            <h4 class="font-semibold text-sm">{{ notification.title }}</h4>
          </div>
          <button (click)="removeNotification(notification.id)"
                  class="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
        
        <!-- Message -->
        <div class="mt-2">
          <p class="text-sm opacity-90 whitespace-pre-line">{{ notification.message }}</p>
        </div>
        
        <!-- Timestamp -->
        <div class="mt-2 text-xs opacity-75">
          {{ formatTime(notification.timestamp) }}
        </div>
        
        <!-- Progress bar for timed notifications -->
        <div *ngIf="!notification.persistent && notification.duration" 
             class="mt-2 h-1 bg-black bg-opacity-20 rounded-full overflow-hidden">
          <div class="h-full bg-white bg-opacity-40 rounded-full animate-shrink"
               [style.animation-duration]="notification.duration + 'ms'"></div>
        </div>
      </div>
    </div>

    <!-- No notifications placeholder -->
    <div *ngIf="notifications.length === 0" class="hidden"></div>
  `,
    styles: [`
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    
    .animate-shrink {
      animation: shrink linear forwards;
    }
    
    .notification-enter {
      opacity: 0;
      transform: translateX(100%);
    }
    
    .notification-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 0.3s ease-in-out;
    }
    
    .notification-leave {
      opacity: 1;
      transform: translateX(0);
    }
    
    .notification-leave-active {
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
    }
  `]
})
export class NotificationContainer implements OnInit, OnDestroy {
    notifications: Notification[] = [];
    private subscription!: Subscription;

    constructor(private notificationService: NotificationService) { }

    ngOnInit(): void {
        this.subscription = this.notificationService.notifications$.subscribe(
            notifications => {
                this.notifications = notifications;
            }
        );
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    removeNotification(id: string): void {
        this.notificationService.removeNotification(id);
    }

    getNotificationClasses(notification: Notification): string {
        const baseClasses = 'border-l-4 backdrop-blur-sm';

        switch (notification.type) {
            case 'success':
                return `${baseClasses} bg-green-50 border-green-500 text-green-800`;
            case 'error':
                return `${baseClasses} bg-red-50 border-red-500 text-red-800`;
            case 'warning':
                return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-800`;
            case 'info':
                return `${baseClasses} bg-blue-50 border-blue-500 text-blue-800`;
            default:
                return `${baseClasses} bg-gray-50 border-gray-500 text-gray-800`;
        }
    }

    getIconClass(type: Notification['type']): string {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle text-green-600';
            case 'error':
                return 'fas fa-exclamation-circle text-red-600';
            case 'warning':
                return 'fas fa-exclamation-triangle text-yellow-600';
            case 'info':
                return 'fas fa-info-circle text-blue-600';
            default:
                return 'fas fa-bell text-gray-600';
        }
    }

    formatTime(timestamp: Date): string {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) {
            return 'agora';
        } else if (minutes < 60) {
            return `${minutes}m atrás`;
        } else if (hours < 24) {
            return `${hours}h atrás`;
        } else {
            return timestamp.toLocaleDateString('pt-BR');
        }
    }
}
