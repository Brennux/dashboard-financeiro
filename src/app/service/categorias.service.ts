import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CategoriaBase {
    id: number;
    nome: string;
    icone: string;
    cor: string;
    tipo: 'receita' | 'despesa';
    ativa: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CategoriasService {
    private readonly STORAGE_KEY = 'categorias-financeiro';
    private categorias: CategoriaBase[] = [];
    private categoriasSubject = new BehaviorSubject<CategoriaBase[]>(this.categorias);
    categorias$ = this.categoriasSubject.asObservable();

    constructor() {
        this.carregarDoLocalStorage();
    }

    private carregarDoLocalStorage() {
        const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
        if (dadosSalvos) {
            try {
                this.categorias = JSON.parse(dadosSalvos);
                this.categoriasSubject.next(this.categorias);
            } catch (error) {
                console.error('Erro ao carregar categorias do localStorage:', error);
                this.inicializarCategoriasDefault();
            }
        } else {
            this.inicializarCategoriasDefault();
        }
    }

    private inicializarCategoriasDefault() {
        this.categorias = [
            { id: 1, nome: 'Alimentação', icone: 'fas fa-utensils', cor: '#EF4444', tipo: 'despesa', ativa: true },
            { id: 2, nome: 'Transporte', icone: 'fas fa-car', cor: '#3B82F6', tipo: 'despesa', ativa: true },
            { id: 3, nome: 'Lazer', icone: 'fas fa-gamepad', cor: '#8B5CF6', tipo: 'despesa', ativa: true },
            { id: 4, nome: 'Salário', icone: 'fas fa-briefcase', cor: '#10B981', tipo: 'receita', ativa: true },
            { id: 5, nome: 'Freelance', icone: 'fas fa-laptop', cor: '#F59E0B', tipo: 'receita', ativa: true },
            { id: 6, nome: 'Educação', icone: 'fas fa-graduation-cap', cor: '#06B6D4', tipo: 'despesa', ativa: false }
        ];
        this.salvarNoLocalStorage();
        this.categoriasSubject.next(this.categorias);
    }

    private salvarNoLocalStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.categorias));
    }

    adicionarCategoria(categoria: Omit<CategoriaBase, 'id'>) {
        const novaCategoria: CategoriaBase = {
            ...categoria,
            id: this.gerarNovoId(),
            ativa: true
        };
        this.categorias.push(novaCategoria);
        this.salvarNoLocalStorage();
        this.categoriasSubject.next(this.categorias);
        return novaCategoria;
    }

    editarCategoria(id: number, dadosAtualizados: Omit<CategoriaBase, 'id'>) {
        const index = this.categorias.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categorias[index] = { ...dadosAtualizados, id };
            this.salvarNoLocalStorage();
            this.categoriasSubject.next(this.categorias);
            return true;
        }
        return false;
    }

    alternarStatusCategoria(id: number) {
        const categoria = this.categorias.find(c => c.id === id);
        if (categoria) {
            categoria.ativa = !categoria.ativa;
            this.salvarNoLocalStorage();
            this.categoriasSubject.next(this.categorias);
            return true;
        }
        return false;
    }

    excluirCategoria(id: number) {
        const index = this.categorias.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categorias.splice(index, 1);
            this.salvarNoLocalStorage();
            this.categoriasSubject.next(this.categorias);
            return true;
        }
        return false;
    }

    obterCategoriasAtivas(): CategoriaBase[] {
        return this.categorias.filter(c => c.ativa);
    }

    obterNomesCategorias(): string[] {
        return this.categorias.filter(c => c.ativa).map(c => c.nome);
    }

    obterCategoriaPorNome(nome: string): CategoriaBase | undefined {
        return this.categorias.find(c => c.nome === nome);
    }

    private gerarNovoId(): number {
        return this.categorias.length > 0 ? Math.max(...this.categorias.map(c => c.id)) + 1 : 1;
    }
}
