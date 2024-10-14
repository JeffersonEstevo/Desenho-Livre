// Aguarda o carregamento completo do DOM antes de executar o código
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o canvas de desenho e seu contexto 2D
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Seleciona elementos da interface do usuário (cor, tamanho do pincel, botões, etc.)
    const colorPicker = document.getElementById('color');
    const sizePicker = document.getElementById('size');
    const eraseButton = document.getElementById('erase');
    const undoButton = document.getElementById('undo');
    const resizeButton = document.getElementById('resizeCanvas');
    const canvasWidthInput = document.getElementById('canvasWidth');
    const canvasHeightInput = document.getElementById('canvasHeight');
    const textColorPicker = document.getElementById('textColor');
    const fontSizeInput = document.getElementById('fontSize');
    const addTextButton = document.getElementById('addText');
    const deleteTextButton = document.getElementById('deleteText');
    const selectModeButton = document.getElementById('selectModeButton');
    const brushSizeDisplay = document.getElementById('brushSizeDisplay');
    const savePdfButton = document.getElementById('savePdf');

    // Variáveis de estado
    let drawing = false; // Indica se está desenhando
    let erasing = false; // Indica se está usando a borracha
    let lastX = 0; // Última coordenada X do mouse
    let lastY = 0; // Última coordenada Y do mouse
    let paths = []; // Armazena os estados anteriores do canvas para desfazer
    let textBoxes = []; // Armazena caixas de texto criadas
    let selectedTextBox = null; // Caixa de texto atualmente selecionada
    let selectMode = false; // Indica se está em modo de seleção

    // Define o tamanho do canvas para A4 em pixels (72 DPI)
    const A4_WIDTH = 595; // Largura do A4
    const A4_HEIGHT = 842; // Altura do A4
    canvas.width = A4_WIDTH; // Define a largura do canvas
    canvas.height = A4_HEIGHT; // Define a altura do canvas

    // Salva o estado atual do canvas para o array de caminhos
    function saveState() {
        paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // Armazena a imagem do canvas
    }

    // Adiciona um ouvinte de evento para o mouse
    canvas.addEventListener('mousedown', (e) => {
        if (selectMode) return; // Se estiver em modo de seleção, não inicia o desenho
        drawing = true; // Ativa o modo de desenho
        [lastX, lastY] = [e.offsetX, e.offsetY]; // Armazena a posição inicial do mouse
        saveState(); // Salva o estado atual do canvas
    });

    // Adiciona um ouvinte para o evento de soltar o botão do mouse
    canvas.addEventListener('mouseup', () => {
        drawing = false; // Desativa o modo de desenho
        ctx.beginPath(); // Começa um novo caminho para o desenho
    });

    // Adiciona um ouvinte para o movimento do mouse no canvas
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return; // Se não estiver desenhando, sai da função

        // Usa a borracha para limpar partes do canvas
        if (erasing) {
            ctx.clearRect(e.offsetX, e.offsetY, parseInt(sizePicker.value), parseInt(sizePicker.value));
        } else {
            // Configura o estilo do desenho
            ctx.strokeStyle = colorPicker.value; // Define a cor do traço
            ctx.lineWidth = parseInt(sizePicker.value); // Define a largura do traço
            ctx.lineJoin = 'round'; // Define a junção das linhas
            ctx.lineCap = 'round'; // Define a ponta das linhas

            ctx.beginPath(); // Começa um novo caminho
            ctx.moveTo(lastX, lastY); // Move para a última posição do mouse
            ctx.lineTo(e.offsetX, e.offsetY); // Desenha uma linha até a nova posição
            ctx.stroke(); // Aplica o traço
            [lastX, lastY] = [e.offsetX, e.offsetY]; // Atualiza a posição do mouse
        }
    });

    // Atualiza o tamanho do pincel com base no seletor
    function updateBrushSize() {
        const size = parseInt(sizePicker.value); // Obtém o valor do seletor de tamanho
        ctx.lineWidth = size; // Define a largura do traço
        brushSizeDisplay.textContent = `Tamanho do Pincel: ${size}`; // Atualiza o texto exibido
    }

    // Adiciona um ouvinte de evento para alterações no seletor de tamanho do pincel
    sizePicker.addEventListener('input', updateBrushSize);
    updateBrushSize(); // Inicializa o tamanho do pincel na carga da página

    // Adiciona um ouvinte de evento para o botão da borracha
    eraseButton.addEventListener('click', () => {
        erasing = !erasing; // Alterna o estado de uso da borracha
        eraseButton.classList.toggle('erase-active', erasing); // Adiciona/remover classe para indicar o modo
        eraseButton.textContent = erasing ? 'Modo Desenho' : 'Borracha'; // Atualiza o texto do botão
    });

    // Adiciona um ouvinte para o botão de adicionar texto
    addTextButton.addEventListener('click', () => {
        createTextBox('Digite aqui'); // Cria uma nova caixa de texto
    });

    // Função para criar uma nova caixa de texto
    function createTextBox(initialText) {
        const textBox = document.createElement('div'); // Cria um novo elemento div
        textBox.className = 'text-box'; // Define a classe da div
        textBox.contentEditable = true; // Torna a div editável
        textBox.style.color = textColorPicker.value; // Define a cor do texto
        textBox.style.fontSize = `${fontSizeInput.value}px`; // Define o tamanho da fonte
        textBox.style.position = 'absolute'; // Posiciona a div de forma absoluta
        textBox.style.left = '100px'; // Define a posição inicial à esquerda
        textBox.style.top = '100px'; // Define a posição inicial no topo
        textBox.innerText = initialText; // Define o texto inicial

        document.body.appendChild(textBox); // Adiciona a nova div ao corpo do documento

        // Adiciona um ouvinte para o mouse na caixa de texto
        textBox.onmousedown = (e) => {
            if (!selectMode) return; // Se não estiver em modo de seleção, sai da função
            selectedTextBox = textBox; // Marca a caixa de texto como selecionada
            textBox.classList.add('selected-border'); // Adiciona uma borda ao redor da caixa
            e.stopPropagation(); // Impede que o evento se propague

            // Armazena a posição do mouse em relação à caixa de texto
            let offsetX = e.clientX - textBox.getBoundingClientRect().left;
            let offsetY = e.clientY - textBox.getBoundingClientRect().top;

            // Função para mover a caixa de texto
            const moveTextBox = (moveEvent) => {
                textBox.style.left = `${moveEvent.clientX - offsetX}px`; // Atualiza a posição à esquerda
                textBox.style.top = `${moveEvent.clientY - offsetY}px`; // Atualiza a posição no topo
            };

            // Função para parar de mover a caixa de texto
            const stopMoveTextBox = () => {
                drawTextOnCanvas(textBox); // Desenha o texto no canvas
                textBox.style.display = 'none'; // Esconde a caixa de texto
                textBox.classList.remove('selected-border'); // Remove a borda
                document.removeEventListener('mousemove', moveTextBox); // Remove o ouvinte de movimento do mouse
                document.removeEventListener('mouseup', stopMoveTextBox); // Remove o ouvinte de soltar o mouse
            };

            // Adiciona ouvintes para mover e parar o movimento da caixa de texto
            document.addEventListener('mousemove', moveTextBox);
            document.addEventListener('mouseup', stopMoveTextBox);
        };

        textBoxes.push(textBox); // Adiciona a nova caixa de texto ao array
    }

    // Função para desenhar texto no canvas
    function drawTextOnCanvas(textBox) {
        const rect = textBox.getBoundingClientRect(); // Obtém a posição da caixa de texto
        ctx.font = `${textBox.style.fontSize} ${getComputedStyle(textBox).fontFamily}`; // Define a fonte
        ctx.fillStyle = textBox.style.color; // Define a cor do texto
        ctx.fillText(textBox.innerText, rect.left - canvas.offsetLeft, rect.top - canvas.offsetTop + parseInt(textBox.style.fontSize)); // Desenha o texto no canvas
    }

    // Adiciona um ouvinte para o botão de modo de seleção
    selectModeButton.addEventListener('click', () => {
        selectMode = !selectMode; // Alterna o modo de seleção
        selectModeButton.textContent = selectMode ? 'Modo Desenho' : 'Selecionar'; // Atualiza o texto do botão
        
        if (!selectMode && selectedTextBox) {
            selectedTextBox.classList.remove('selected-border'); // Remove a borda da caixa de texto selecionada
            selectedTextBox = null; // Reseta a seleção
        }
    });

    // Adiciona um ouvinte para o botão de deletar texto
    deleteTextButton.addEventListener('click', () => {
        if (selectedTextBox) {
            selectedTextBox.remove(); // Remove a caixa de texto selecionada
            textBoxes = textBoxes.filter(tb => tb !== selectedTextBox); // Filtra a caixa de texto removida
            selectedTextBox = null; // Reseta a seleção
        }
    });

    // Adiciona um ouvinte para o botão de desfazer
    undoButton.addEventListener('click', () => {
        if (paths.length > 0) {
            ctx.putImageData(paths.pop(), 0, 0); // Restaura a última imagem do array
        }
    });

    // Adiciona um ouvinte para o botão de redimensionar o canvas
    resizeButton.addEventListener('click', () => {
        const newWidth = parseInt(canvasWidthInput.value); // Obtém a nova largura
        const newHeight = parseInt(canvasHeightInput.value); // Obtém a nova altura
        const tempCanvas = document.createElement('canvas'); // Cria um canvas temporário
        const tempCtx = tempCanvas.getContext('2d'); // Obtém o contexto do canvas temporário

        tempCanvas.width = newWidth; // Define a largura do canvas temporário
        tempCanvas.height = newHeight; // Define a altura do canvas temporário
        tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight); // Desenha a imagem do canvas original no canvas temporário
        
        canvas.width = newWidth; // Redimensiona o canvas original
        canvas.height = newHeight; // Redimensiona o canvas original
        ctx.drawImage(tempCanvas, 0, 0); // Desenha a imagem do canvas temporário no canvas redimensionado
    });

    // Adiciona um ouvinte para eventos de tecla
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            undoButton.click(); // Desfaz a última ação ao pressionar Ctrl + Z
        }
    });

    // Adiciona um ouvinte para o botão de salvar como PDF
    savePdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf; // Desestrutura a biblioteca jsPDF do objeto global
        const pdf = new jsPDF('p', 'pt', 'a4'); // Cria uma nova instância de jsPDF para um PDF A4

        // Captura o conteúdo do canvas como uma imagem
        const canvasImage = canvas.toDataURL('image/png');

        // Adiciona a imagem ao PDF com ajustes de tamanho
        pdf.addImage(canvasImage, 'PNG', 0, 0, A4_WIDTH * 0.75, A4_HEIGHT * 0.75); // Reduz a imagem para caber na página A4
        pdf.save('drawing.pdf'); // Salva o PDF com o nome 'drawing.pdf'
    });
    
});
