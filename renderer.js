const { ipcRenderer } = require('electron')//引入渲染进程模块

let defaultValue = "请选择设备";
let selectList = ["请选择设备"];
let packageNameList = [];

function getDeviceInfo () {
    ipcRenderer.send('conventional', [
        'brand-result',
        'adb shell getprop ro.product.model',
        'brand',
    ]);
}
function getConnect(){
    let linkStr = document.getElementById('link-str');
    if (linkStr.value.trim().length > 0) {
        ipcRenderer.send('conventional', [
            'brand-result',
            `adb connect ${linkStr.value}`,
            'connect-link',
        ]);
    } else {
        setNotification('请先输入IP')
    }
}
function getPackageList(){
    ipcRenderer.send('conventional', [
        'brand-result',
        'adb shell pm list package -3',
        'package',
    ]);
}
function getPermissionInfo (e) {
    ipcRenderer.send('conventional', [
        'brand-result',
        `adb shell "dumpsys package ${e}`,
        'permission',
    ]);
}
function runCmdCode(e){
    ipcRenderer.send('conventional', [
        'brand-result',
        e,
        'cmd',
    ]);
}
function stopCmdShell(e){
    ipcRenderer.send('conventional', [
        'brand-result',
        'kill-server',
        'kill',
    ]);
}
function addListener () {
    let refreshDevices = document.getElementById('refresh-devices')
    let linkDevices = document.getElementById('link-devices')
    let tab1 = document.getElementById('tab1')
    let tab2 = document.getElementById('tab2')
    let tab3 = document.getElementById('tab3')
    let footerView = document.getElementsByClassName('footer-view')[0]
    let contentDelete = document.getElementsByClassName('content-delete')[0]
    let contentStop = document.getElementsByClassName('content-stop')[0]

    ipcRenderer.on('brand-result', (event, data) => {
        if (data && data?.length > 0) {
            switch (data[2]) {
                case 'brand':
                    let list = data[0].split('\r\n').filter((item) => item);
                    if (typeof list[0] === 'string' && /offline/.test(list[0])) {
                        setNotification('连接超时...')
                    } else if (
                        typeof list[0] === 'string' &&
                        /no devices/.test(list[0])
                    ) {
                        setNotification('没有检测到连接设备，请确认USB接口正常')
                    } else {
                        selectList = list;
                        list.map((item, index)=>{
                            let selectDom = document.getElementById('select-devices');
                            let option = document.createElement('option');
                                selectDom.innerHTML = '';
                                selectDom.appendChild(option);
                                option.value = item;
                                option.text = item;
                                if (!index) selectDom.value = item;
                        })
                        getPackageInfo(list);
                    }
                    break;
                case 'package':
                    currentPackageList(data);
                    break;
                case 'permission':
                    currentPermissionInfo(data);
                    break;
                case 'connect-link':
                    setNotification(data[0]);
                    break;
                case 'cmd':
                    currentCmdInfo(data);
                    break;

            }
        }
    });
    refreshDevices.addEventListener('click', getDeviceInfo);
    linkDevices.addEventListener('click', getConnect);
    tab1.addEventListener('click', (e)=>setPackageTab(0));
    tab2.addEventListener('click', (e)=>setPackageTab(1));
    tab3.addEventListener('click', (e)=>setPackageTab(2));
    footerView.addEventListener('click', getInputFocus);
    footerView.addEventListener('keydown', setKeyDown);
    contentDelete.addEventListener('click', deleteCmdList);
    contentStop.addEventListener('click', stopCmdList);
}
window.onload = () => {
    getDeviceInfo();
    addListener();
}

function reset () {
    let contentCenter = document.getElementsByClassName('content-center')[0]
    let contentFooter = document.getElementsByClassName('content-footer')[0]
    let contentTab = document.getElementsByClassName('content-tab')[0]
    let header = document.getElementsByClassName('header')[0]
    let contentHeight = contentCenter.offsetHeight;
    let tabHeight = contentTab.offsetHeight + 40;
    let headerHeight = header.offsetHeight;
    contentFooter.style.maxHeight = document.body.offsetHeight - headerHeight - tabHeight - contentHeight + 'px';
}

function currentCmdInfo (data) {
    let list = document.getElementsByClassName('footer-content')[0];
    let div = document.createElement('div');
        div.className = "footer-result";
    let div1 = document.createElement('div');
        div1.textContent = "输入：" + data[1];
    let div2 = document.createElement('div');
        div2.textContent = "输出：" + data[0];
        div.appendChild(div1);
        div.appendChild(div2);
        list.appendChild(div);
}

function currentPermissionInfo (data) {
    let str = data;
    let declared = setStr(
        str,
        'declared permissions:',
        'requested permissions:'
    );
    let requested = setStr(
        str,
        'requested permissions:',
        'install permissions:'
    );
    let install = setStr(str, 'install permissions:', 'runtime permissions:');
    let runtime = setStr(str, 'runtime permissions:', 'Queries:');
    let dom = document.querySelectorAll('.permissions-list')

    if(declared.length>0){
        createPermissionsItem(dom[0], '敏感权限：', declared);
    }
    if(requested.length>0){
        createPermissionsItem(dom[1], '请求的权限：', requested);
    }
    if(install.length>0){
        createPermissionsItem(dom[2], '安装权限：', install);
    }
    if(runtime.length>0){
        createPermissionsItem(dom[3], '运行时的权限：', runtime);
    }
}

function currentPackageList (data) {
    let packageList = document.getElementsByClassName('package-table')[0]?.querySelector('tbody');
        packageList.innerHTML = '';
    let hr = document.createElement('tr');
    let th1 = document.createElement('th');
        th1.textContent = "app名称";
        th1.style.width = "width: 20%";
    let th2 = document.createElement('th');
        th2.textContent = "版本号";
        th2.style.width = "width: 25%";
    let th3 = document.createElement('th');
        th3.textContent = "包名";
        th3.style.width = "width: 35%";
    let th4= document.createElement('th');
        th4.textContent = "权限设置";
        th4.style.width = "width: 100%";
        hr.appendChild(th1);
        hr.appendChild(th2);
        hr.appendChild(th3);
        hr.appendChild(th4);
        packageList.appendChild(hr);
    let list = data[0].split('\r\n').filter((item) => item);
    packageNameList = list;
    list.map((item, index)=>{
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        let div1 = document.createElement('div');
            div1.textContent = item.split('.')[item.split('.').length-1];
        let td2 = document.createElement('td');
        let div2 = document.createElement('div');
            div2.textContent = index + '.' + Math.ceil(Math.random()*3000);
        let td3 = document.createElement('td');
        let div3 = document.createElement('div');
            div3.textContent = item;
        let td4 = document.createElement('td');
        let div4 = document.createElement('div');
            div4.className = "package-control";
            div4.textContent = "权限设置";
            div4.addEventListener('click', ()=>currentPermission(index))
            td1.appendChild(div1);
            td2.appendChild(div2);
            td3.appendChild(div3);
            td4.appendChild(div4);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            packageList.appendChild(tr);
    });
    reset();
}

function getPackageInfo (list) {
    if (list && list[0] !== defaultValue) {
        getPackageList()
    }
}

function deleteCmdList () {
    let list = document.getElementsByClassName('footer-content')[0];
        list.innerHTML = '';
}

function stopCmdList () {
    stopCmdShell()
}

function currentPermission (num) {
    let dom = document.querySelector('.permission-package');
        dom.textContent = packageNameList[num];
    setPackageTab(1);
    getPermissionInfo(packageNameList[num].split(':')[1])
}

function setPackageTab (num) {
    let tabs = document.querySelectorAll('.content-item');
    let packageDom = document.querySelector('.package-name');
    let permission = document.querySelector('.main-permission');
    let logcat = document.querySelector('.logcat-result');
    packageDom.style.display = "none";
    permission.style.display = "none";
    logcat.style.display = "none";
    for(let i = 0; i < tabs.length; i ++ ) {
        if(i === num) {
            tabs[i].className = "content-item tab-active";
        } else {
            tabs[i].className = "content-item";
        }
    }

    switch (num) {
        case 0:
            packageDom.style.display = "block";
            getPackageInfo(selectList)
            break;
        case 1:
            permission.style.display = "block";
            break;
        case 2:
            logcat.style.display = "block";
            break;
    }
    reset();
}
function getInputFocus () {
    let dom = document.getElementsByClassName('input-cmd')[0];
        dom.focus();
}
function setKeyDown (e) {
    if(e.code === "Enter"){
        let inputVal = document.querySelector('.input-cmd');
        runCmdCode(inputVal.value);
        inputVal.value = '';
    }
}
function setStr (str, str1, str2) {
    let list = [];
    str[0]
        ?.split(str1)[1]
        ?.split(str2)[0]
        ?.split('\r\n')
        ?.map((item) => {
            if (item?.length > 10) {
                list.push(item?.trim());
            }
        });
    return list;
}
function createPermissionsItem (dom, msg, list) {
        dom.innerHTML = '';
    let title = document.createElement('div');
        title.className = 'permissions-title';
        title.textContent = msg;
        dom.appendChild(title);
    for (let i = 0; i < list.length; i ++) {
        let item = document.createElement('div');
        item.textContent = list[i];
        dom.appendChild(item);
    }
}
function setNotification (toast) {
    let option = {
        title: "消息提示",
        body: toast
    };
    let notification = new window.Notification(option.title, option);
    notification.onclick = function () {
        console.log('点击弹窗');
    }
}