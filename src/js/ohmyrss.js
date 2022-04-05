// 提示信息
const [NET_ERROR_MSG, LOGIN_ERROR_MSG, LOGIN_SUCC_MSG, SUBS_LIMIT_ERROR_MSG] = 
    ['网络异常，请稍后重试！', '登录授权失败，请稍后重试！', '登录成功 ^o^', '已达订阅数上限，请取消一部分！'];
const SEARCH_ERROR_MSG = '搜索异常，请切换关键字后重试！'
const NEED_REFRESH_MSG = '请刷新页面后重试！'

const podCastConfig = {
  "base": "/player/",
  "theme": {
    "tokens": {
      "brand": "#166255",
      "brandDark": "#166255",
      "brandDarkest": "#1A3A4A",
      "brandLightest": "#E5EAECFF",
      "shadeDark": "#807E7C",
      "shadeBase": "#807E7C",
      "contrast": "#000",
      "alt": "#fff"
    },
  }
}

// 登陆用户的未读数
let userUnreadCount = 0;

function getTextReadTime(str) {
    // 估算预计阅读时间
    let charCount = 0;
    for (let i = 0; i < str.length; i++) {
        if (escape(str.charAt(i)).length > 4) {
            //中文字符的长度经编码之后大于4
            charCount += 2;
        } else {
            charCount += 1;
        }
    }
    return parseInt(charCount / 900);
}

function genUidV0() {
    /* 生成游客用户 uid，自带校验  */
    const [secKey, secVer] = ['bDNsU3BxNXM2b1NyRFJ0dFQwa1o=', 'MDA=']
    const uuidStr = uuid.v4();
    const sign = md5(uuidStr + atob(secKey)).substring(0, 10)
    return uuidStr + atob(secVer) + sign
}

function toast(msg, keep=1300) {
    // 普通提示
    M.toast({html: msg, displayLength: keep});
}

function warnToast(msg, keep=4500) {
    // 带样式的警告提示
    const html = '<span style="color: #eeff41;">' + msg + '</span>';
    M.toast({html: html, displayLength: keep});
}

function showServerMsg() {
    // 展示服务器的提示，从 cookie 获取信息
    if (Cookies.get('toast') === undefined) {
        return false;
    }

    const msg = Cookies.get('toast').split(':')[0];

    if (msg == "LOGIN_SUCC_MSG") {
        toast(LOGIN_SUCC_MSG);
    } else if (msg == 'LOGIN_ERROR_MSG') {
        warnToast(LOGIN_ERROR_MSG);
    } else if (msg == 'SUBS_LIMIT_ERROR_MSG'){
        warnToast(SUBS_LIMIT_ERROR_MSG);
    } else {
        console.warn(`未知的消息：${msg}`);
    }

    Cookies.remove('toast');
}

function getOrSetUid() {
    // 获取本地 UID，如果不存在就设置一个
    const uid = localStorage.getItem('UID');
    if (uid) {
        return uid;
    } else {
        localStorage.setItem('UID', genUidV0());
    }
    return localStorage.getItem('UID');
}

function hasVisitorReadArticle(id) {
    // 游客已读判断
    return localStorage.getItem('READ/' + id) === '1';
}

function setReadArticle(id, ev_target=null) {
    if (!getLoginId()) {
        localStorage.setItem('READ/' + id, '1');
    }

    // 更新 UI 状态，不管是否登陆
    if (ev_target !== null) {
        // 更新 icon 状态
        const icon = ev_target.find('i.unread');

        icon.removeClass('unread').addClass('read');
        icon.text('check');
        ev_target.find('.omrss-title').removeClass('omrss-title-unread').addClass('omrss-title-read');
    }
}

function setThirdLinkify(){
    $('#omrss-third').linkify({
        target: "_blank"
    });
}

function setLeaveMsgToday() {
    localStorage.setItem('LMSG/' + (new Date()).toDateString(), '1');
}

function hasLeaveMsgToday() {
    return localStorage.getItem('LMSG/' + (new Date()).toDateString());
}

function setStared(id) {
    localStorage.setItem('STARED/' + id, '1');
}

function isStared(id) {
    return localStorage.getItem('STARED/' + id) === '1';
}


function getVisitorSubFeeds() {
    // 针对游客，返回字符串
    return localStorage.getItem('SUBS2') || "[]";
}

function getVisitorUnsubFeeds() {
    // 针对游客，返回字符串
    return localStorage.getItem('UNSUBS2') || "[]";
}

function visitorSubFeed(siteId) {
    siteId = parseInt(siteId)

    // 游客订阅，数据存储在本地
    let subFeeds = new Set(JSON.parse(getVisitorSubFeeds()));
    let unsubFeeds = new Set(JSON.parse(getVisitorUnsubFeeds()));

    unsubFeeds.delete(siteId);
    subFeeds.add(siteId);

    localStorage.setItem('SUBS2', JSON.stringify([...subFeeds]));
    localStorage.setItem('UNSUBS2', JSON.stringify([...unsubFeeds]));
}

function visitorUnsubFeed(siteId) {
    siteId = parseInt(siteId)

    // 游客取消订阅，数据存储在本地
    let subFeeds = new Set(JSON.parse(getVisitorSubFeeds()));
    let unsubFeeds = new Set(JSON.parse(getVisitorUnsubFeeds()));

    subFeeds.delete(siteId);
    unsubFeeds.add(siteId);

    localStorage.setItem('SUBS2', JSON.stringify([...subFeeds]));
    localStorage.setItem('UNSUBS2', JSON.stringify([...unsubFeeds]));
}

function isVisitorSubFeed(siteId) {
    siteId = parseInt(siteId);
    let subFeeds = new Set(JSON.parse(getVisitorSubFeeds()));
    return subFeeds.has(siteId);
}

function isVisitorUnSubFeed(siteId) {
    siteId = parseInt(siteId);
    let unsubFeeds = new Set(JSON.parse(getVisitorUnsubFeeds()));

    return unsubFeeds.has(siteId);
}

function toggleOnlyUnread() {
    // 切换只看未读
    if (localStorage.getItem('ONLYUNREAD') === null) {
        localStorage.setItem('ONLYUNREAD', 'no')
    }

    const onlyUnread = localStorage.getItem('ONLYUNREAD');

    if (onlyUnread === 'yes') {
        localStorage.setItem('ONLYUNREAD', 'no');
        return 'no'
    } else if (onlyUnread === 'no') {
        localStorage.setItem('ONLYUNREAD', 'yes');
        return 'yes'
    }
}
function toggleReadMode() {
    // 切换阅读模式，文章模式、站点模式
    if (localStorage.getItem('READMODE') === null) {
        localStorage.setItem('READMODE', 'article')
    }

    const mode = localStorage.getItem('READMODE');

    if (mode === 'site') {
        localStorage.setItem('READMODE', 'article');
        return 'article'
    } else if (mode === 'article') {
        localStorage.setItem('READMODE', 'site');
        return 'site'
    }
}

function getReadMode() {
    if (localStorage.getItem('READMODE') === null) {
        localStorage.setItem('READMODE', 'article');
    }
    return localStorage.getItem('READMODE');
}

function getOnlyUnreadSwitch() {
    if (localStorage.getItem('ONLYUNREAD') === null) {
        localStorage.setItem('ONLYUNREAD', 'no');
    }
    return localStorage.getItem('ONLYUNREAD');
}

function enterFullscreen() {
    /* 全屏 */
    const el = document.documentElement;
    const rfs = el.requestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    rfs.call(el);
}

function isInFullscreen() {
    /* 是否全屏 */
    return (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);
}

function exitFullscreen() {
    /* 退出全屏 */
    try {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (err) {
        console.warn("退出全屏时遇到异常", err.msg)
    }
    return true;
}


function updateReadStats() {
    // 计算预计阅读时间
    const third = $('#omrss-third');

    const thirdTextCount = third.text().trim().length;
    const thirdImgCount = third.find('img').length;
    const thirdHrefCount = third.find('a').length;

    const thirdReadTime = getTextReadTime(third.text().trim()) + parseInt(thirdImgCount / 20) +
        parseInt(thirdHrefCount / 20);
    const stats = `预计阅读时间<b> ${thirdReadTime} </b>分钟（共 ${thirdTextCount} 个字， ${thirdImgCount} 张图片， ${thirdHrefCount} 个链接）`;

    $('#omrss-read-stats').html(stats);
}

function updateUnreadUI(unread) {
    if (unread > 0) {
        $('#omrss-unread').html(`<a href="#" style="cursor: default;"><span class="new badge">${unread}</span></a>`);
    } else {
        $('#omrss-unread').html('');
    }

    return unread;
}

function getUserUnreadCount() {
    return userUnreadCount;
}

function setUserUnreadCount(unread) {
    userUnreadCount = unread;
    return userUnreadCount;
}

function updateUserUnreadCount(read=0) {
    if (getLoginId()) {
        if (read > 0) {
            userUnreadCount -= read;
        }

        return updateUnreadUI(userUnreadCount);
    }
}

function updateUnreadCount(read=0, cal=true) {
    // 设置未读数（区分是否登录用户）
    if (getLoginId()) {
        return updateUserUnreadCount(read);
    } else {
        // 这个计算有性能问题
        if (cal) {
            let unread = 0;
            const toReads = JSON.parse(localStorage.getItem('TOREADS'));

            for (let i = 0; i < toReads.length; i++) {
                const hasRead = localStorage.getItem('READ/' + toReads[i]);
                if (!hasRead) {
                    unread += 1;
                }
            }
            return updateUnreadUI(unread);
        } else {
            // 简化计算逻辑
            let unread = $('#omrss-unread span').text();

            if (unread > 0) {
                unread -= read;
                return updateUnreadUI(unread);
            }
        }
    }
}

function markVisitorReadAll(toReads) {
    // 设置所有为已读
    if (!getLoginId()) {
        for (let i = 0; i < toReads.length; i++) {
            setReadArticle(toReads[i]);
        }
    }
}

function setToreadInfo(notify=false) {
    // 从网络读取列表，然后更新未读数
    $.post("/api/lastweek/articles", {
        uid: getOrSetUid(),
        sub_feeds: getVisitorSubFeeds(),
        unsub_feeds: getVisitorUnsubFeeds(),
        ext: window.screen.width + 'x' + window.screen.height
    }, function (data) {
        if (getLoginId()) {
            setUserUnreadCount(data.result);
        }else {
            localStorage.setItem('TOREADS', JSON.stringify(data.result));
        }
        
        // 展示服务器消息
        showServerMsg();

        const newNum = updateUnreadCount();

        // 发送通知
        if (notify === true && newNum > 0) {
            if (window.Notification && Notification.permission === "granted") {
                const notify = new Notification(`你有 ${newNum} 条未读订阅`, {
                    tag: "己思",
                    icon: "https://ohmyrss.com/assets/img/logo.svg",
                    body: "请刷新页面后查看"
                });
            }
        }
    })
}

// 全局LRU缓存服务
let lruCache = new Cache(50, false, new Cache.LocalStorageCacheStorage('OMRSS'));

// 缓存版本号，每次上线需要更新
const cacheVer = '30';

function setLruCache(key, value) {
    if (value.length < 100 * 1024 && value.length > 512) {
        lruCache.setItem(cacheVer + key, value);
        return true;
    }
    return false;
}

function getLruCache(key) {
    return lruCache.getItem(cacheVer + key);
}

// 判断是否是后台窗口
let isBgWin = false;


function isQQApp(){
    let isIosQQ = (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent) && /\sQQ/i.test(navigator.userAgent));
    let isAndroidQQ = (/(Android)/i.test(navigator.userAgent) && /MQQBrowser/i.test(navigator.userAgent)
        && /\sQQ/i.test(navigator.userAgent));
    return isIosQQ || isAndroidQQ;
}

function isInWebview () {
    // 是否从 APP 内打开
    let ua = navigator.userAgent.toLowerCase();

    return (/micromessenger/i).test(ua) || isQQApp() || (/WeiBo/i).test(ua);
}

function fixThirdStyleTag() {
    // 移除第三方标签的样式
    $("#omrss-third p, #omrss-third span, #omrss-third section, #omrss-third div").each(function() {
        const style = $(this).attr('style');

        if ( style !== undefined ){
            $(this).removeAttr('style');
        }
    });

    $("#omrss-third img, #omrss-third video").each(function () {
        $(this).removeAttr('width');
        $(this).removeAttr('height');
        $(this).removeAttr('style');
    });

    $('#omrss-third style').remove();
}

function fixWempStyleTag() {
    // 微信公众号处理
    $("#js_content").each(function() {
        const style = $(this).attr('style');

        if ( style !== undefined ){
            $(this).removeAttr('style');
        }
    });
}

function fixArticlePrivilege() {
    const pri = $("#omrss-third").attr('data-privilege');

    if (!getLoginId() && pri < 30) {
        $('#omrss-third').css('overflow', 'hidden');
        $('#omrss-third').css('max-height', getBriefHeight());
        $('.cnt-right').css('overflow-y', 'hidden');
    } else {
        $('#omrss-third').css('overflow', 'auto');
        $('#omrss-third').css('max-height', 'auto');
        $('.cnt-right').css('overflow-y', 'scroll');
    }
}

function codeHighlight() {
    // 代码样式
    if ($('#omrss-third pre[class*="language-"]').length > 0 || $('#omrss-third code[class*="language-"]').length > 0) {
        Prism.highlightAll();
    } else {
        $('pre > code').each(function() {
            hljs.highlightBlock(this);
        });
    }
}

function getLoginName() {
    const loginEl = $('#omrss-my');
    if (loginEl.length === 0) {
        return '';
    } else {
        return loginEl.attr('data-oauth-name');
    }
}

function getLoginId() {
    // 获取登录用户名，用于判断是否登录
    const loginEl = $('#omrss-my');
    if (loginEl.length === 0) {
        return '';
    } else {
        return loginEl.attr('data-oauth-id');
    }
}
