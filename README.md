# Dashboard Financeiro 💰

Um sistema completo de gestão financeira pessoal desenvolvido em Angular 19 com TailwindCSS. O projeto oferece uma interface moderna e intuitiva para controle de finanças pessoais.

## 🚀 Funcionalidades

- **Dashboard Interativo**: Visualização de gastos e receitas com gráficos dinâmicos
- **Gestão de Transações**: Adicionar, editar e categorizar receitas e despesas
- **Relatórios em PDF**: Exportação de relatórios financeiros detalhados
- **Categorização**: Organização por categorias personalizáveis
- **Análise Temporal**: Navegação entre diferentes períodos (meses/anos)
- **Interface Responsiva**: Design adaptável para todos os dispositivos

## 🛠️ Tecnologias Utilizadas

- **Angular 19**: Framework principal
- **TailwindCSS**: Estilização e design responsivo
- **Chart.js**: Gráficos interativos
- **jsPDF**: Geração de relatórios em PDF
- **TypeScript**: Linguagem de programação
- **RxJS**: Programação reativa

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.1.

## 📦 Instalação e Configuração

1. **Clone o repositório**:
```bash
git clone https://github.com/seu-usuario/dashboard-financeiro.git
cd dashboard-financeiro
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Execute o projeto**:
```bash
ng serve
```

4. **Acesse a aplicação**:
Abra seu navegador e vá para `http://localhost:4200/`

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Dashboard principal
│   │   └── navbar-principal/   # Navegação
│   ├── pages/
│   │   ├── categorias/         # Gestão de categorias
│   │   ├── relatorios/         # Relatórios e exportação PDF
│   │   └── transacoes/         # Gestão de transações
│   └── service/
│       └── transacoes.service.ts # Serviço de transações
```

## 🎯 Como Usar

1. **Dashboard**: Visualize um resumo das suas finanças com gráficos
2. **Transações**: Adicione receitas e despesas categorizadas
3. **Relatórios**: Exporte relatórios detalhados em PDF
4. **Navegação Temporal**: Use os controles para ver dados de diferentes períodos

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
