const wrappers = document.querySelectorAll('.render-unit-wrapper');
const html = wrappers[1].innerHTML;

// 替换相对URL为绝对URL
const fullHtml = html.replace(/src="/g, 'src="https://internal-api-drive-stream.feishu.cn');

fullHtml;