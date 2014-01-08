
function TorrentMgr()
{
  this.torrents = new Array();
};

TorrentMgr.prototype.chooseTorrentFile = function()
{
  var self = this;
  chrome.fileSystem.chooseEntry({
    type: "openFile",
    accepts: [{
      description: ".torrent file",
      extensions: ["torrent"]
    }]
  }, function(fileEntry){ self.readTorrentFileData(fileEntry); });
};

TorrentMgr.prototype.readTorrentFileData = function(fileEntry)
{
  if(fileEntry == undefined)
  {
    console.log("User cancelled.");
    return; /* cancelled */
  }
  console.log(this);
  var self = this;
  fileEntry.file(function(file) {
    var reader = new FileReader();
    reader.onload = function(e){ self.parseTorrentFileData(e); };
    reader.readAsBinaryString(file);
  });
};

TorrentMgr.prototype.parseTorrentFileData = function(e)
{
  var torrent = Bencode.decode(e.target.result);
  console.log(torrent);
  this.createWindow(torrent);
};

TorrentMgr.prototype.createWindow = function(torrent)
{
  chrome.app.window.create("html/addTorrentWnd.html", {
    "bounds": {
      "width": 600,
      "height": 400
    }
  });
};

TorrentMgr.prototype.addTorrent = function(data)
{
  
};