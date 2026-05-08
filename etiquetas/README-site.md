# Publicar no GitHub Pages

Esta versao funciona como site estatico. O PDF do Relatorio 5301 e lido no proprio navegador da pessoa, sem servidor e sem Python.

## Como publicar

1. Crie um repositorio no GitHub.
2. Envie os arquivos desta pasta `Etiquetas` para o repositorio.
3. No GitHub, entre em `Settings` > `Pages`.
4. Em `Build and deployment`, escolha `Deploy from a branch`.
5. Selecione a branch principal e a pasta `/root`.
6. Salve.

O GitHub vai gerar um link parecido com:

```text
https://seu-usuario.github.io/nome-do-repositorio/
```

## Arquivos essenciais para o site

- `index.html`
- `etiquetas.html`
- `etiquetas.css`
- `etiquetas.js`
- `relatorio-5301-browser.js`
- `assets/brand/kopenhagen-logo.png`
- `.nojekyll`

Os arquivos `server.js`, `package.json`, `electron/` e `scripts/` podem ficar no repositorio, mas nao sao necessarios para o GitHub Pages.

## Observacao

Para carregar o PDF direto no navegador, use Chrome, Edge ou Safari atualizado.
