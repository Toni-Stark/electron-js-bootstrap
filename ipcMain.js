const { ipcMain, ipcRenderer} = require('electron');
const {exec} = require("child_process");
//引入主进程模块
// const mainWindow = require('./main');

let result;
module.exports = function conventionalMain(main){
    ipcMain.on('conventional',async (event, data) => {
        // data就是输入框的信息
        // event.sender.send('conventional-result', '异步通信返回')
        if (data[2] === 'permission') {
            exec(data[1], (_e, info) => {
                main?.webContents.send(data[0], [
                    `${info}`,
                    `${data[1]}`,
                    `${data[2]}`,
                ]);
            });
        } else if (data[2] === 'kill') {
            result?.kill();
            result = null;
        } else {
            result = exec(data[1]);
            result.stdout?.on('data', (res) => {
                main?.webContents.send(data[0], [
                    `${res}`,
                    `${data[1]}`,
                    `${data[2]}`,
                ]);
            });
            result.stderr?.on('data', (res) => {
                console.log(res)
                // mainWindow?.webContents.send(data[0], [
                //     `${res}`,
                //     `${data[1]}`,
                //     `${data[2]}`,
                // ]);
            });
        }
    })
}
