var s = document.createElement('style');
s.textContent = '@media print { [data-type="print-forbidden-placeholder"] { display: none !important; } body { display: block !important; visibility: visible !important; } .bear-virtual-renderUnit-placeholder { display: none !important; } }';
document.head.appendChild(s);
console.log('All print restrictions removed');