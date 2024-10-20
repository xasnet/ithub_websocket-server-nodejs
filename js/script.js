const socket = new WebSocket('ws://localhost:5000');

socket.onopen = () => {
    console.log('Соединение установлено');
};

socket.onclose = () => {
    console.log('Соединение закрыто');
};

const sendButton = document.getElementById('sendButton');

// Нажатие кнопки Отправить
sendButton.addEventListener('click', () => {
    let cmdInputElement = document.getElementById('commandInput');
    let inputWord = cmdInputElement.value;

    if (inputWord === '') {
        alert("Вы должны ввести ключевое слово для поиска URL (pg_win / pg_mac)!");
        exit;
    }
    else if (!((inputWord === 'pg_win') || (inputWord === 'pg_mac'))) {
        alert("Неизвестная команда");
        exit;
    }
    let cmd = { cmd: "getUrl", keyword: `${inputWord}` };
    let jsonCmd = JSON.stringify(cmd);
    socket.send(jsonCmd);
    cmdInputElement.value = '';
});

// Нажатие кнопки Скачать
const urlClick = (url) => {
    let cmd = { cmd: "download", url: `${url}` };
    let jsonCmd = JSON.stringify(cmd);
    socket.send(jsonCmd);
}

// Создаем UI для URLs
const createUIUrlElement = (url) => {
    // Область UI
    let uiDivMainElement = document.getElementById("result");
    // Создаем текстовый элемент
    let uiTextElement = document.createTextNode(url);
    // Создаем кнопку Загрузить
    let uiBtnElement = document.createElement("button");
    uiBtnElement.className = "btnDownload";
    uiBtnElement.innerText = "Скачать";
    uiBtnElement.value = url;
    // Создаем обработчик нажатия кнопки
    uiBtnElement.onclick = function () {
        urlClick(this.value);
    }
    // Создаем список
    let uiLiUrlElement = document.createElement("li");
    uiLiUrlElement.className = "liUrl";
    // Добавляем в список пункт
    uiLiUrlElement.appendChild(uiTextElement);
    // Добавляем в список кнопку
    uiLiUrlElement.appendChild(uiBtnElement);
    // Добавляем список в UI
    uiDivMainElement.appendChild(uiLiUrlElement);
}

// Создаем UI для статуса скачивания файла
const createUIStatusElement = (statusText) => {
    // Область UI
    let uiDivMainElement = document.getElementById("status");
    uiDivMainElement.innerText = `${statusText}`;


}

// Создаем UI для вывода информации о загруженных файлах
const createUIResultElement = (fileInfo) => {
    // Область UI
    let uiDivMainElement = document.getElementById("download");
    uiDivMainElement.innerText += `${fileInfo}\n`;
}

// Обрабатываем ответ от сервера
socket.onmessage = (event) => {
    let jsonMessage = JSON.parse(event.data);
    switch (jsonMessage.cmd) {
        case 'srvUrl':
            let uiUrlElement = createUIUrlElement(jsonMessage.url);
            document.getElementById("result").appendChild(uiUrlElement);
            break;
        case 'downloadStatus':
            let uiStatusElement = createUIStatusElement(jsonMessage.statusMsg);
            document.getElementById("status").appendChild(uiStatusElement);
            break;
        case 'downloadResult':
            let uiResultElement = createUIResultElement(jsonMessage.statusMsg);
            document.getElementById("download").appendChild(uiResultElement);
            break;
        default:
            console.log('Неизвестная команда');
            break;
    }
};