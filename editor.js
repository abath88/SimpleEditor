function Editor(settings) {
    let editor = settings.editor
    let placeholderTag = null
    let cursor = { el: null, offset: 0 }

/*   
    {
        editor.setAttribute('contenteditable', 'true');
        editor.innerHTML = '';
        placeholderTag = document.createElement('span');
        placeholderTag.textContent = settings.placeholder;
        editor.appendChild(placeholderTag);
    }
*/
    {   
        /* SETUP TOOLBAR */

        let fontSize = document.getElementById('font-size')
        fontSize.value = 16

        fontSize.addEventListener('input', (e) => {
            editor.focus()
            let range = new Range()
            range.setStart(cursor.el, cursor.offset);

            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range)

            if(cursor.el.nodeName == '#text'){
                cursor.el.parentElement.style.fontSize = `${e.target.value}px`
            }else {
                cursor.el.style.fontSize = `${e.target.value}px`;
            }
        })

        let fonts = [
          'Calibri',
          'Bebas Neue',
          'DejaVu Serif',
          'Impact',
          'Segoe Script',
          'Comic Sans MS',
          'System',
        ];

        let currentFont = 'Calibri';
        let fontList = document.getElementById('font-list');

        for (let font of fonts) {
          let fontItem = document.createElement('div');
          fontItem.setAttribute('class', 'font-item');
          let fontName = document.createElement('h1');
          fontName.style.fontFamily = font;
          fontName.textContent = font;
          fontItem.appendChild(fontName);

          fontItem.addEventListener('mouseover', () => {
                if (cursor.el.nodeName == '#text') {
                    cursor.el.parentElement.style.fontFamily = font;
                } else {
                    cursor.el.style.fontFamily = font;
                }
          });

          fontItem.addEventListener('mousedown', (event) => {
            event.preventDefault();
            currentFont = font;
            let currFont = document.getElementById('font-current');
            currFont.children[0].style.fontFamily = font;
            currFont.children[0].textContent = font;
          });

          fontList.appendChild(fontItem);
        }

        fontList.addEventListener('mouseleave', () => {
            if (cursor.el.nodeName == '#text') {
                cursor.el.parentElement.style.fontFamily = currentFont;
            } else {
                cursor.el.style.fontFamily = currentFont;
            }
        });


        for (let tag of ['p', 'h1', 'h2', 'h3', 'h4']) {
            let div = document.createElement('div');
            div.innerHTML = tag;
            
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();

                let selection = window.getSelection()
                let node = selection.anchorNode

                while(!isElement(node)) node = node.parentElement
                while(node.dataset.type != 'block') node = node.parentElement

                node.replaceWith(element(tag, node.innerHTML))
            });

            document.getElementById('tags').appendChild(div);
        }
    }


    let bold = document.getElementById("bold")


    bold.addEventListener('click', (e) => {
        let selection = getSelection()

        let startEl = selection.startNode
        let endEl = selection.endNode

        //nazewnictwo z selection

        let rangeClone = {
            startOffset: selection.startOffset,
            endOffset: selection.endOffset,
            startNode: startEl,
            endNode: endEl,
            startBlock: startEl.parentElement,
            endBlock: endEl.parentElement,
        };

        if(startEl === endEl){
            let str = startEl.textContent
            let textStart = str.substring(0, range.startOffset)
            let textEnd = str.substring(range.endOffset,startEl.textContent.length - 1)
            let textToBold = str.substring(range.startOffset,range.endOffset)
            startEl.innerHTML = 
                `${textStart}<span style="font-weight: bold; color: black;">${textToBold}</span>${textEnd}`;
            
            rangeClone.startContainer = startEl.children[0].childNodes[0];
            rangeClone.endContainer = startEl.children[0].childNodes[0];
            rangeClone.endOffset = rangeClone.endOffset - rangeClone.startOffset
        } else {
            let offset = range.startOffset;
            while(startEl != endEl) {
                let str = startEl.textContent
                let textStart = str.substring(0, offset);
                let textToBold = str.substring(offset, str.length - 1);
                startEl.innerHTML = 
                    `${textStart}<span style="font-weight: bold; color: black;">${textToBold}</span>`;
                if(offset != 0){
                    rangeClone.startContainer = startEl.children[0].childNodes[0];
                }
                offset = 0
                startEl = startEl.nextSibling
            }
            let str = endEl.textContent;
            let textStart = str.substring(0, range.endOffset);
            let textEnd = str.substring(range.endOffset, str.length - 1);
            startEl.innerHTML = `<span style="font-weight: bold; color: black;">${textStart}</span>${textEnd}`;
            rangeClone.endContainer = startEl.children[0].childNodes[0];
        }

        let newRange = new Range()
        newRange.setStart(rangeClone.startContainer, 0)
        newRange.setEnd(rangeClone.endContainer, rangeClone.endOffset);
        
        let nselection = window.getSelection()
        nselection.removeAllRanges()
        nselection.addRange(newRange)

    })


    /* Utils Functions */
    var getElementFromNode = (node) => 
        isElement(node) ? node : node.parentElement

    var isElement = (node) => 
        node.nodeType === Node.ELEMENT_NODE ?  true : false
    
    var getSelection = () => {
        let selection = editor.ownerDocument.getSelection().getRangeAt(0)

        let startNode = getElementFromNode(selection.startContainer)
        startNode = getTextElement(startNode)
        let endNode = getElementFromNode(selection.endContainer)
        endNode = getTextElement(endNode)
        let startBlock = startNode.parentElement
        let endBlock = endNode.parentElement;

        return {
            startNode,
            endNode,
            startBlock,
            endBlock,
            startOffset: selection.startOffset,
            endOffset: selection.endOffset,
            isCollapsed: editor.ownerDocument.getSelection().isCollapsed
        }
    }

    var setSelection = (newSelection) => {
        let selection = editor.ownerDocument.getSelection()
        let range = document.createRange()

        range.setStart(
            newSelection.startNode.childNodes[0], 
            newSelection.startOffset
        )
        range.setEnd(
            newSelection.endNode.childNodes[0],
            newSelection.endOffset
        );

        selection.removeAllRanges()
        selection.addRange(range)
    }

    var insertAfter = (newNode, node) => {
      node.parentElement.insertBefore(newNode, node.nextSibling);
    };

    var getTextElement = (node) =>
        isText(node) ? node : node.parentElement

    var isText = (node) =>
        (node.dataset.hasOwnProperty('type') && 
            node.dataset.type === 'text')  
                ? true : false


    var addEmptyLine = (selection) => {
        let block = elementWithChilds('p', [
            {
                type: 'span',
                content: '<br>',
                data: 'text',
            }
        ]);

        insertAfter(block, selection.startBlock);

        setSelection({
            startNode: block.childNodes[0],
            endNode: block.childNodes[0],
            startOffset: 0,
            endOffset: 0, 
        })
    }


    /* OD TEGO MIEJSCA ZACZAĆ */
    /* !!!!! */
    var deleteFromSelection = (selection) => {
          let currBlock =
            selection.startBlock == selection.endBlock
              ? selection.startBlock
              : selection.startBlock.nextSibling;

          while (currBlock != selection.endBlock) {
            let next = currBlock.nextSibling;
            editor.removeChild(currBlock);
            currBlock = next;
          }

          let currNode = selection.startNode.nextSibling;

          if (selection.startBlock != selection.endBlock) {
            while (currNode != null) {
              let next = currNode.nextSibling;
              selection.startBlock.removeChild(currNode);
              currNode = next;
            }
          }

          currNode = selection.endBlock.firstChild;
          while (currNode != selection.endNode) {
            let next = currNode.nextSibling;
            selection.endBlock.removeChild(currNode);
            currNode = next;
          }

          selection.startNode.textContent = selection.startNode.textContent.substring(
            0,
            selection.startOffset
          );
          selection.endNode.textContent = selection.endNode.textContent.substring(
            selection.endOffset,
            selection.endNode.textContent.length
          );
    }
    /* End Utils */

    editor.addEventListener('click', (e) => {
        cursor.el = window.getSelection().getRangeAt(0).startContainer;
        cursor.offset = window.getSelection().getRangeAt(0).startOffset;
    })

    editor.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Backspace':                
                if(editor.children.length == 1 && editor.children[0].textContent.length == 0) {
                        e.preventDefault()
                }
            break;

            case 'Enter':
                e.preventDefault()
                let selection = getSelection()

                if(!selection.isCollapsed)
                    deleteFromSelection(selection)
                else 
                    setSelection({
                        startNode: selection.startNode,
                        endNode: selection.startNode,
                        startOffset: selection.startNode.textContent.length,
                        endOffset: selection.startNode.textContent.length,
                    });

                addEmptyLine(getSelection())
            default:
                break;
        }
    })

    editor.addEventListener('keyup', (e) => {
        cursor.el = window.getSelection().getRangeAt(0).startContainer;
        cursor.offset = window.getSelection().getRangeAt(0).startOffset;
    })

    editor.addEventListener('focus', (e) => {
        if (editor.children[0] == placeholderTag) {
            e.preventDefault();
            editor.replaceChild(document.createElement('p'), placeholderTag);

            let range = new Range();
            range.setStart(editor.childNodes[0], 0);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    })

    editor.addEventListener('blur', (e) => {
      if (
        editor.children.length == 1 &&
        editor.children[0].textContent.length == 0
      ) {
        editor.replaceChild(placeholderTag, editor.children[0]);
      }
    });

    return this
}

var richTextEditor = new Editor({
  editor: document.getElementById('editor'),
  placeholder: 'Rozpocznij pisanie artykułu',
});

