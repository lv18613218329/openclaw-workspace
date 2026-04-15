// 移除飞书的打印保护
const style = document.createElement('style');
style.textContent = `
  @media print {
    body { display: block !important; }
    .bear-virtual-renderUnit-placeholder { display: none !important; }
    .gpf-biz-action-manager-forbidden-placeholder { display: none !important; }
    .render-unit-wrapper { display: block !important; }
  }
`;
document.head.appendChild(style);
console.log('打印保护已移除！现在可以打印了');