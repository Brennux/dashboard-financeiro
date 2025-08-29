export interface ITransacaoRequest {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  tipo: 'entrada' | 'saida';
  data: Date;
}