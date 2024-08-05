if (typeof window !== 'undefined') {
  const handleClipboard = e => { 
    const selection = window.getSelection().toString();  
    let newClipboard = "Security Alert: You are not allowed to copy except where you see the 'copy' icon!";
    if (selection.slice(0,7) === ':yakkl:') {
      newClipboard = selection.slice(7);
    }
    // const newClipboard = `${selection}\n\n${copyright}\n${source}`; 
    e.clipboardData.setData('text/plain', newClipboard); 
    e.preventDefault(); 
  };

  window.document.addEventListener('copy', handleClipboard);
}
