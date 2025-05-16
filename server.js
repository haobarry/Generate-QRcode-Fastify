



const fs = require("fs");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const fastifyWebsocket = require("@fastify/websocket");
const fastify = require("fastify")

const { generateQRCodesAsyncHandler, clients } = require("./handler/index");


const app = fastify(
  {
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
          colorize: true
          
        }
      }
    }
  }
);;

// 注册静态文件插件
// 把所有 / 路径下的请求  都是从跟目录下去查找
// 比如访问 /  就是从根目录下去查找index.html文件
app.register(fastifyStatic, {
  root: __dirname,
  prefix: "/",
});

// 注册WebSocket插件
app.register(fastifyWebsocket);

// 注册WebSocket路由
app.register(async function (fastify) {
    fastify.get("/progress", { websocket: true }, (connection, req) => {
        // 添加新客户端
        clients.add(connection.socket);

        connection.socket.on("close", () => {
            // 移除断开连接的客户端
            clients.delete(connection.socket);
        });
    });
});




// 生成二维码API端点
app.get("/generate-qrcodes", async (request, reply) => {
  try {
    // 读取文本文件
    const filePath = path.join(__dirname, "yangquan.txt");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
    const totalLines = lines.length;
    console.log("lines----------", lines);
    // 开始异步生成过程

    
    generateQRCodesAsyncHandler(app,lines);

    // 立即返回响应
    return {
      success: true,
      message: "开始生成二维码",
      count: totalLines,
    };
  } catch (error) {
    app.log.error(error,"生成二维码失败:" );
    return reply.code(500).send({
      success: false,
      error: error.message,
    });
  }
});






// 启动服务器
const start = async () => {
  try {
    const PORT = 5051;
    await app.listen({ port: PORT, host: "127.0.0.1" });  // 改用 127.0.0.1 替代 0.0.0.0
    console.log(`--------》服务器已启动，访问 http://localhost:${PORT}`);
    app.log.info(`测试中文日志`)
  } catch (err) {
    app.log.error(err,"服务器错误");
    process.exit(1);
  }
};

start();

