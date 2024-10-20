const http = require("http");
const express = require("express");
const webSocket = require('ws');
const app = express();
const server = http.createServer(app);
const webSocketServer = new webSocket.Server({ server });

const axios = require('axios').default;
const fs = require("fs");
const path = require('node:path');

const portionLimit = 4096;
const threadCount = 3;

let activeThreadCount = 0;

// Ловим события
webSocketServer.on('connection', ws => {
    ws.on('message', msg => dispatchEvent(msg, ws));
    ws.on("error", e => ws.send(e));
    ws.on('close', () => ws.send('Сервер. Соединение закрыто'));
});

server.listen(5000, () => console.log("Сервер. Сервер запущен"));

// Обрабатываем сообщение
const dispatchEvent = (message, ws) => {
    try {
        // сообщение пришло текстом, нужно конвертировать в JSON-формат 
        console.log(`message: ${message}`);
        let jsonMessage = JSON.parse(message);
        console.log(`command: ${jsonMessage.cmd}`);
        if (jsonMessage.cmd === 'getUrl') {
            fetchUrl(jsonMessage.keyword, ws);
        }
        else if (jsonMessage.cmd === 'download') {
            activeThreadCount++;
            if (activeThreadCount <= threadCount) {
                downloadFile(jsonMessage.url, ws);
            }
            else {
                ws.send(JSON.stringify({ cmd: "downloadResult", statusMsg: `Превышено максимальное количество потоков для скачнивания: ${threadCount}` }));
                activeThreadCount = threadCount;
            }
        }
        else {
            ws.send(JSON.stringify({ cmd: "downloadResult", statusMsg: "Неизвестный тип команды" }));
        }
    } catch (error) {
        console.log('Сервер. Ошибка', error);
    }
}

// Получение списка Url
const fetchUrl = (keyword, ws) => {
    switch (keyword) {
        case 'pg_win':
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259174" }));
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259129" }));
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259127" }));
            break;
        case 'pg_mac':
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259172" }));
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259131" }));
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "https://sbp.enterprisedb.com/getfile.jsp?fileid=1259134" }));
            break;
        default:
            ws.send(JSON.stringify({ cmd: "srvUrl", url: "Неизвестная команда" }));
            break;
    }
}

// Скачивание файла
const downloadFile = async (url, ws) => {
    console.log(`Download file from Url: ${url}`);
    var urlString = new URL(url);
    var fileName = urlString.searchParams.get("fileid");
    let filePath = path.join(__dirname, '..', 'Download', `${fileName}.exe`);
    let writeStream = fs.createWriteStream(filePath);

    let response = await axios.get(url, {
        responseType: 'stream'
    });

    let totalLength = parseInt(response.headers['content-length'], 10);
    let curLength = 0;

    response.data.on('data', (portion) => {
        curLength += portion.length;
        let progress = (curLength / totalLength) * 100;
        let msg = `Cтатус загрузки ${filePath}. Размер: ${totalLength}, Кол-во потоков: ${activeThreadCount}/${threadCount}, Прогресс загрузки: ${progress}%`;

        ws.send(JSON.stringify({ cmd: "downloadStatus", statusMsg: msg }));

        if (curLength > portionLimit) {
            response.data.pause();
            setTimeout(() => response.data.resume(), 1000);
        }
    });

    response.data.pipe(writeStream);

    writeStream.on('finish', () => {
        ws.send(JSON.stringify({ cmd: "downloadResult", statusMsg: `Файл: ${filePath} загружен` }));
        writeStream.close();
        activeThreadCount--;
    });

    writeStream.on('error', (err) => {
        ws.send(JSON.stringify({ cmd: "downloadResult", statusMsg: `${err.message}` }));
        writeStream.close();
        activeThreadCount--;
    });
}