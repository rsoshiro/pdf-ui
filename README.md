# Visualizador de PDF da Via Sacra - Paróquia Mãe da Divina Providência

Interface web responsiva e mobile-first para visualizar o PDF "Via Sacra" da Paróquia Mãe da Divina Providência. A interface foi projetada para facilitar a navegação pelo documento, especialmente em dispositivos móveis.

## Funcionalidades

- Interface responsiva e mobile-first otimizada para uso em smartphones
- Navegação simplificada com indicador da seção atual
- Dropdown rápido para navegar entre seções
- Menu lateral com índice completo das estações
- Botão flutuante com indicador de progresso na seção atual
- Controles de zoom para ajustar o tamanho da visualização
- Navegação por toque (swipe) para avançar/voltar páginas
- Indicador visual da seção atual em que o usuário se encontra
- Navegação por teclado (setas direita/esquerda e ESC)
- Design personalizado com a identidade visual da paróquia

## Tecnologias utilizadas

- HTML5
- CSS3 (com variáveis CSS para fácil personalização)
- JavaScript (ES6+)
- PDF.js para renderização do PDF
- Font Awesome para ícones

## Como usar

1. Clone ou baixe este repositório
2. Coloque o arquivo do logo da paróquia em `img/logo.png`
3. Abra o arquivo `index.html` em seu navegador
4. Alternativamente, hospede os arquivos em qualquer serviço de hospedagem estática, como GitHub Pages

## Funcionalidades de navegação

- **Indicador de seção atual**: Mostra na parte superior qual estação da Via Sacra você está visualizando
- **Dropdown de navegação rápida**: Toque no nome da seção atual para abrir um menu de navegação rápida
- **Menu completo**: Acesse o menu completo tocando no ícone de menu (☰) no cabeçalho
- **Botão flutuante com progresso**: O botão do livro no canto inferior direito mostra seu progresso na seção atual e revela o nome da seção ao passar o mouse ou tocar
- **Navegação por swipe**: Deslize para esquerda/direita para avançar/voltar páginas
- **Controles de zoom**: Aumente ou diminua o tamanho da visualização conforme sua preferência
- **Navegação por teclado**: 
  - Setas ← → para navegar entre páginas
  - ESC para fechar menus abertos
- **Destaque visual**: A seção atual é destacada nos menus de navegação

## Hospedagem com GitHub Pages

Para hospedar este projeto usando GitHub Pages:

1. Crie um repositório no GitHub
2. Envie todos os arquivos deste projeto para o repositório
3. Acesse as configurações do repositório
4. Na seção "GitHub Pages", selecione a branch principal como fonte
5. O site estará disponível em `https://[seu-usuario].github.io/[nome-do-repositório]/`

## Estrutura do projeto

```
pdf-ui/
├── index.html         # Arquivo HTML principal
├── css/
│   └── styles.css     # Estilos CSS
├── js/
│   └── script.js      # Código JavaScript
├── img/
│   └── logo.png       # Logo da Paróquia
└── README.md          # Este arquivo
```

## Personalização

Para personalizar a aparência da interface, edite as variáveis CSS no início do arquivo `styles.css`:

```css
:root {
    --primary-color: #008080;
    --secondary-color: #00a0a0;
    --text-color: #333;
    --background-color: #f8f9fa;
    --nav-background: #fff;
    --border-color: #dee2e6;
    --shadow-color: rgba(0, 0, 0, 0.1);
    --active-color: #006666;
    --transition-speed: 0.3s;
    --floating-btn-color: #008080;
    --floating-btn-shadow: 0 2px 10px rgba(0, 128, 128, 0.4);
    --title-text-color: #4a4a4a;
    --light-gray: #e9ecef;
}
``` 