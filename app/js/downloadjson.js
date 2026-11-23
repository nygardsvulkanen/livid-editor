var NODOWNLOAD = false;
var cleanUp = function(a) {
  a.textContent = 'Downloaded';
  a.dataset.disabled = true;

  // Need a small delay for the revokeObjectURL to work properly.
  setTimeout(function() {
    window.URL.revokeObjectURL(a.href);
  }, 1500);
};

var downloadFile = function() {
  var container = document.querySelector('#container');
  var output = container.querySelector('output');
  var MIME_TYPE = 'text/plain';
    
  window.URL = window.webkitURL || window.URL;
  var prevLink = output.querySelector('a');
  if (prevLink) {
    window.URL.revokeObjectURL(prevLink.href);
    output.innerHTML = '';
  }
  //test for and add .json if necessary:
  var filename = container.querySelector('input[type="text"]').value;
  var testext = filename.split(".");
  if(testext.pop() !='json'){
    filename = filename+".json";
  }
  //only store the settings commands (not ACK/NACK leftovers)
  var preset = {};
  for (var k in sx){
    if(/^\d+$/.test(k) && Number(k) < 126 && sx[k] && sx[k].length) preset[k] = sx[k];
  }
  preset.name = filename;
  preset.id = pid;
  preset.mfg = mfg;
    
  var tojson = JSON.stringify(preset,null,'\t');
  var bb = new Blob([tojson], {type: MIME_TYPE});
  var a = document.createElement('a');
  a.download = filename;
  a.href = window.URL.createObjectURL(bb);
  if(NODOWNLOAD){
    a.textContent = 'Right click here to save';
  }else{
    a.textContent = 'Click to Download';
  }
  a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');

  output.appendChild(a);
  a.onclick = function(e) {
    if ('disabled' in this.dataset) {
      return false;
    }

    cleanUp(this);
  };
  if(!NODOWNLOAD){
    a.click(); //start the download straight away instead of needing a second click
    a.textContent = 'Saved '+filename;
  }
};