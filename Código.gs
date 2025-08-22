/**
 * Cria um menu para abrir o nosso novo editor.
 */
function onOpen() {
  DocumentApp.getUi()
      .createMenu('Editor Avançado')
      .addItem('Abrir Editor', 'abrirEditor')
      .addToUi();
}

/**
 * Função que abre a nossa página HTML como um diálogo modal.
 */
function abrirEditor() {
  const html = HtmlService.createHtmlOutputFromFile('Editor.html')
      .setWidth(1000)
      .setHeight(700);
  DocumentApp.getUi().showModalDialog(html, 'Editor de Documentos');
}

/**
 * [BACK-END] Fornece os dados iniciais para a interface do editor.
 * Esta função é chamada uma única vez quando o editor é aberto.
 * @returns {Array<Object>} Uma lista de modelos com nome e conteúdo HTML.
 */
function getModelsForEditor() {
  // No mundo real, estes dados viriam do seu PropertiesService,
  // de uma planilha ou de onde quer que você os armazene.
  // Aqui, estamos simulando para o exemplo.
  return [
    {
      name: "Despacho Padrão",
      content: "<p>Vistos, etc.</p><p><strong>Intime-se</strong> a parte autora para que se manifeste no prazo de 5 (cinco) dias.</p><p>Após, conclusos.</p>"
    },
    {
      name: "Abertura de Incidente",
      content: "<p>Considerando a petição de ID XXXXX, determino a instauração do <em>Incidente de Desconsideração da Personalidade Jurídica</em>.</p>"
    },
    {
      name: "Lista de Tarefas",
      content: "<ul><li>Verificar depósitos judiciais.</li><li>Expedir alvará.</li><li>Arquivar os autos.</li></ul>"
    }
  ];
}


/**
 * [BACK-END] Recebe o conteúdo HTML do editor e o insere no documento ativo,
 * recriando a formatação com os métodos do DocumentApp.
 * @param {string} html O conteúdo HTML vindo do editor Quill.js.
 */
function insertHtmlContent(html) {
  try {
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    
    // O XmlService é a ferramenta do Apps Script para parsear HTML/XML
    const parsed = XmlService.parse(`<root>${html}</root>`);
    const root = parsed.getRootElement();
    const elements = root.getChildren();

    elements.forEach(element => {
      parseAndAppendElement(body, element);
    });

  } catch (e) {
    Logger.log("Erro ao inserir HTML: " + e.toString());
    // Lança um novo erro para que a mensagem chegue ao withFailureHandler no cliente
    throw new Error("Ocorreu um erro ao processar o conteúdo. Verifique os logs para detalhes.");
  }
}

/**
 * Função auxiliar recursiva para processar cada elemento HTML.
 * Este é um parser simplificado que lida com tags comuns.
 * @param {GoogleAppsScript.Document.Body | GoogleAppsScript.Document.ListItem} parent O elemento do Google Doc onde o conteúdo será inserido.
 * @param {GoogleAppsScript.XML_Service.Element} element O elemento XML/HTML a ser processado.
 */
function parseAndAppendElement(parent, element) {
  const type = element.getName().toLowerCase();
  
  switch (type) {
    case 'p':
      const p = parent.appendParagraph('');
      processParagraphContent(p, element.getNodes());
      break;
      
    case 'ul':
    case 'ol':
      // Para cada <li> dentro da lista, cria um novo item de lista
      element.getChildren('li').forEach(liElement => {
        const textContent = liElement.getText();
        const listItem = parent.appendListItem(textContent);
        
        // Se for uma lista ordenada (ol), define o marcador como número
        if (type === 'ol') {
          listItem.setGlyphType(DocumentApp.GlyphType.NUMBER);
        }
      });
      break;

    default:
      // Ignora outras tags ou as trata como texto simples
      const text = element.getText();
      if (text.trim() !== "") {
        parent.appendParagraph(text);
      }
      break;
  }
}

/**
 * Processa o conteúdo de um parágrafo, aplicando formatação de negrito/itálico.
 * @param {GoogleAppsScript.Document.Paragraph} paragraph O parágrafo do Google Doc.
 * @param {Array<GoogleAppsScript.XML_Service.Node>} nodes Os nós filhos do elemento <p>.
 */
function processParagraphContent(paragraph, nodes) {
  nodes.forEach(node => {
    if (node.asType() === XmlService.NodeType.TEXT) {
      paragraph.appendText(node.asText().getText());
    } else if (node.asType() === XmlService.NodeType.ELEMENT) {
      const childElement = node.asElement();
      const tagName = childElement.getName().toLowerCase();
      const text = childElement.getText();
      const textElement = paragraph.appendText(text);
      
      // Aplica a formatação
      if (tagName === 'strong' || tagName === 'b') {
        textElement.setBold(true);
      }
      if (tagName === 'em' || tagName === 'i') {
        textElement.setItalic(true);
      }
      if (tagName === 'u') {
        textElement.setUnderline(true);
      }
    }
  });
}
