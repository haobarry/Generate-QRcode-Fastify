

const fs = require("fs");
const path = require("path");

const sharp = require("sharp")


// 存储所有连接的客户端
const clients = new Set();


// 确保output文件夹存在 不存在则创建
const outputDir = path.join(__dirname, "..", "output");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}


// 广播进度信息给所有客户端
function broadcastProgress(data) {
    clients.forEach((client) => {
        if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(JSON.stringify(data));
        }
    });
}

// 从文本中提取文件名
function getFilenameFromText(text) {
    // 移除协议前缀，并替换不合法的文件名字符
    return text.replace(/hlht:\/\//i, "").replace(/[\/\\:*?"<>|]/g, "-");
}


const UQRCode = require("uqrcodejs");

/**
 * 生成二维码并保存到文件
 * @param {*} text           文本内容
 * @param {*} filenamePath   不包含扩展名的路径
 * @returns
 */
async function generateCode(text, filenamePath) {
    try {
        // 加载UQRCode库
        // 创建二维码实例
        const qr = new UQRCode();
        // 设置二维码参数
        qr.setOptions({
            data: text,
            size: 200,
            margin: 10,
            errorCorrectLevel: 1,
        });
        qr.make();

        // 生成SVG并保存到文件
        const drawModules = qr.getDrawModules();
        // console.log('QR',QR)

        // 遍历drawModules创建svg元素字符串
        let qrHtml = "";
        for (var i = 0; i < drawModules.length; i++) {
            const drawModule = drawModules[i];
            // console.log('drawModule',drawModule)
            switch (drawModule.type) {
                case "tile":
                    /* 绘制小块 */
                    qrHtml += `<rect x="${drawModule.x}" y="${drawModule.y}" width="${drawModule.width}" height="${drawModule.height}" style="fill: ${drawModule.color};" />`;
                    break;
                case "image":
                    /* 绘制图像 */
                    qrHtml += `<image href="${drawModule.imageSrc}" x="${drawModule.x}" y="${drawModule.y}" width="${drawModule.width}" height="${drawModule.height}" />`;
                    break;
            }
        }

        // <svg id="qrcode" width="200" height="200" xmlns="http://www.w3.org/2000/svg" version="1.1">${qrHtml}</svg>
        // 直接生成svg字符串
        let svgHtml = `<svg id="qrcode" width="${qr.size}" height="${qr.size}" xmlns="http://www.w3.org/2000/svg" version="1.1">${qrHtml}</svg>`;
        // 保存到svg格式文件到根目录output文件夹
        const outputPath = path.join("./", `${filenamePath}.svg`);
        fs.writeFileSync(outputPath, svgHtml);

        // 成功回调
        return ({
            success: true,
            message: "生成成功",
            path: outputPath,
        });
    } catch (error) {
        throw error;
    };
}


// 异步生成所有二维码
async function generateQRCodesAsyncHandler(server, lines) {
    for (const [index, item] of lines.entries()) {
        try {
            const line = item.trim();
            if (line) {
                server.log.info(`第${index+1}次开始生成：${line},总数：${lines.length}`);
                // 广播当前进度
                broadcastProgress({
                    type: "progress",
                    status: "start",
                    current: index+1,
                    total: lines.length,
                });

                // 广播当前内容用于预览
                broadcastProgress({
                    type: "preview",
                    content: line,
                });

                // 生成文件名
                const filename = getFilenameFromText(line);
                // 生成文件路径 不包含扩展名
                const filenamePath = path.join(outputDir, filename);

                // 生成并保存二维码
                let result = await generateCode(line, filenamePath);
                server.log.info(result, "成功生成svg",);

                // 添加延迟500
                await new Promise((resolve) => setTimeout(resolve, 500));
                
                /** 转换svg为png */
                const svgPath = `${filenamePath}.svg`;
                // 可以根据路径的文件名 来直接转换所需要的图片格式 支持 JPEG、PNG、WebP、AVIF、TIFF、DZI 和 libvips 的 V 格式。* 注意：原始像素数据（raw pixel data）仅支持输出到缓冲区（buffer），不支持直接写入文件。
                const outputImgName = `${filename}-${Date.now()}.png`;
                const outputImgPath = path.join(outputDir, outputImgName);
                console.log('--------outputImgPath', outputImgPath)
                let covertRes = await sharp(svgPath).toFile(outputImgPath)
                server.log.info({'结果':covertRes}, "图片转换成功:",);

                // 广播当前进度
                broadcastProgress({
                    type: "progress",
                    status: "success",
                    current: index + 1,
                    total: lines.length,
                });

                // 添加延迟，避免服务器过载
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }



        } catch (error) {
            server.log.error({error}, "生成二维码失败");
            broadcastProgress({
                type: "progress",
                current: index + 1,
                status: "error",
                message: {
                    msg:'生成或转换失败',
                    error,
                },
            });
            break;
            
        }
    }
    // 广播完成信息
    broadcastProgress({
        type: "progress",
        total: lines.length,
        status: "completed",
    });

}


module.exports.clients = clients;
module.exports.generateQRCodesAsyncHandler = generateQRCodesAsyncHandler;











