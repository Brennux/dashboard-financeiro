import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    persistent?: boolean;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications: Notification[] = [];
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
        const newNotification: Notification = {
            ...notification,
            id: this.generateId(),
            timestamp: new Date(),
            duration: notification.duration || 5000
        };

        this.notifications.unshift(newNotification);
        this.notificationsSubject.next([...this.notifications]);

        // Auto remove notification after duration (if not persistent)
        if (!notification.persistent && newNotification.duration) {
            setTimeout(() => {
                this.removeNotification(newNotification.id);
            }, newNotification.duration);
        }
    }

    success(title: string, message: string, duration?: number): void {
        this.addNotification({
            type: 'success',
            title,
            message,
            duration
        });
    }

    error(title: string, message: string, persistent?: boolean): void {
        this.addNotification({
            type: 'error',
            title,
            message,
            persistent,
            duration: persistent ? undefined : 8000
        });
    }

    warning(title: string, message: string, duration?: number): void {
        this.addNotification({
            type: 'warning',
            title,
            message,
            duration: duration || 6000
        });
    }

    info(title: string, message: string, duration?: number): void {
        this.addNotification({
            type: 'info',
            title,
            message,
            duration
        });
    }

    removeNotification(id: string): void {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notificationsSubject.next([...this.notifications]);
    }

    removeAll(): void {
        this.notifications = [];
        this.notificationsSubject.next([]);
    }

    // Métodos específicos para operações financeiras
    transacaoAdicionada(descricao: string, valor: number): void {
        const tipo = valor > 0 ? 'receita' : 'despesa';
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Math.abs(valor));

        this.success(
            'Transação Adicionada',
            `${tipo === 'receita' ? '💰' : '💸'} ${descricao} - ${valorFormatado}`
        );
    }

    transacaoEditada(descricao: string): void {
        this.success(
            'Transação Atualizada',
            `✏️ ${descricao} foi atualizada com sucesso`
        );
    }

    transacaoExcluida(descricao: string): void {
        this.warning(
            'Transação Excluída',
            `🗑️ ${descricao} foi removida`,
            4000
        );
    }

    categoriaAdicionada(nome: string): void {
        this.success(
            'Categoria Criada',
            `🏷️ Categoria "${nome}" criada com sucesso`
        );
    }

    categoriaEditada(nome: string): void {
        this.success(
            'Categoria Atualizada',
            `✏️ Categoria "${nome}" foi atualizada`
        );
    }

    categoriaExcluida(nome: string): void {
        this.warning(
            'Categoria Excluída',
            `🗑️ Categoria "${nome}" foi removida`,
            4000
        );
    }

    erroValidacao(titulo: string, erros: string[]): void {
        this.error(
            titulo,
            erros.join('\n'),
            true
        );
    }

    backupCriado(): void {
        this.success(
            'Backup Criado',
            '💾 Seus dados foram salvos com sucesso'
        );
    }

    dadosImportados(quantidade: number): void {
        this.success(
            'Dados Importados',
            `📥 ${quantidade} transação(ões) importada(s) com sucesso`
        );
    }
}
