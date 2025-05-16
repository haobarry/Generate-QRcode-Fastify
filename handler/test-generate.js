
// file generate-rough-svg.js
const { DOMImplementation, XMLSerializer } = require('xmldom');
const xmlSerializer = new XMLSerializer();
const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
const rough = require('roughjs');
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const rc = rough.svg(svg);
var data = [[40, 20], [140, 30], [100, 130]]
svg.appendChild(rc.polygon(data))
let xml = xmlSerializer.serializeToString(svg);
console.log(xml)







/**
 * 通过nodejs xmldom模块创建svg 然后生成svg文件
 */
function SVGTest() {
    // dodejs中创建xmldom
    const { DOMImplementation, XMLSerializer, DOMParser } = require("xmldom");
    const xmlSerializer = new XMLSerializer();
    const domParser = new DOMParser();
    const document = new DOMImplementation().createDocument(
        "http://www.w3.org/1999/xhtml",
        "html",
        null
    );
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // 设置svg的宽高
    // 设置 SVG 根节点的属性
    svgNode.setAttribute("width", QR.size);
    svgNode.setAttribute("height", QR.size);
    // svgNode.setAttribute('viewBox', '0 0 200 200'); // 通常设置 viewBox 更好
    console.log(
        "SVG Node 设置属性后:\n",
        xmlSerializer.serializeToString(svgNode)
    );
    // 使用 DOMParser 解析字符串
    // 指定 MIME 类型为 image/svg+xml
    const svgContentDoc = domParser.parseFromString(qrHtml, "image/svg+xml");

    // 获取解析后文档的所有子节点
    // 注意：svgContentDoc.childNodes 包含了所有顶级节点，包括元素、文本、注释等
    const nodesToImport = svgContentDoc.childNodes;

    if (svgNode && nodesToImport) {
        // 遍历所有顶级子节点
        // 使用 Array.from() 转换为数组，以便在循环中修改原始集合（虽然这里是appendChild不影响，但转数组更安全）
        // 或者使用传统的 for 循环从后往前遍历，避免 nodeList 变化的问题
        for (let i = nodesToImport.length - 1; i >= 0; i--) {
            const node = nodesToImport[i];

            // 仅导入和添加元素节点 (nodeType === 1)
            if (node.nodeType === 1) {
                // Import the node into the target document
                const nodeToAppend = document.importNode(node, true); // true 表示深拷贝所有子节点

                // 将导入的节点添加到 svgNode 中
                // 从后往前遍历并 appendChild 可以保持原始顺序，或者从前往后遍历，append之后节点会自动移动
                svgNode.appendChild(nodeToAppend);
            }
        }

        // console.log('SVG Node 添加解析后的所有 SVG 字符串内容后:\n', xmlSerializer.serializeToString(svgNode));
    } else {
        console.error("未能获取到 SVG 容器节点或解析内容失败！");
    }
    const outputPath = path.join("./", `${filename}.svg`);
    let xml = xmlSerializer.serializeToString(svgNode);
    // console.log('SVG Node 转换为字符串后:\n', xml);
    fs.writeFileSync(outputPath, xml);
}
